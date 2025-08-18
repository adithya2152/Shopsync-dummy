import React from "react";
import "@/styles/managerDash.css";
export default function manDash({
    children,
    revenue,
    totalOrders,
    avgorderValue,
    sales,
    deliveryStatistics,
    QuickLinks
}:{
    children : React.ReactNode
    revenue : React.ReactNode
    totalOrders : React.ReactNode
    avgorderValue : React.ReactNode
    sales : React.ReactNode
    deliveryStatistics : React.ReactNode
    QuickLinks : React.ReactNode
}) {
    return(
        <div>
            {children}
            <div className="Manager-grid">
                <div className="item item1">{revenue}</div>
                <div className="item item2">{totalOrders}</div>
                <div className="item item3">{avgorderValue}</div>
                <div className="item item4">{sales}</div>
                <div className="item item5">{deliveryStatistics}</div>
                <div className="item item6">{QuickLinks}</div>
            </div>
        </div>
    )
}