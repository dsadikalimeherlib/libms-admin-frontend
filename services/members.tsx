
export const getMembers = async ({ text = '' }: { text: string }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found');
        return;
    }

    const { access_token } = JSON.parse(token);

    const res = await fetch(
        "https://libms-dev.aakvaerp.com/api/method/frappe.desk.search.search_link",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
            body: new URLSearchParams({
                txt: text,
                doctype: "Member",
                ignore_user_permissions: "0",
                reference_doctype: "Book Transaction",
                page_length: "25",
                filters: JSON.stringify({ membership_status: "Active" }),
            }),
        }
    );

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "Failed to fetch members");
    }

    return data.message;
}


export const validateMembers = async ({ text = '' }: { text: string }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('No token found');
        return;
    }

    const { access_token } = JSON.parse(token);

    const res = await fetch(
        "https://libms-dev.aakvaerp.com/api/method/frappe.client.validate_link",
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

    if (!res.ok) {
        throw new Error(data.error || "Failed to validate member");
    }

    return data.message;
}

export const validateMemberTransaction = async ({ text = '' }: { text: string }) => {
    const token = localStorage.getItem('token');
    console.log('token111', token);

    if (!token) {
        console.error('No token found');
        return;
    }

    const { access_token } = JSON.parse(token);

    const res = await fetch(
        "https://libms-dev.aakvaerp.com/api/method/library_management.library_management.doctype.book_transaction.book_transaction.membership_validate",
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

    if (!res.ok) {
        throw new Error(data.error || "Failed to validate member transaction");
    }

    return data.message;
}