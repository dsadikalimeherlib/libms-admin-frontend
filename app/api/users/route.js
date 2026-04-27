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
            "https://libms-dev.aakvaerp.com/api/method/frappe.auth.get_logged_user",
            {
                method: "GET",
                headers: {
                    Authorization: authHeader, // Bearer token passed directly
                },
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