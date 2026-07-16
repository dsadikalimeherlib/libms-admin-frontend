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
    barcode = "",
    action = "Submit",
    savedDocName,
    otp,
    otp_verified
}: {
    member: any;
    queuedBooks: any[];
    barcode?: string;
    action?: string;
    savedDocName?: string;
    otp?: string;
    otp_verified?: number;
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

    let doc: any;

    if (savedDocName) {
        const getRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/method/frappe.client.get?doctype=Book+Transaction&name=${savedDocName}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    Accept: "application/json",
                },
            }
        );
        const getData = await getRes.json();

        if (!getRes.ok) {
            throw new Error(getData.error || "Failed to fetch existing transaction");
        }

        doc = getData.message;
        if (otp) {
            doc.otp = otp;
            doc.otp_verified = otp_verified;
        }
    } else {
        const docName = `new-book-transaction-${Math.random().toString(36).substring(2, 12)}`;
        doc = {
            docstatus: 0,
            doctype: "Book Transaction",
            name: docName,
            __islocal: 1,
            __unsaved: 1,
            transaction_type: "Issue",
            member: member.name,
            member_name: member.member_name || member.name,
            membership_status: member.membership_status || "Active",
            mobile: member.mobile || "",
            otp: otp || null,
            otp_verified: otp_verified,
            issued_book: 0,
            scan_barcode: barcode,
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
                parent: docName,
                parentfield: "book_transaction_detail",
                parenttype: "Book Transaction",
                idx: idx + 1
            }))
        };
    }

    const params = new URLSearchParams({
        doc: JSON.stringify(doc),
        action: action,
    });

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/method/frappe.desk.form.save.savedocs`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
            },
            body: params.toString(),
        }
    );

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "Failed to submit book issue transaction");
    }

    const returnedDoc = data.docs?.[0] || data.message || {};

    return {
        name: data.docinfo?.name || returnedDoc.name || "",
        member: {
            name: returnedDoc.member_name || member.member_name || member.name
        },
        rows: returnedDoc.book_transaction_detail || queuedBooks,
        otp_verified: returnedDoc.otp_verified
    };
};

export const submitBookReturn = async ({
    member,
    assetData,
    totalDueCharges = 0,
}: {
    member: any;
    assetData: AssetByBarcodeMessage;
    totalDueCharges?: number;
}) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    const { access_token } = JSON.parse(token);

    const formatDate = (isoString: string) => {
        const d = new Date(isoString);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const today = formatDate(new Date().toISOString());
    const tempName = `new-book-transaction-${Math.random().toString(36).substring(2, 12)}`;
    const rowName = Math.random().toString(36).substring(2, 12);

    const md = assetData.member_details!;

    const doc = {
        docstatus: 0,
        doctype: "Book Transaction",
        name: tempName,
        __islocal: 1,
        __unsaved: 1,
        transaction_type: "Return",
        member: member.name,
        member_name: member.member_name || member.name,
        membership_status: member.membership_status || "Active",
        mobile: member.mobile || "",
        otp_verified: 0,
        scan_barcode: "",
        create_invoice: 0,
        total_due_charges: totalDueCharges,
        book_transaction_detail: [],
        renew_book_details: [],
        return_book_details: [
            {
                docstatus: 0,
                doctype: "Return Book Details",
                name: rowName,
                __islocal: 1,
                __unsaved: 1,
                access_no: assetData.asset_id,
                book_title: assetData.asset_name,
                transaction_date: md.transaction_date,
                due_date: md.due_date,
                return_date: today,
                due_charges: 0,
                transaction_no: md.name,
                parent: tempName,
                parentfield: "return_book_details",
                parenttype: "Book Transaction",
                idx: 1,
            },
        ],
    };

    const params = new URLSearchParams({
        doc: JSON.stringify(doc),
        action: "Submit",
    });

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/method/frappe.desk.form.save.savedocs`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
            },
            body: params.toString(),
        }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to submit return transaction");
    return data.docs?.[0] || data.message || {};
};

