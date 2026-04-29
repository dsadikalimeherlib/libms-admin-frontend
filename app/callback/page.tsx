'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function CallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const code = searchParams.get('code');

        if (code) {
            fetch(`/api/frappe-token?code=${code}`)
                .then((res) => res.json())
                .then((data) => {
                    localStorage.setItem('token', JSON.stringify(data));
                    router.replace('/dashboard');
                });
        }
    }, [searchParams, router]);

    return (
        <>

            {/* flex items-center justify-center relative overflow-hidden */}
            <main className="auth-backdrop min-h-screen px-4 py-4 sm:px-6 lg:px-8 ">

                <img src="/login-bg.png" className="absolute left-0 top-0 w-full h-auto z-0" /> {/* Background image */}
                <div className="mx-auto   max-w-[500px] flex-col items-center gap-6 lg:flex">

                    <div className="space-y-4 flex flex-col items-center justify-center text-center min-h-[calc(100vh)]">

                        <div className="space-y-8  relative z-10 h-[460px] flex flex-col  bg-[#fff] rounded-lg p-8 shadow-lg">

                            <div className="flex justify-center ">
                                <img src="/logo-2.svg" alt="Library Logo" className="mb-6 w-[300px]" />
                            </div>
                            <div className="loader mx-[123px] my-[107px]"></div>
                        </div>
                    </div>

                    <div className="grid gap-4">

                    </div>


                </div>
            </main>
        </>
    );
}

export default function CallbackPage() {
    return (
        <Suspense fallback={<p>Loading sign in...</p>}>
            <CallbackContent />
        </Suspense>
    );
}