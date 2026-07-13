"use client"



import TransactionTabs from "@/components/library/TransactionTabs";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import MainLayout from "../layouts/main-layout";


const Dashboard = () => {




    return (
        <MainLayout>
            <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
                <div className="mx-auto flex  flex-col gap-6 pt-24">

                    <div className="bg-white shadow-[0_4px_50px_-20px_#00000040] px-[30px] pr-[30px] pl-[15px] py-[10px] flex justify-between fixed left-[256px] top-0 right-0 z-[1]">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="section-heading">Book transactions</p>
                                <CardTitle className="mt-1 text-2xl">Issue, return, and renew</CardTitle>
                            </div>
                        </div>
                        <div className="flex item">
                            <a target="_blank" href="https://libms-dev.aakvaerp.com/app/lms" className="text-blue-600 hover:text-blue-800">Admin Panel</a>
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
