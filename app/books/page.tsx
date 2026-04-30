"use client"

import { useQuery } from "@tanstack/react-query";
import { BookCopy, LogOut, ShieldCheck, TimerReset, Users } from "lucide-react";

import TransactionTabs from "@/components/library/TransactionTabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { getDashboardMetrics } from "@/lib/mock-library-api";
import MainLayout from "../layouts/main-layout";


const Dashboard = () => {
    const { session, signOut } = useAuth();
    const metricsQuery = useQuery({
        queryKey: ["dashboard-metrics"],
        queryFn: getDashboardMetrics,
    });



    const getBookTransactions = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            return;
        }

        const { access_token } = JSON.parse(token);
        fetch("/api/book-transaction", {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        })
            .then(res => res.json())
            .then(data => console.log(data));
    }

    return (
        <MainLayout>
            <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
                <div className="mx-auto flex  flex-col gap-6 pt-24">
                    {/* <div onClick={getBookTransactions}>Book transaction</div> */}
                    {/* max-w-7xl */}
                    <div className="bg-white shadow-[0_4px_50px_-20px_#00000040] px-[30px] pr-[30px] pl-[15px] py-[10px] flex justify-between fixed left-[256px] top-0 right-0 z-[1]">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="section-heading">Book transactions</p>
                                <CardTitle className="mt-1 text-2xl">Issue, return, and renew</CardTitle>
                            </div>
                            <span className="data-chip">Independent submit actions per tab</span>
                        </div>
                    </div>
                    <Card className="panel-surface border-border/70 pt-6">

                        <CardContent>
                            <TransactionTabs />
                        </CardContent>
                    </Card>

                </div>
            </main>
        </MainLayout>
    );
};

export default Dashboard;
