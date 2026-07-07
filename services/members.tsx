
const handleUnauthorized = () => {
    localStorage.removeItem("token");
    window.location.href =
        "https://libms-dev.aakvaerp.com/api/method/frappe.integrations.oauth2.authorize" +
        "?client_id=imdsp6muko" +
        "&redirect_uri=http://localhost:3000/callback" +
        "&response_type=code" +
        "&scope=all";
};

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

    if (res.status === 401) {
        handleUnauthorized();
        return;
    }

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

    if (res.status === 401) {
        handleUnauthorized();
        return;
    }

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

    if (res.status === 401) {
        handleUnauthorized();
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
        "https://libms-dev.aakvaerp.com/api/method/frappe.client.get_value?doctype=Member&fieldname=photo&filters=" + docname + "&_=" + Date.now(),
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }
    );

    const data = await res.json();

    if (res.status === 401) {
        handleUnauthorized();
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
        "https://libms-dev.aakvaerp.com/api/method/frappe.client.get_value?doctype=Member&fieldname=customer&filters=" + docname + "&_=" + Date.now(),
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }
    );

    const data = await res.json();

    if (res.status === 401) {
        handleUnauthorized();
        return;
    }

    if (!res.ok) {
        throw new Error(data.error || "Failed to get member customer");
    }

    return data.message;
}
