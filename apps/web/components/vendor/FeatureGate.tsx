"use client";

import React from 'react';
import { Lock, ChevronRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePlanFeature, DashboardFeatures } from '../../hooks/usePlanFeature';

interface FeatureGateProps {
    feature: keyof DashboardFeatures;
    children: React.ReactNode;
    title?: string;
    description?: string;
    isPage?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ 
    feature, 
    children, 
    title = "Premium Feature Locked", 
    description = "This feature is available on higher plans. Upgrade your subscription to unlock professional tools and insights.",
    isPage = true 
}) => {
    const { hasFeature, planName } = usePlanFeature();

    if (hasFeature(feature)) {
        return <>{children}</>;
    }

    const LockedUI = () => (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col items-center justify-center text-center ${isPage ? 'min-h-[70vh] p-8' : 'p-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200'}`}
        >
            <div className="relative mb-8">
                <div className="w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center shadow-2xl relative z-10">
                    <Lock className="w-10 h-10 text-white" />
                </div>
                <div className="absolute inset-0 bg-blue-500/20 rounded-[32px] blur-2xl transform scale-110 -z-10" />
            </div>

            <h2 className={`font-black text-slate-900 tracking-tight leading-tight mb-4 ${isPage ? 'text-3xl lg:text-5xl' : 'text-2xl'}`}>
                {title}
            </h2>
            <p className="text-slate-500 font-bold max-w-lg mb-10 leading-relaxed text-lg">
                {description}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link 
                    href="/pricing" 
                    className="group flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[20px] font-black shadow-2xl hover:bg-black transition-all active:scale-95"
                >
                    Upgrade Your Plan
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <div className="px-6 py-5 bg-white border border-slate-200 rounded-[20px] shadow-sm">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 text-left">Current Plan</p>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-black text-slate-900">{planName}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return <LockedUI />;
};
