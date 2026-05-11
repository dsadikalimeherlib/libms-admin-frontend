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
            "https://libms-dev.aakvaerp.com/api/method/frappe.client.validate_link",
            {
                method: "POST",

                headers: {
                    Authorization: authHeader,
                    Accept: "application/json",
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "X-Frappe-Doctype": "Member",
                    "X-Requested-With": "XMLHttpRequest",
                },

                body: new URLSearchParams({
                    doctype: "Member",
                    docname: req.nextUrl.searchParams.get("text"),
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