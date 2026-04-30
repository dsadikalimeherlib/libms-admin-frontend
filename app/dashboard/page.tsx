"use client"

import { useQuery } from "@tanstack/react-query";
import { BookCopy, LogOut, ShieldCheck, TimerReset, Users } from "lucide-react";

import TransactionTabs from "@/components/library/TransactionTabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { getDashboardMetrics } from "@/lib/mock-library-api";
import MainLayout from "../layouts/main-layout";

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
        <MainLayout>
            <header className=" overflow-hidden bg-hero text-primary-foreground">
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

                </div>
            </header>
            <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
                {/* max-w-7xl */}
                <div className="mx-auto flex  flex-col gap-6">


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


                </div>
            </main>
        </MainLayout>
    );
};

export default Dashboard;
