export const getFrappeToken = async ({ code }: { code: string }) => {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/method/frappe.integrations.oauth2.get_token`,
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
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/callback`,
            }),
        }
    );

    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error(`Invalid JSON from Frappe: ${text}`);
    }

    if (!response.ok) {
        throw new Error(data.error || 'Failed to get Frappe token');
    }

    return data;
};