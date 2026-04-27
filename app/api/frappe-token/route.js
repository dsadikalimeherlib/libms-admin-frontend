export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
        return Response.json({ error: 'Missing code' }, { status: 400 });
    }

    try {
        const response = await fetch(
            'https://libms-dev.aakvaerp.com/api/method/frappe.integrations.oauth2.get_token',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    client_id: 'imdsp6muko',
                    client_secret: '2a6bf3c6bc',
                    redirect_uri: 'http://localhost:3000/callback',
                }),
            }
        );

        const text = await response.text(); // 👈 IMPORTANT (not json yet)

        console.log('FRAPPE RAW RESPONSE:', text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            return Response.json(
                {
                    error: 'Invalid JSON from Frappe',
                    raw: text,
                },
                { status: 500 }
            );
        }

        return Response.json(data);
    } catch (err) {
        return Response.json(
            { error: 'Request failed', details: err.message },
            { status: 500 }
        );
    }
}