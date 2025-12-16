import BottomNav from "@/components/BottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 pb-20 p-4">{children}</main>
            <BottomNav />
        </div>
    );
}