export const submitBookRenew = async ({
    member,
    assetData,
    totalDueCharges = 0,
}: {
    member: any;
    assetData: AssetByBarcodeMessage;
    totalDueCharges?: number;
}) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    const { access_token } = JSON.parse(token);

    const formatDate = (isoString: string) => {
        const d = new Date(isoString);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const today = formatDate(new Date().toISOString());
    const renewDueDate = formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
    const tempName = `new-book-transaction-${Math.random().toString(36).substring(2, 12)}`;
    const rowName = Math.random().toString(36).substring(2, 12);

    const md = assetData.member_details!;

    const doc = {
        docstatus: 0,
        doctype: "Book Transaction",
        name: tempName,
        __islocal: 1,
        __unsaved: 1,
        transaction_type: "Renew",
        member: member.name,
        member_name: member.member_name || member.name,
        membership_status: member.membership_status || "Active",
        mobile: member.mobile || "",
        otp_verified: 0,
        scan_barcode: "",
        create_invoice: 0,
        total_due_charges: totalDueCharges,
        book_transaction_detail: [],
        return_book_details: [],
        renew_book_details: [
            {
                docstatus: 0,
                doctype: "Renew Book Details",
                name: rowName,
                __islocal: 1,
                __unsaved: 1,
                access_no: assetData.asset_id,
                book_title: assetData.asset_name,
                issue_date: md.transaction_date,
                previous_due_date: md.due_date,
                return_date: today,
                renew_due_date: renewDueDate,
                due_charges: 0,
                transaction_no: md.name,
                parent: tempName,
                parentfield: "renew_book_details",
                parenttype: "Book Transaction",
                idx: 1,
            },
        ],
    };

    const params = new URLSearchParams({
        doc: JSON.stringify(doc),
        action: "Submit",
    });

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/method/frappe.desk.form.save.savedocs`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
            },
            body: params.toString(),
        }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to submit renew transaction");
    return data.docs?.[0] || data.message || {};
};

export type AssetByBarcodeMessage = {
    asset_id: string;
    item_code: string;
    asset_name: string;
    status: string;
    volume: string;
    authors: string[];
    languages: string[];
    total_due_charges?: number;
    transactionDate?: string;
    dueDate?: string;
    member_details: {
        member: string;
        name: number;
        transaction_date: string;
        due_date: string;
        book_title: string;
    } | null;
};

export const getAssetByBarcode = async ({
    barcode,
    member,
    transactionType,
}: {
    barcode: string;
    member: string;
    transactionType: "Issue" | "Return" | "Renew";
}): Promise<AssetByBarcodeMessage> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("No token found");
    const { access_token } = JSON.parse(token);

    const tempName = `new-book-transaction-${Math.random().toString(36).substring(2, 12)}`;

    const selfDoc = {
        docstatus: 0,
        doctype: "Book Transaction",
        name: tempName,
        __islocal: 1,
        __unsaved: 1,
        transaction_type: transactionType,
        otp_verified: 0,
        book_transaction_detail: [],
        return_book_details: [],
        renew_book_details: [],
        create_invoice: 0,
        member,
        scan_barcode: barcode,
        idx: 0,
        total_due_charges: 0,
    };

    const body = new URLSearchParams({
        self: JSON.stringify(selfDoc),
        docs: JSON.stringify(selfDoc),
        method: "get_asset_by_barcode",
        args: JSON.stringify({ self: selfDoc }),
    });

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/method/run_doc_method`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "X-Frappe-CMD": "",
        },
        body: body.toString(),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(
        typeof data.message === 'string' ? data.message : (data.error || "Failed to fetch asset by barcode")
    );

    // The Frappe method returns the book status string (e.g. "Available") as `message`,
    // while the actual asset details it populated on the doc are in `data.docs[0]`.
    let message: AssetByBarcodeMessage;

    if (data.message && typeof data.message === 'object') {
        // Ideal case: message is already the full asset details object

        if (!data.message.asset_id) {
            throw new Error("Book is not available");
        }
        message = data.message as AssetByBarcodeMessage;
    } else {
        // Common case: message is a status string — extract fields from the returned doc
        const doc = data.docs?.[0];
        if (!doc) throw new Error("No asset details returned for this barcode");
        if (!data.message.asset_id) {
            throw new Error("Book is not available");
        }
        message = {
            asset_id: doc.scan_barcode || barcode,
            item_code: doc.item_code || "",
            asset_name: doc.asset_name || doc.scan_barcode || barcode,
            status: typeof data.message === 'string' ? data.message : (doc.status || ""),
            volume: doc.volume || "",
            authors: doc.authors || [],
            languages: doc.languages || [],
            member_details: doc.member_details ?? null,
            total_due_charges: doc.total_due_charges,
        };
    }

    // total_due_charges may also live on docs[0] when message was an object — merge it in
    const totalDueCharges = data.docs?.[0]?.total_due_charges;
    if (totalDueCharges !== undefined && message.total_due_charges === undefined) {
        message.total_due_charges = totalDueCharges;
    }

    return message;
};

export const validateMemberToIssueBook = async ({
    member,
}: {
    member: string;
}) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("No token found");
    const { access_token } = JSON.parse(token);

    const body = new URLSearchParams({
        member: member,
    });

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/method/book_allowed_issue.allowed_book`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "X-Frappe-CMD": "",
        },
        body: body.toString(),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || data.error || "Failed to validate member for issue");

    return data;
};

export const generateOTP = async ({
    docname,
}: {
    docname: string;
}) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    const { access_token } = JSON.parse(token);

    const body = new URLSearchParams({ docname });

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/method/library_management.library_management.doctype.book_transaction.book_transaction.generate_otp`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'X-Frappe-CMD': '',
            },
            body: body.toString(),
        }
    );

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || data.error || 'Failed to generate OTP');

    return data;
};

export const getBookTransaction = async ({
    docname,
}: {
    docname: string;
}) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    const { access_token } = JSON.parse(token);

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/method/frappe.desk.form.load.getdoc?doctype=Book+Transaction&name=${docname}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: "application/json",
            },
        }
    );

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "Failed to fetch transaction details");
    }

    return data;
};


export const countBooksIssued = async ({
    member

}: {
    member: string;
}) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    const { access_token } = JSON.parse(token);

    const body = new URLSearchParams({
        member
    });

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/method/library_management.library_management.doctype.book_reservation.book_reservation.count_books_issued`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'X-Frappe-CMD': '',
            },
            body: body.toString(),
        }
    );

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || data.error || 'Failed to count books issued');

    return data;
}
