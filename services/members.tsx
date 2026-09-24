import { apiCall } from "./api";
import { redirectToLogin } from "@/lib/utils";



export const validateMembers = async ({
    text = '',
    doctype = 'Member',
    ignore_user_permissions = 0,
    reference_doctype = 'Book Transaction',
    page_length = 25,
    link_fieldname = 'member',
    filters = { membership_status: 'Active' },
    fields_to_fetch = [
        "member_name",
        "membership_status",
        "mobile",
    ],
}: {
    text: string;
    doctype?: string;
    ignore_user_permissions?: string | number;
    reference_doctype?: string;
    page_length?: string | number;
    link_fieldname?: string;
    filters?: Record<string, unknown> | string;
    fields_to_fetch?: string[] | string;
}) => {
    const data = await apiCall(`/api/method/frappe.client.validate_link_and_fetch`, {
        method: "POST",
        headers: {
            "X-Frappe-Doctype": doctype,
        },
        body: new URLSearchParams({
            txt: text,
            doctype,
            ignore_user_permissions: String(ignore_user_permissions),
            reference_doctype,
            page_length: String(page_length),
            link_fieldname,
            filters: typeof filters === "string" ? filters : JSON.stringify(filters),
            docname: text,
            fields_to_fetch: typeof fields_to_fetch === "string" ? fields_to_fetch : JSON.stringify(fields_to_fetch),
        }),
    });

    if (data.message && typeof data.message === "object") {
        return {
            name: text,
            ...data.message,
        };
    }

    return data.message;
}

export const validateMemberTransaction = async ({ text = '' }: { text: string }) => {
    const data = await apiCall(`/api/method/library_management.library_management.doctype.book_transaction.book_transaction.membership_validate`, {
        method: "POST",
        body: new URLSearchParams({
            name: text,
        }),
    });

    return data.message;
}

export const getMemberImage = async ({ docname }: { docname: string }) => {
    const data = await apiCall(`/api/method/frappe.client.get_value?doctype=Member&fieldname=photo&filters=` + docname + "&_=" + Date.now(), {
        method: "GET"
    });

    return data.message;
}

export const getMemberCustomer = async ({ docname }: { docname: string }) => {
    const data = await apiCall(`/api/method/frappe.client.get_value?doctype=Member&fieldname=customer&filters=` + docname + "&_=" + Date.now(), {
        method: "GET"
    });

    return data.message;
}

export const validateUserRoles = async () => {
    const data = await apiCall(`/api/method/library_management.api.api.validate_user_roles`, {
        method: "POST"
    });

    return data.message;
}

export const getMemberList = async ({ docname, generateBill = true }: { docname: string, generateBill?: boolean }) => {
    const data = await apiCall(`/api/method/frappe.client.get_list`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            doctype: "Sales Invoice",
            filters: {
                customer: docname,
                docstatus: 1,
                outstanding_amount: [">", 0]
            },
            fields: ["name", "outstanding_amount"]
        })
    });

    if (data.message && data.message.length > 0 && generateBill) {
        const paymentEntryRes = await get_payment_entry({
            dt: "Sales Invoice",
            dn: data.message[0].name
        });
        return paymentEntryRes;
    }

    return data.message;
}

export const get_payment_entry = async ({ dt, dn }: { dt: string, dn: string }) => {
    const data = await apiCall(`/api/method/erpnext.accounts.doctype.payment_entry.payment_entry.get_payment_entry`, {
        method: "POST",
        body: new URLSearchParams({
            dt: dt,
            dn: dn,
        }),
    });

    const insertRes = await getClientInsert({ doc: data.message });

    return insertRes;
}

export const getClientInsert = async ({ doc }: { doc: any }) => {
    if (doc) {
        doc.reference_no = "123";
        const today = new Date();
        doc.reference_date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    const data = await apiCall(`/api/method/frappe.client.insert`, {
        method: "POST",
        body: new URLSearchParams({
            doc: JSON.stringify(doc),
        }),
    });

    if (data.message && data.message.name) {
        window.open(`${process.env.NEXT_PUBLIC_API_URL}/app/payment-entry/${data.message.name}/`, "_blank", "noopener,noreferrer");
    }

    return data.message;
}