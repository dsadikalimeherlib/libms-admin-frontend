import Link from "next/link";
import { usePathname } from "next/navigation";

const MenuLink = ({ href, icon, label, pathname }: { href: string, icon: React.ReactNode, label: string, pathname: string }) => {
    const linkClass = "px-4 py-[10px] cursor-pointer text-sm leading-[var(--tw-leading,var(--text-sm--line-height))] font-semibold  flex gap-2 items-center";
    return (
        <li>
            <Link className={`${linkClass} text-[12px] ${pathname === href ? 'text-[#00b0ab] ' : 'text-[var(--color-muted-foreground)]'}`} href={href}>
                <div className={`m-0 flex h-[25px] w-[25px] items-center justify-center gap-[10px] rounded-[5px] text-[20px] text-[#222222] ${pathname === href ? 'bg-[#00b0ab] text-[#fff]' : 'bg-[#EEEEF1] text-[#222222]'}`}>
                    {icon}
                </div> {label}
            </Link>
        </li>
    );
};

const Sidebar = () => {
    const pathname = usePathname();

    return (
        <div className="w-[222px] h-screen bg-[#fff] shadow-lg">
            <header className=" py-[30px] flex justify-center items-center">
                <img src="/logo-2.svg" alt="Library Logo" className="h-[40px] w-auto" />
            </header>
            <div className="min-h-[calc(100vh-150px)]">
                <ul>
                    <MenuLink
                        href="/dashboard"
                        pathname={pathname}
                        label="Dashboard"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
                                <path
                                    d="M3.95837 10.1013C3.95837 9.02642 3.95837 8.48897 4.17566 8.01655C4.39294 7.54413 4.801 7.19437 5.61711 6.49484L6.40878 5.81627C7.88391 4.55187 8.62147 3.91968 9.50004 3.91968C10.3786 3.91968 11.1162 4.55187 12.5913 5.81627L13.383 6.49484C14.1991 7.19437 14.6071 7.54413 14.8244 8.01655C15.0417 8.48897 15.0417 9.02642 15.0417 10.1013V13.4583C15.0417 14.9511 15.0417 15.6975 14.578 16.1612C14.1142 16.625 13.3678 16.625 11.875 16.625H7.12504C5.63226 16.625 4.88587 16.625 4.42212 16.1612C3.95837 15.6975 3.95837 14.9511 3.95837 13.4583V10.1013Z"
                                    stroke="currentColor" strokeWidth="2" />
                                <path
                                    d="M11.4792 16.625V12.875C11.4792 12.3227 11.0315 11.875 10.4792 11.875H8.52087C7.96859 11.875 7.52087 12.3227 7.52087 12.875V16.625"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        }
                    />
                    <MenuLink
                        href="/book-transactions"
                        pathname={pathname}
                        label="Book Transactions"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
                                <path
                                    d="M15.8333 9.5V12.625C15.8333 14.5106 15.8333 15.4534 15.2475 16.0392C14.6617 16.625 13.7189 16.625 11.8333 16.625H5.14579C4.05273 16.625 3.16663 15.7389 3.16663 14.6458V14.6458C3.16663 13.5528 4.05273 12.6667 5.14579 12.6667H11.8333C13.7189 12.6667 14.6617 12.6667 15.2475 12.0809C15.8333 11.4951 15.8333 10.5523 15.8333 8.66667V6.375C15.8333 4.48938 15.8333 3.54657 15.2475 2.96079C14.6617 2.375 13.7189 2.375 11.8333 2.375H7.16663C5.28101 2.375 4.3382 2.375 3.75241 2.96079C3.16663 3.54657 3.16663 4.48938 3.16663 6.375V14.6458"
                                    stroke="currentColor" strokeWidth="2" />
                                <path d="M7.125 6.33331L11.875 6.33331" stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" />
                            </svg>
                        }
                    />
                </ul>
            </div>

        </div>
    );
};

export default Sidebar;