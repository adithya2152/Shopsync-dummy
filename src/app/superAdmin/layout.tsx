import SuperAdminNav from "@/components/SuperAdminNav";

export default function SuperAdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div>
            <SuperAdminNav />
            {children}
        </div>
    );
}