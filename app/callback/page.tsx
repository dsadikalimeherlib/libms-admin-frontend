'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function CallbackContent() {
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

                    router.push('/dashboard');
                });
        }
    }, [searchParams]);

    return <p>Logging you in...</p>;
}

export default function CallbackPage() {
    return (
        <Suspense fallback={<p>Loading...</p>}>
            <CallbackContent />
        </Suspense>
    );
}