"use client"
import { useState } from "react";
import TransactionTabs from "@/components/library/TransactionTabs";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import MainLayout from "../layouts/main-layout";
import Header from "../layouts/header";


const Dashboard = () => {
    const [dueMessage, setDueMessage] = useState<string | null>(null);

    return (
        <MainLayout>
            <main className="min-h-screen px-4 py-4 sm:px-5 lg:px-5">
                <div className="mx-auto flex  flex-col gap-6 pt-[54px]">
                    <Header>
                        <div>
                            <p className="section-heading">Book transactions</p>
                            <CardTitle className="mt-1 text-2xl">Issue, return, and renew</CardTitle>
                        </div>
                    </Header>
                    {dueMessage && <div className="text-destructive font-medium bg-destructive/10 p-4 rounded-md mt-[30px] mb-[-20px]">{dueMessage}</div>}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

                    </div>
                    <Card className="panel-surface border-border/70 pt-6">

                        <CardContent>

                            <TransactionTabs setDueMessage={setDueMessage} />
                        </CardContent>
                    </Card>

                </div>
            </main>
        </MainLayout>
    );
};

export default Dashboard;
