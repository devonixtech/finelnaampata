"use client";

import Link from 'next/link';
import { AlertTriangle, ArrowRight, ShieldCheck, Clock3, MessageSquare, Star, CreditCard } from 'lucide-react';

const points = [
    'Account is hidden immediately when deletion is requested.',
    'You get a fixed 30-day grace period to cancel the request.',
    'Reviews are anonymized and kept to protect review integrity.',
    'Chat history stays for the standard retention period.',
    'Active subscriptions must be cancelled separately where applicable.',
];

export default function DeleteAccountPage() {
    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#fff_40%,_#f8fafc_100%)] px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
                <div className="mb-8 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-200">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-rose-500">Account Deletion</p>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">Delete your NAAMPATA account</h1>
                    </div>
                </div>

                <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/40 sm:p-10">
                    <p className="max-w-2xl text-sm font-medium leading-7 text-slate-600">
                        If you want to delete your account, the process is now designed around a fixed 30-day grace period.
                        Your account becomes hidden right away, then the permanent purge completes later unless you cancel.
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        {points.map((point) => (
                            <div key={point} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                                <p className="text-sm font-semibold leading-6 text-slate-700">{point}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 rounded-[28px] border border-amber-100 bg-amber-50 p-5">
                        <div className="flex items-start gap-3">
                            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                            <div>
                                <p className="text-sm font-black text-slate-900">Need to cancel later?</p>
                                <p className="text-sm font-medium leading-6 text-slate-600">
                                    Log in again within 30 days and cancel the deletion request from account settings.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/login?redirect=/dashboard/settings"
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-black text-white transition-transform hover:-translate-y-0.5"
                        >
                            Go to account settings
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <a
                            href="mailto:support@naampata.com?subject=Account%20Deletion%20Request"
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50"
                        >
                            Contact support
                        </a>
                    </div>

                    <div className="mt-10 grid gap-4 text-sm text-slate-500 sm:grid-cols-3">
                        <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-rose-500" />
                            Reviews anonymized
                        </div>
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                            Chat history retained
                        </div>
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-emerald-600" />
                            Subscriptions handled separately
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
