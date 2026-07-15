import { CircleUser, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";

const Header = ({ children }: { children: React.ReactNode }) => {
    const { session, signOut } = useAuth();
    return (
        <div className="bg-white shadow-[0_4px_50px_-20px_#00000040] px-[30px] pr-[30px] pl-[15px] py-[10px] flex justify-between fixed left-[222px] top-0 right-0 z-[1]">
            <div>{children}</div>
            <div className="flex items-center gap-4">
                <a target="_blank" href="https://libms-dev.aakvaerp.com/app/lms" className="text-[#00b0ab] hover:text-[#00b0ab] border border-solid border-[#00b0ab] py-1 px-2 rounded">Admin Panel</a>
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                        <CircleUser className="h-7 w-7 text-slate-700" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{session?.user?.name || "Admin User"}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {/* @ts-ignore */}
                                    {session?.user?.email || "admin@example.com"}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

            </div>
        </div>
    );
}

export default Header;