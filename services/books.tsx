import { Book } from "../lib/mock-library-api";


const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const submitFrappeDocument = async (doc: any, action: string, access_token: string, errorMessage: string) => {
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
        throw new Error(data.error || errorMessage);
    }

    return data;
};

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


import { redirectToLogin } from "@/lib/utils";

export const submitBookTransaction = async ({
    transaction_type,
    member,
    queuedBooks,
    queuedAssets,
    barcode = "",
    totalDueCharges = 0,
    createInvoice = 0,
    action = "Submit",
    savedDocName,
    otp,
    otp_verified
}: {
    transaction_type: "Issue" | "Return";
    member: any;
    queuedBooks?: any[];
    queuedAssets?: import('./books').AssetByBarcodeMessage[];
    barcode?: string;
    totalDueCharges?: number;
    createInvoice?: number;
    action?: string;
    savedDocName?: string;
    otp?: string;
    otp_verified?: number;
}) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    const { access_token } = JSON.parse(token);

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
        const today = formatDate(new Date().toISOString());
        const docName = `new-book-transaction-${Math.random().toString(36).substring(2, 12)}`;

        if (transaction_type === "Issue") {
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
                book_transaction_detail: (queuedBooks || []).map((book: any, idx: number) => ({
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
        } else {
            doc = {
                docstatus: 0,
                doctype: "Book Transaction",
                name: docName,
                __islocal: 1,
                __unsaved: 1,
                transaction_type: "Return",
                member: member.name,
                member_name: member.member_name || member.name,
                membership_status: member.membership_status || "Active",
                mobile: member.mobile || "",
                otp: otp || null,
                otp_verified: otp_verified || 0,
                scan_barcode: "",
                create_invoice: createInvoice,
                total_due_charges: totalDueCharges,
                book_transaction_detail: [],
                renew_book_details: [],
                return_book_details: (queuedAssets || []).map((asset: any, idx: number) => {
                    const md = asset.member_details;
                    return {
                        docstatus: 0,
                        doctype: "Return Book Details",
                        name: `new-return-book-details-${Math.random().toString(36).substring(2, 12)}`,
                        __islocal: 1,
                        __unsaved: 1,
                        access_no: asset.asset_id,
                        book_title: asset.asset_name,
                        transaction_date: md?.transaction_date || today,
                        due_date: md?.due_date || today,
                        return_date: today,
                        due_charges: 0,
                        transaction_no: md?.name || "",
                        parent: docName,
                        parentfield: "return_book_details",
                        parenttype: "Book Transaction",
                        idx: idx + 1,
                    };
                }),
            };
        }
    }

    const data = await submitFrappeDocument(doc, action, access_token, `Failed to submit ${transaction_type.toLowerCase()} transaction`);
    const returnedDoc = data.docs?.[0] || data.message || {};

    if (transaction_type === "Issue") {
        return {
            name: data.docinfo?.name || returnedDoc.name || "",
            member: {
                name: returnedDoc.member_name || member.member_name || member.name
            },
            rows: returnedDoc.book_transaction_detail || queuedBooks,
            otp_verified: returnedDoc.otp_verified
        };
    } else {
        return {
            name: data.docinfo?.name || returnedDoc.name || "",
            otp_verified: returnedDoc.otp_verified
        };
    }
};


export const submitBookRenew = async ({
    member,
    assetData,
    totalDueCharges = 0,
    createInvoice = 0,
}: {
    member: any;
    assetData: AssetByBarcodeMessage;
    totalDueCharges?: number;
    createInvoice?: number;
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
        create_invoice: createInvoice,
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

    const data = await submitFrappeDocument(doc, "Submit", access_token, "Failed to submit renew transaction");
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

export interface SearchLinkResult {
    value: string;
    description: string;
}


export const searchFrappeLink = async ({
    txt,
    doctype,
    reference_doctype,
    page_length = 25,
    filters
}: {
    txt: string;
    doctype: string;
    reference_doctype: string;
    page_length?: number;
    filters?: Record<string, any>;
}): Promise<{ message: SearchLinkResult[] }> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    const { access_token } = JSON.parse(token);

    const body: Record<string, string> = {
        txt,
        doctype,
        ignore_user_permissions: "0",
        reference_doctype,
        page_length: page_length.toString()
    };

    if (filters) {
        body.filters = JSON.stringify(filters);
    }

    const params = new URLSearchParams(body);

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/method/frappe.desk.search.search_link`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'X-Frappe-CMD': '',
            },
            body: params.toString(),
        }
    );

    if (res.status === 401) {
        redirectToLogin(true);
        return { message: [] };
    }

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || data.error || 'Failed to search');

    return data;
};

export interface SelectBookResult {
    name: string;
    asset_name: string;
    status: string;
}

export const selectBook = async ({
    item_code,
    limit = 20
}: {
    item_code: string;
    limit?: number;
}): Promise<{ message: SelectBookResult[] }> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    const { access_token } = JSON.parse(token);

    const queryParams = new URLSearchParams({
        doctype: "Asset",
        fields: JSON.stringify(["name", "asset_name", "status"]),
        filters: JSON.stringify({ item_code }),
        limit: limit.toString()
    });

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/method/frappe.desk.reportview.get_list?${queryParams.toString()}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        }
    );

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || data.error || 'Failed to select books');

    return data;
};

export const submitBookReservation = async ({
    member,
    book,
    bookTitle,
    reservationDate,
    reservedAssets,
    reservation_remarks,
    issuedCount = 0
}: {
    member: any;
    book: string;
    bookTitle: string;
    reservationDate: string;
    reservedAssets: SelectBookResult[];
    reservation_remarks?: string;
    issuedCount?: number;
}) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    let access_token = "";
    let owner = "test_user@gmail.com";
    try {
        const parsed = JSON.parse(token);
        access_token = parsed.access_token;
        if (parsed.user_id) owner = parsed.user_id;
    } catch(e) {}

    const docName = `new-book-reservation-${Math.random().toString(36).substring(2, 12)}`;

    const doc: any = {
        docstatus: 0,
        doctype: "Book Reservation",
        name: docName,
        __islocal: 1,
        __unsaved: 1,
        owner,
        status: "Requested",
        reservation_date: reservationDate,
        book_reservation_details: reservedAssets.map((asset, idx) => ({
            docstatus: 0,
            doctype: "Book Reservation Details",
            name: `new-book-reservation-details-${Math.random().toString(36).substring(2, 12)}`,
            __islocal: 1,
            __unsaved: 1,
            owner,
            parent: docName,
            parentfield: "book_reservation_details",
            parenttype: "Book Reservation",
            idx: idx + 1,
            access_no: asset.name,
            book_name: asset.asset_name,
            book_status: asset.status
        })),
        member_name: member.member_name || member.name,
        mobile: member.mobile || "",
        notify_by: "None",
        member: member.name,
        issued_book: issuedCount,
        book_title: bookTitle,
        book: book
    };

    if (reservation_remarks) {
        doc.reservation_remarks = reservation_remarks;
    }

    const data = await submitFrappeDocument(doc, "Save", access_token, "Failed to submit book reservation");
    return data.docs?.[0] || data.message || {};
};
