export async function GET(req) {
    try {
        const authHeader = req.headers.get("authorization");

        if (!authHeader) {
            return Response.json(
                { error: "Missing Authorization header" },
                { status: 401 }
            );
        }

        const { searchParams } = req.nextUrl;
        const doctype = searchParams.get("doctype") || "Asset";
        const name = searchParams.get("name");

        if (!name) {
            return Response.json(
                { error: "Missing 'name' query parameter" },
                { status: 400 }
            );
        }

        const params = new URLSearchParams({
            doctype,
            name,
            _: Date.now().toString(),
        });

        const res = await fetch(
            `https://libms-dev.aakvaerp.com/api/method/frappe.desk.form.load.getdoc?${params.toString()}`,
            {
                method: "GET",
                headers: {
                    Authorization: authHeader,
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-Frappe-Doctype": doctype,
                    "X-Frappe-CMD": "",
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
