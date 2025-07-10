import ManagerNav from "@/components/ManagerNav";
export default function managerlayout({
    children,
}:Readonly<{
    children: React.ReactNode;
}>)
{
    return (
     <div>
        <ManagerNav />
        {children}
            
     </div>
    )
}