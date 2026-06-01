"use client";

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { IndianRupee, Users, Receipt, TrendingUp } from 'lucide-react';
import StatsGrid from '../../../components/vendor/StatsGrid';

// Helper to get last 6 months
const getLast6Months = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const result = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        result.push(months[d.getMonth()]);
    }
    return result;
};

// Reusable Chart Component
const SimpleBarChart = ({ 
    data, 
    title, 
    dataKey, 
    formatValue, 
    colorClass, 
    hoverClass,
    bgClass 
}: { 
    data: any[], 
    title: string, 
    dataKey: string, 
    formatValue: (val: number) => string,
    colorClass: string,
    hoverClass: string,
    bgClass: string
}) => {
    // Ensure we always show 6 months
    const last6Months = getLast6Months();
    const paddedData = last6Months.map(month => {
        const existing = (data || []).find((d: any) => d.month === month);
        return {
            month,
            [dataKey]: existing ? existing[dataKey] : 0
        };
    });

    const maxVal = Math.max(...paddedData.map((d: any) => d[dataKey]), 1); // Avoid 0

    return (
        <div className="bg-white rounded-[16px] p-8 border border-slate-100 shadow-sm relative overflow-hidden h-full">
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -z-0 opacity-20 ${bgClass}`}></div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8 relative z-10">{title}</h3>
            
            <div className="flex items-end justify-center gap-6 h-48 overflow-x-auto relative z-10 pt-4 px-4 border-b-2 border-slate-50 pb-2">
                {paddedData.map((item: any, idx: number) => {
                    const val = item[dataKey] || 0;
                    const heightPercent = Math.max((val / maxVal) * 100, 5); // min 5% 
                    
                    return (
                        <div key={idx} className="flex flex-col justify-end items-center flex-1 h-full min-w-[30px] group max-w-[60px]">
                            <div className="text-[10px] font-black text-slate-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {formatValue(val)}
                            </div>
                            <div 
                                className={`w-full rounded-t-[8px] transition-all duration-500 relative ${colorClass} ${hoverClass}`}
                                style={{ height: `${heightPercent}%` }}
                            ></div>
                            <div className="mt-3 text-[10px] font-bold text-slate-500">
                                {item.month}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function ReportsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const statsData = await api.admin.getStats();
            setStats(statsData);
        } catch (err) {
            console.error('Failed to fetch admin stats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatCount = (amount: number) => amount.toString();
    const totalBusinesses = stats?.totalVendors?.toString() || '0';
    const businessesGraphData = stats?.vendorsGraphData;

    const mappedStats = [
        {
            label: 'Total Revenue',
            value: formatCurrency(stats?.totalRevenue || 0),
            icon: IndianRupee,
            color: 'bg-gradient-to-br from-[#3366CC] to-[#1144AA]',
            shadow: 'shadow-blue-500/20'
        },
        {
            label: 'Monthly Revenue',
            value: formatCurrency(stats?.monthlyRevenue || 0),
            icon: TrendingUp,
            color: 'bg-gradient-to-br from-[#33AA88] to-[#118866]',
            shadow: 'shadow-emerald-500/20'
        },
        {
            label: 'Total Businesses',
            value: totalBusinesses,
            icon: Users,
            color: 'bg-gradient-to-br from-[#FFAA33] to-[#FF8811]',
            shadow: 'shadow-orange-500/20'
        },
        {
            label: 'Active Subscriptions',
            value: stats?.activeSubscriptions?.toString() || '0',
            icon: Receipt,
            color: 'bg-gradient-to-br from-[#EE4444] to-[#CC2222]',
            shadow: 'shadow-red-500/20'
        },
    ];

    // Compute cumulative data for Total Revenue visually
    let cumulativeRevenue = 0;
    const totalRevenueGraphData = stats?.monthlyGraphData?.map((item: any) => {
        cumulativeRevenue += item.revenue;
        return { ...item, accumulated: cumulativeRevenue };
    }) || [];

    if (loading) return <div className="p-10 text-slate-400 font-bold uppercase tracking-widest text-center">Loading Reports...</div>;

    return (
        <div className="space-y-12 pb-20">
            {/* Reports Header */}
            <div>
                <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-3 tracking-tight">System Reports</h1>
                <p className="text-slate-400 font-bold tracking-tight text-lg">Financial summary and health metrics for the platform.</p>
            </div>

            {/* Reports Stats Grid */}
            <StatsGrid stats={mappedStats} />

            {/* 4 Graph Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Total Revenue Trend */}
                <SimpleBarChart 
                    data={totalRevenueGraphData} 
                    title="Total Revenue Growth" 
                    dataKey="accumulated" 
                    formatValue={formatCurrency}
                    colorClass="bg-gradient-to-t from-blue-600 to-blue-400"
                    hoverClass="hover:from-blue-500 hover:to-blue-300 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                    bgClass="bg-blue-100"
                />

                {/* Monthly Revenue Trend */}
                <SimpleBarChart 
                    data={stats?.monthlyGraphData} 
                    title="Monthly Revenue" 
                    dataKey="revenue" 
                    formatValue={formatCurrency}
                    colorClass="bg-gradient-to-t from-emerald-600 to-emerald-400"
                    hoverClass="hover:from-emerald-500 hover:to-emerald-300 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    bgClass="bg-emerald-100"
                />

                {/* Businesses Trend */}
                <SimpleBarChart 
                    data={businessesGraphData} 
                    title="New Businesses" 
                    dataKey="count" 
                    formatValue={formatCount}
                    colorClass="bg-gradient-to-t from-orange-500 to-orange-400"
                    hoverClass="hover:from-orange-400 hover:to-orange-300 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                    bgClass="bg-orange-100"
                />

                {/* Subscriptions Trend */}
                <SimpleBarChart 
                    data={stats?.subscriptionsGraphData} 
                    title="New Subscriptions" 
                    dataKey="count" 
                    formatValue={formatCount}
                    colorClass="bg-gradient-to-t from-red-600 to-red-400"
                    hoverClass="hover:from-red-500 hover:to-red-300 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    bgClass="bg-red-100"
                />

            </div>
        </div>
    );
}
