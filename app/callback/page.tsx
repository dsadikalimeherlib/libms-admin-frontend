'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function CallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const code = searchParams.get('code');

        if (code) {
            fetch(`/api/frappe-token?code=${code}`)
                .then(res => res.json())
                .then(data => {
                    console.log('TOKEN:', data);

                    localStorage.setItem('token', JSON.stringify(data));

                    router.push('/');
                });
        }
    }, [searchParams]);

    return <p>Logging you in...</p>;
}