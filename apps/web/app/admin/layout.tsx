"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import AdminSidebar from '../../components/admin/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace('/login');
            } else if (user.role !== 'admin' && user.role !== 'superadmin') {
                router.replace('/dashboard');
            } else {
                setIsChecking(false);
            }
        }
    }, [user, loading, router]);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            { (loading || isChecking) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50">
                    <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                </div>
            )}
            
            <div className={`flex flex-col flex-grow ${loading || isChecking ? 'hidden' : ''}`}>
                <AdminHeader />
                <div className="flex flex-grow">
                    <AdminSidebar />
                    <main className="flex-grow min-w-0 p-4 lg:p-10 max-w-[1600px] w-full mx-auto">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
