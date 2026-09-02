import { redirectToLogin } from "@/lib/utils";



export const validateMembers = async ({ text = '' }: { text: string }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('No token found');
        return;
    }

    const { access_token } = JSON.parse(token);

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/method/frappe.client.validate_link`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Frappe-Doctype": "Member",
                "X-Requested-With": "XMLHttpRequest",
            },
            body: new URLSearchParams({
                doctype: "Member",
                docname: text,
                fields: JSON.stringify([
                    "member_name",
                    "membership_status",
                    "mobile",
                ]),
            }),
        }
    );

    const data = await res.json();

    if (res.status === 401) {
        redirectToLogin(true);
        return;
    }

    if (!res.ok) {
        throw new Error(data.error || "Failed to validate member");
    }

    return data.message;
}

export const validateMemberTransaction = async ({ text = '' }: { text: string }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('No token found');
        return;
    }

    const { access_token } = JSON.parse(token);

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/method/library_management.library_management.doctype.book_transaction.book_transaction.membership_validate`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
            body: new URLSearchParams({
                name: text,
            }),
        }
    );

    const data = await res.json();

    if (res.status === 401) {
        redirectToLogin(true);
        return;
    }

    if (!res.ok) {
        throw new Error(data.error || "Failed to validate member transaction");
    }

    return data.message;
}

export const getMemberImage = async ({ docname }: { docname: string }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('No token found');
        return;
    }

    const { access_token } = JSON.parse(token);

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/method/frappe.client.get_value?doctype=Member&fieldname=photo&filters=` + docname + "&_=" + Date.now(),
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }
    );

    const data = await res.json();

    if (res.status === 401) {
        redirectToLogin(true);
        return;
    }

    if (!res.ok) {
        throw new Error(data.error || "Failed to get member image");
    }

    return data.message;
}

export const getMemberCustomer = async ({ docname }: { docname: string }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('No token found');
        return;
    }

    const { access_token } = JSON.parse(token);

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/method/frappe.client.get_value?doctype=Member&fieldname=customer&filters=` + docname + "&_=" + Date.now(),
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }
    );

    const data = await res.json();

    if (res.status === 401) {
        redirectToLogin(true);
        return;
    }

    if (!res.ok) {
        throw new Error(data.error || "Failed to get member customer");
    }

    return data.message;
}

export const validateUserRoles = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('No token found');
        return;
    }

    const { access_token } = JSON.parse(token);

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/method/library_management.api.api.validate_user_roles`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }
    );

    const data = await res.json();

    if (res.status === 401) {
        redirectToLogin(true);
        return;
    }

    if (!res.ok) {
        throw new Error(data.error || "Failed to validate user roles");
    }

    return data.message;
}

export const getMemberList = async ({ docname, generateBill = true }: { docname: string, generateBill?: boolean }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('No token found');
        return;
    }

    const { access_token } = JSON.parse(token);

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/method/frappe.client.get_list`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access_token}`,
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
        }
    );

    const data = await res.json();

    if (res.status === 401) {
        redirectToLogin(true);
        return;
    }

    if (!res.ok) {
        throw new Error(data.error || "Failed to get sales invoices");
    }

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
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('No token found');
        return;
    }

    const { access_token } = JSON.parse(token);

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/method/erpnext.accounts.doctype.payment_entry.payment_entry.get_payment_entry`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
            },
            body: new URLSearchParams({
                dt: dt,
                dn: dn,
            }),
        }
    );

    const data = await res.json();

    if (res.status === 401) {
        redirectToLogin(true);
        return;
    }

    if (!res.ok) {
        throw new Error(data.error || "Failed to get payment entry");
    }

    const insertRes = await getClientInsert({ doc: data.message });

    return insertRes;
}

export const getClientInsert = async ({ doc }: { doc: any }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('No token found');
        return;
    }

    const { access_token } = JSON.parse(token);

    if (doc) {
        doc.reference_no = "123";
        const today = new Date();
        doc.reference_date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/method/frappe.client.insert`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
            },
            body: new URLSearchParams({
                doc: JSON.stringify(doc),
            }),
        }
    );

    const data = await res.json();

    if (res.status === 401) {
        redirectToLogin(true);
        return;
    }

    if (!res.ok) {
        throw new Error(data.error || "Failed to insert document");
    }

    if (data.message && data.message.name) {
        window.open(`${process.env.NEXT_PUBLIC_API_URL}/app/payment-entry/${data.message.name}/`, "_blank", "noopener,noreferrer");
    }

    return data.message;
}