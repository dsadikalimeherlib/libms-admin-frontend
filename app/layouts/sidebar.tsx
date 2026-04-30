import { useAuth } from "@/context/AuthContext";
import { BookCopy, LogOut, ShieldCheck, TimerReset, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Sidebar = () => {
    const { session, signOut } = useAuth();
    const pathname = usePathname();
    const linkClass = "p-4 cursor-pointer text-sm leading-[var(--tw-leading,var(--text-sm--line-height))] font-semibold tracking-[0.16em] uppercase block";
    return (
        <div className="w-64 h-screen bg-[#fff] shadow-lg">
            <header className=" py-4 flex justify-center items-center">
                <img src="/logo-2.svg" alt="Library Logo" className="h-[52px] w-auto" />
            </header>
            <div className="min-h-[calc(100vh-150px)]">
                <ul>
                    <li><Link className={`${linkClass} ${pathname === '/dashboard' ? 'text-black' : 'text-[var(--color-muted-foreground)]'}`} href='/dashboard'>Dashboard</Link></li>
                    <li><Link className={`${linkClass} ${pathname === '/books' ? 'text-black' : 'text-[var(--color-muted-foreground)]'}`} href='/books'>Books</Link></li>
                </ul>
            </div>
            <div onClick={signOut} className="flex items-center gap-4 p-4 cursor-pointer text-sm leading-[var(--tw-leading,var(--text-sm--line-height))] font-semibold tracking-[0.16em] text-[var(--color-muted-foreground)] uppercase">
                <LogOut />
                Logout
            </div>
        </div>
    );
};

export default Sidebar;