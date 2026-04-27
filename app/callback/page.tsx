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
        <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-3rem)] items-center justify-center">
                <Card className="panel-surface w-full max-w-lg border-border/70 shadow-panel">
                    <CardHeader className="space-y-3 p-6">
                        <CardTitle>Completing sign in</CardTitle>
                        <CardDescription>We are securely completing your login and redirecting you to the dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/60 p-4">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Logging you in and preparing your workspace…</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            If this takes longer than expected, please wait a moment or refresh the page.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

export default function CallbackPage() {
    return (
        <Suspense fallback={<p>Loading sign in...</p>}>
            <CallbackContent />
        </Suspense>
    );
}