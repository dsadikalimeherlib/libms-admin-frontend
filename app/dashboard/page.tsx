"use client"
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";

// const Dashboard = () => {

//     const router = useRouter();

//     // Redirect to dashboard if token exists in localStorage
//     useEffect(() => {
//         const token = localStorage.getItem('token');
//         if (!token) {
//             router.push('/');
//         }
//     }, [router]);

//     return (
//         <div className="p-4">
//             <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
//             <p>Welcome to your dashboard! Here you can manage your settings and view your activity.</p>
//         </div>
//     );
// };

// export default Dashboard;

import { useQuery } from "@tanstack/react-query";
import { BookCopy, LogOut, ShieldCheck, TimerReset, Users } from "lucide-react";

import TransactionTabs from "@/components/library/TransactionTabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { getDashboardMetrics } from "@/lib/mock-library-api";

const statCards = [
    {
        key: "activeLoans",
        label: "Active loans",
        icon: BookCopy,
    },
    {
        key: "dueToday",
        label: "Due today",
        icon: TimerReset,
    },
    {
        key: "overdueItems",
        label: "Overdue items",
        icon: ShieldCheck,
    },
    {
        key: "membersServed",
        label: "Members served",
        icon: Users,
    },
] as const;

const Dashboard = () => {
    const { session, signOut } = useAuth();
    const metricsQuery = useQuery({
        queryKey: ["dashboard-metrics"],
        queryFn: getDashboardMetrics,
    });

    const getUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            return;
        }

        const { access_token } = JSON.parse(token);
        fetch("/api/users", {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        })
            .then(res => res.json())
            .then(data => console.log(data));
    }

    return (
        <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
                <header className="panel-surface overflow-hidden bg-hero text-primary-foreground">
                    <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl space-y-4">
                            <span className="data-chip border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
                                Library operations
                            </span>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold sm:text-4xl">Circulation Desk Admin Panel</h1>
                                <p className="max-w-xl text-sm text-primary-foreground/80 sm:text-base">
                                    Validate members, process book movements, and keep the desk moving without losing transaction context.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="rounded-lg border border-primary-foreground/15 bg-primary-foreground/10 px-4 py-3 text-sm text-primary-foreground">
                                <p className="font-semibold">{session?.user.name}</p>
                                <p className="text-primary-foreground/75">
                                    {session?.user.role} · {session?.user.branch}
                                </p>
                            </div>
                            <div onClick={getUser}>Get User</div>
                            <Button variant="secondary" onClick={signOut}>
                                <LogOut />
                                Logout
                            </Button>
                        </div>
                    </div>
                </header>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map(({ key, label, icon: Icon }) => (
                        <article key={key} className="stat-tile">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="section-heading">{label}</p>
                                    <p className="mt-3 text-3xl font-bold text-foreground">
                                        {metricsQuery.isLoading ? "—" : metricsQuery.data?.[key] ?? 0}
                                    </p>
                                </div>
                                <span className="rounded-md bg-muted p-2 text-foreground">
                                    <Icon />
                                </span>
                            </div>
                        </article>
                    ))}
                </section>

                <Card className="panel-surface border-border/70">
                    <CardHeader className="space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="section-heading">Book transactions</p>
                                <CardTitle className="mt-1 text-2xl">Issue, return, and renew</CardTitle>
                            </div>
                            <span className="data-chip">Independent submit actions per tab</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <TransactionTabs />
                    </CardContent>
                </Card>
            </div>
        </main>
    );
};

export default Dashboard;
