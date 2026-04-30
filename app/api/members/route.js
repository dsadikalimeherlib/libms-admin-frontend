export async function GET(req) {
    try {
        const authHeader = req.headers.get("authorization");

        if (!authHeader) {
            return Response.json(
                { error: "Missing Authorization header" },
                { status: 401 }
            );
        }

        const res = await fetch(
            "https://libms-dev.aakvaerp.com/api/method/frappe.desk.search.search_link",
            {
                method: "POST",
                headers: {
                    Authorization: authHeader, // Bearer token passed directly
                },
                // txt=&doctype=Member&ignore_user_permissions=0&reference_doctype=Book+Transaction&page_length=25&filters=%7B%22membership_status%22%3A%22Active%22%7D
                body: new URLSearchParams({
                    txt: "",
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
            return Response.json(data, { status: res.status });
        }

        return Response.json(data);
    } catch (error) {
        return Response.json(
            { error: "Server error", details: error.message },
            { status: 500 }
        );
    }
}