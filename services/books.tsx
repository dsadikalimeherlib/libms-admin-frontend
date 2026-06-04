import { Book } from "../lib/mock-library-api";

export const getBookTransactionDetails = async ({
    barcode,
    member,
    transaction_type = "Issue",
}: {
    barcode: string;
    member: string;
    transaction_type?: string;
}): Promise<Book> => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No token found');
    }

    const { access_token } = JSON.parse(token);

    const res = await fetch("/api/book-transaction", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({ barcode, member, transaction_type }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "Failed to look up book details");
    }

    if (!data.message) {
        throw new Error("No asset details returned for this barcode");
    }

    return {
        barcode: data.message.asset_id,
        accessNo: data.message.asset_id,
        title: data.message.asset_name,
        author: data.message.authors?.join(", ") || "",
        language: data.message.languages?.join(", ") || "",
        volume: data.message.volume || "",
    };
}

export const submitBookIssue = async ({
    member,
    queuedBooks,
}: {
    member: any;
    queuedBooks: any[];
}) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No token found');
    }

    const { access_token } = JSON.parse(token);

    // Format dates to YYYY-MM-DD
    const formatDate = (isoString: string) => {
        const d = new Date(isoString);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const tempName = `new-book-transaction-${Math.random().toString(36).substring(2, 12)}`;

    const doc = {
        docstatus: 0,
        doctype: "Book Transaction",
        name: tempName,
        __islocal: 1,
        __unsaved: 1,
        transaction_type: "Issue",
        member: member.name,
        member_name: member.member_name || member.name,
        membership_status: member.membership_status || "Active",
        mobile: member.mobile || "",
        otp_verified: 0,
        issued_book: 0,
        scan_barcode: "",
        create_invoice: 0,
        total_due_charges: 0,
        book_transaction_detail: queuedBooks.map((book, idx) => ({
            docstatus: 0,
            doctype: "Book Transaction Detail",
            name: `new-book-transaction-detail-${Math.random().toString(36).substring(2, 12)}`,
            __islocal: 1,
            __unsaved: 1,
            access_no: book.accessNo,
            book_title: book.title,
            author: book.author || "",
            language: book.language || "",
            transaction_date: formatDate(book.transactionDate),
            due_date: formatDate(book.dueDate),
            status: "Available",
            parent: tempName,
            parentfield: "book_transaction_detail",
            parenttype: "Book Transaction",
            idx: idx + 1
        }))
    };

    const res = await fetch("/api/book-issue", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({ doc, action: "Submit" }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "Failed to submit book issue transaction");
    }

    const returnedDoc = data.docs?.[0] || data.message || {};

    return {
        member: {
            name: returnedDoc.member_name || member.member_name || member.name
        },
        rows: returnedDoc.book_transaction_detail || queuedBooks
    };
};

export const getAssetDetail = async (name: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("No token found");
    const { access_token } = JSON.parse(token);

    const res = await fetch(`/api/asset-detail?name=${name}`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    });

    if (!res.ok) throw new Error("Failed to fetch asset");
    const data = await res.json();

    if (data.error) throw new Error(data.error);
    if (!data.docs?.[0]) throw new Error("Asset not found");

    const asset = data.docs[0];
    return {
        barcode: asset.name,
        accessNo: asset.access_no,
        title: asset.title,
        author: asset.authors?.join(", ") || "",
        language: asset.languages?.join(", ") || "",
        volume: asset.volume || "",
    };
};