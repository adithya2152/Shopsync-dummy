// src/app/manager/layout.tsx
"use client"; // Add this directive

import ManagerNav from "@/components/ManagerNav";
import MobileRestriction from "@/components/MobileRestriction";
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

export default function ManagerLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ThemeProvider theme={theme}>
            <MobileRestriction>
                <div>
                    <ManagerNav />
                    {children}
                </div>
            </MobileRestriction>
        </ThemeProvider>
    );
}