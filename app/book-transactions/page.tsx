"use client"
import { useState } from "react";
import TransactionTabs from "@/components/library/TransactionTabs";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import MainLayout from "../layouts/main-layout";
import Header from "../layouts/header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMemberList } from "@/services/members";


const Dashboard = () => {
    const [dueMessage, setDueMessage] = useState<string | null>(null);
    const [duePaymentId, setDuePaymentId] = useState<string | null>(null);
    const [isPaying, setIsPaying] = useState(false);

    const handlePayNow = async () => {
        if (!duePaymentId) return;
        setIsPaying(true);
        try {
            await getMemberList({ docname: duePaymentId, generateBill: true });
        } catch (error) {
            console.error(error);
        } finally {
            setIsPaying(false);
        }
    };

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
                    {dueMessage && <div className="text-destructive font-medium bg-destructive/10 p-4 rounded-md mt-[30px] mb-[-20px] flex justify-between items-center">
                        {dueMessage}
                        <Button className=" rounded-md px-2" onClick={handlePayNow} disabled={isPaying}>
                            {isPaying ? "Processing..." : "Pay now"}
                        </Button>
                    </div>}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

                    </div>
                    <Card className="panel-surface border-border/70 pt-6">

                        <CardContent>

                            <TransactionTabs setDueMessage={setDueMessage} setDuePaymentId={setDuePaymentId} />
                        </CardContent>
                    </Card>

                </div>
            </main>
        </MainLayout>
    );
};

export default Dashboard;
