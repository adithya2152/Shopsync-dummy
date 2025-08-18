"use client";

import MobileRestriction from "@/components/MobileRestriction";
import { ThemeProvider, createTheme } from '@mui/material/styles';
// import SuperAdminNav from "@/components/SuperAdminNav"; // Optional: if you have one

const theme = createTheme();

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider theme={theme}>
            <MobileRestriction>
                <div>
                    {/* <SuperAdminNav /> */}
                    {children}
                </div>
            </MobileRestriction>
        </ThemeProvider>
    );
}