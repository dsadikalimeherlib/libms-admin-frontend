import { redirectToLogin } from "@/lib/utils";

export const apiCall = async (
    endpoint: string,
    options: RequestInit = {}
) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("You're logged out. Please log-in to continue");

    const { access_token } = JSON.parse(token);

    const defaultHeaders: Record<string, string> = {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    if (options.method === 'POST' || options.method === 'PUT') {
        defaultHeaders['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
        defaultHeaders['X-Frappe-CMD'] = '';
    }

    const headers = {
        ...defaultHeaders,
        ...options.headers,
    };

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (res.status === 401) {
        redirectToLogin(true);
        throw new Error('Session expired. Please log in again.');
    }

    const data = await res.json();

    let finalErrorMessage = data.error?.message || data.error || data.message || 'Failed to fetch data';
    if (data._server_messages) {
        try {
            const messages = typeof data._server_messages === 'string' ? JSON.parse(data._server_messages) : data._server_messages;
            if (Array.isArray(messages)) {
                for (let i = messages.length - 1; i >= 0; i--) {
                    try {
                        const msgObj = typeof messages[i] === 'string' ? JSON.parse(messages[i]) : messages[i];
                        if (msgObj && msgObj.message) {
                            finalErrorMessage = `Please contact Library Admin: ${msgObj.message}`;
                            if (msgObj.raise_exception) {
                                break;
                            }
                        }
                    } catch (e) { }
                }
            }
        } catch (e) { }
    }

    if (!res.ok || data.exc) {
        throw new Error(finalErrorMessage);
    }

    return data;
};
