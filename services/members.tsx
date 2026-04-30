
export const getMembers = async ({ text = '' }: { text: string }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found');
        return;
    }

    const { access_token } = JSON.parse(token);

    const params = new URLSearchParams();
    if (text) {
        params.append('text', text);
    }

    const response = await fetch(`/api/members?${params.toString()}`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    })
        .then(res => res.json())
        .then(data => {
            return data.message;
        });
    return response;
}