import Sidebar from "./sidebar";

const MainLayout: React.FC = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col">

            <main className="flex-grow  flex ">
                <div className="relative">
                    <Sidebar />
                </div>
                <div className="pattern-bg w-full  max-h-[calc(100vh)] overflow-y-auto">
                    {children}
                </div>

            </main>

        </div>
    );
};

export default MainLayout;