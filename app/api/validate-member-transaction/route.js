export async function GET(req) {
    try {
        const authHeader = req.headers.get("authorization");

        if (!authHeader) {
            return Response.json(
                { error: "Missing Authorization header" },
                { status: 401 }
            );
        }

        const url = new URL(req.url);
        const text = url.searchParams.get("text") || "";

        const res = await fetch(
            "https://libms-dev.aakvaerp.com/api/method/library_management.library_management.doctype.book_transaction.book_transaction.membership_validate",
            {
                method: "POST",
                headers: {
                    Authorization: authHeader, // Bearer token passed directly
                },
                body: new URLSearchParams({
                    name: text,
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