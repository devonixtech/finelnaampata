"use client";

import React, { useState, useEffect } from 'react';
import { 
    FileText, CheckCircle2, Loader2, Clock, Receipt
} from 'lucide-react';
import { api } from '../../../lib/api';
import Link from 'next/link';
import { format, isValid } from 'date-fns';

const safeFormat = (date: any, formatStr: string, fallback = '—') => {
    if (!date) return fallback;
    const d = new Date(date);
    if (!isValid(d)) return fallback;
    return format(d, formatStr);
};

export default function BusinessOfferPlansPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invoicesData] = await Promise.all([
                    api.subscriptions.getMyInvoices({ silent: true }),
                ]);
                setInvoices(invoicesData || []);
            } catch (err) {
                console.error('Failed to fetch data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-16">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B2244] via-[#0D2E61] to-[#1a3a70] p-8 text-white shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-md">
                            <Receipt className="w-8 h-8 text-orange-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Payments</h1>
                            <p className="text-white/60 font-medium text-sm mt-0.5">
                                View your billing history and payment records
                            </p>
                        </div>
                    </div>
                    <Link href="/deals" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-black text-sm transition-all backdrop-blur-md">
                        <FileText className="w-4 h-4" />
                        Manage Offers
                    </Link>
                </div>
            </div>

            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                    <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <h2 className="text-lg font-black text-slate-900">Purchase History</h2>
                        <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-400 uppercase">
                            {invoices.length} entries
                        </span>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#fcfdff] border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Date</th>
                                        <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Description</th>
                                        <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Amount</th>
                                        <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {invoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3 grayscale opacity-40">
                                                    <FileText className="w-12 h-12 text-slate-300" />
                                                    <p className="font-bold text-slate-400 text-sm">No transaction records found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        invoices.map((invoice: any) => (
                                            <tr key={invoice.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-5 whitespace-nowrap font-bold text-slate-900">
                                                    {safeFormat(invoice.createdAt, 'MMM d, yyyy')}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                                                        {invoice.subscription?.plan?.name || invoice.metadata?.planName || 'Payment'}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                                                        ID: {invoice.invoiceNumber || invoice.id?.slice(0, 8)}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="font-black text-slate-900">{invoice.currency} {parseFloat(invoice.amount).toLocaleString()}</div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 ${
                                                        invoice.status === 'completed' || invoice.status === 'paid'
                                                            ? 'bg-green-50 text-green-700 border-green-100' 
                                                            : 'bg-amber-50 text-amber-700 border-amber-100'
                                                    }`}>
                                                        {invoice.status === 'completed' || invoice.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                        {invoice.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
