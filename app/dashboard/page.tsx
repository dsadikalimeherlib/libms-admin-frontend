"use client"
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const Dashboard = () => {

    const router = useRouter();

    // Redirect to dashboard if token exists in localStorage
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
        }
    }, [router]);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <p>Welcome to your dashboard! Here you can manage your settings and view your activity.</p>
        </div>
    );
};

export default Dashboard;