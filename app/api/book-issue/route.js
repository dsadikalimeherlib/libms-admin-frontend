export async function POST(req) {
    try {
        const authHeader = req.headers.get("authorization");

        if (!authHeader) {
            return Response.json(
                { error: "Missing Authorization header" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { doc, action = "Submit" } = body;

        if (!doc) {
            return Response.json(
                { error: "Missing doc in request body" },
                { status: 400 }
            );
        }

        const params = new URLSearchParams({
            doc: JSON.stringify(doc),
            action: action
        });

        const res = await fetch(
            "https://libms-dev.aakvaerp.com/api/method/frappe.desk.form.save.savedocs",
            {
                method: "POST",
                headers: {
                    Authorization: authHeader,
                    Accept: "application/json",
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "X-Requested-With": "XMLHttpRequest",
                },
                body: params.toString(),
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
