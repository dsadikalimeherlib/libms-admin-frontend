export async function GET(req) {
    try {
        const authHeader = req.headers.get("authorization");

        if (!authHeader) {
            return Response.json(
                { error: "Missing Authorization header" },
                { status: 401 }
            );
        }

        const barcode = req.nextUrl.searchParams.get("barcode");
        const member = req.nextUrl.searchParams.get("member") || "";
        const transaction_type = req.nextUrl.searchParams.get("transaction_type") || "Issue";

        if (!barcode) {
            return Response.json(
                { error: "Missing barcode parameter" },
                { status: 400 }
            );
        }

        const doc = {
            docstatus: 0,
            doctype: "Book Transaction",
            name: "new-book-transaction-temp",
            __islocal: 1,
            __unsaved: 1,
            transaction_type: transaction_type,
            otp_verified: 0,
            book_transaction_detail: [],
            return_book_details: [],
            renew_book_details: [],
            create_invoice: 0,
            member: member,
            scan_barcode: barcode,
            idx: 0,
            total_due_charges: 0
        };

        const docString = JSON.stringify(doc);

        const params = new URLSearchParams({
            self: docString,
            docs: docString,
            method: "get_asset_by_barcode",
            args: JSON.stringify({ self: doc })
        });

        const res = await fetch(
            "https://libms-dev.aakvaerp.com/api/method/run_doc_method",
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
        const { barcode, member, transaction_type = "Issue" } = body;

        if (!barcode) {
            return Response.json(
                { error: "Missing barcode" },
                { status: 400 }
            );
        }

        const doc = {
            docstatus: 0,
            doctype: "Book Transaction",
            name: "new-book-transaction-temp",
            __islocal: 1,
            __unsaved: 1,
            transaction_type: transaction_type,
            otp_verified: 0,
            book_transaction_detail: [],
            return_book_details: [],
            renew_book_details: [],
            create_invoice: 0,
            member: member || "",
            scan_barcode: barcode,
            idx: 0,
            total_due_charges: 0
        };

        const docString = JSON.stringify(doc);

        const params = new URLSearchParams({
            self: docString,
            docs: docString,
            method: "get_asset_by_barcode",
            args: JSON.stringify({ self: doc })
        });

        const res = await fetch(
            "https://libms-dev.aakvaerp.com/api/method/run_doc_method",
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