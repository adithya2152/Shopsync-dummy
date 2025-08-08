import React from "react";
import "@/styles/superadmin.css";

export default function SuperAdminLayout({
    children,
    overview,
    platformStats,
    userManagement,
    shopManagement,
    systemHealth,
    recentActivity
}: {
    children: React.ReactNode;
    overview: React.ReactNode;
    platformStats: React.ReactNode;
    userManagement: React.ReactNode;
    shopManagement: React.ReactNode;
    systemHealth: React.ReactNode;
    recentActivity: React.ReactNode;
}) {
    return (
        <div>
            {children}
            <div className="superadmin-grid">
                <div className="item item1">{overview}</div>
                <div className="item item2">{platformStats}</div>
                <div className="item item3">{userManagement}</div>
                <div className="item item4">{shopManagement}</div>
                <div className="item item5">{systemHealth}</div>
                <div className="item item6">{recentActivity}</div>
            </div>
        </div>
    );
}