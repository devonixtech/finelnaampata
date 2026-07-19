"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import {
    CheckCircle, XCircle, Zap, Star, ArrowRight,
    Loader2, ChevronRight, Building2, BarChart2,
    MessageSquare, Megaphone, Tag, Users, Shield, Sparkles
} from "lucide-react";

// ── Static feature definitions per plan type ──────────────────────────────
// These map to the dashboardFeatures flags in the seeder/DB
const PLAN_FEATURES = {
    free: {
        color: "from-slate-600 to-slate-800",
        accentColor: "text-slate-700",
        badgeBg: "bg-slate-100 text-slate-600",
        borderColor: "border-slate-200",
        ctaClass: "bg-slate-900 hover:bg-slate-700 text-white",
        icon: Shield,
        tagline: "Start your digital journey",
        features: [
            { label: "1 Business Listing", included: true, icon: Building2 },
            { label: "1 Business Category", included: true, icon: Tag },
            { label: "Logo + Cover + 3 Photos", included: true, icon: Users },
            { label: "Receive Broadcast / Job Leads", included: true, icon: Megaphone },
            { label: "Receive Reviews", included: true, icon: Star },
            { label: "Up to 3 Subcategories", included: false, icon: Tag },
            { label: "Album Creation (Unlimited Photos)", included: false, icon: Users },
            { label: "In-App Chat & WhatsApp", included: false, icon: MessageSquare },
            { label: "10 Search Keywords", included: false, icon: Zap },
            { label: "Analytics Dashboard", included: false, icon: BarChart2 },
            { label: "Reply to Reviews", included: false, icon: Star },
            { label: "Customer Notes & FAQs", included: false, icon: Users },
        ],
    },
    basic: {
        color: "from-[#FF7A30] to-rose-500",
        accentColor: "text-[#FF7A30]",
        badgeBg: "bg-orange-100 text-[#FF7A30]",
        borderColor: "border-[#FF7A30]/30",
        ctaClass: "bg-[#FF7A30] hover:bg-[#E86920] text-white shadow-lg shadow-orange-500/25",
        icon: Zap,
        tagline: "Everything you need to grow",
        features: [
            { label: "Everything in Free Plan", included: true, icon: CheckCircle },
            { label: "Multiple Business Listings", included: true, icon: Building2 },
            { label: "Up to 3 Subcategories", included: true, icon: Tag },
            { label: "Album Creation (Unlimited Photos)", included: true, icon: Users },
            { label: "In-App Chat & WhatsApp", included: true, icon: MessageSquare },
            { label: "10 Search Keywords", included: true, icon: Zap },
            { label: "Analytics Dashboard", included: true, icon: BarChart2 },
            { label: "Reply to Reviews", included: true, icon: Star },
            { label: "FAQs on Profile (up to 10)", included: true, icon: MessageSquare },
            { label: "Up to 5 Named Phone Numbers", included: true, icon: Users },
            { label: "Respond to Broadcast Leads", included: true, icon: Megaphone },
            { label: "Customer Notes", included: true, icon: Building2 },
            { label: "Deals & Events (Add-on)", included: false, icon: Tag },
        ],
    },
};

const FAQS = [
    {
        q: "Can I upgrade from Free to Basic at any time?",
        a: "Yes! You can upgrade to the Basic plan whenever you're ready. Your billing cycle starts from the day you subscribe — you'll be charged monthly from that date.",
    },
    {
        q: "Is there a contract or lock-in period?",
        a: "No contracts, no lock-ins. The Basic plan is billed month-to-month and you can cancel at any time. Your plan remains active until the end of the current billing period.",
    },
    {
        q: "What happens to my listing if I cancel?",
        a: "If you cancel the Basic plan, your account downgrades to Free. Your first listing stays visible, but all premium features (offers, analytics, chat, etc.) are disabled.",
    },
    {
        q: "Do you offer refunds?",
        a: "We offer a pro-rated refund within 7 days of your billing date if you're not satisfied. Contact our support team at hello@naampata.com to request a refund.",
    },
    {
        q: "Can I list multiple businesses on one account?",
        a: "The Free plan includes 1 business listing. The Basic plan supports multiple business listings on the same account, along with premium profile tools.",
    },
    {
        q: "How is payment processed?",
        a: "Payments are processed securely through Stripe. We accept all major credit/debit cards. We never store your card details on our servers.",
    },
];

type Plan = {
    id: string;
    name: string;
    planType: "free" | "basic" | "premium" | "enterprise";
    description: string;
    price: number;
    billingCycle: string;
    maxListings: number;
    isFeatured: boolean;
    dashboardFeatures: Record<string, any>;
};

export default function PricingPage() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
        api.subscriptions.getPlans()
            .then((data: any) => {
                // Sort: free first, then basic
                const sorted = [...data].sort((a: Plan, b: Plan) => {
                    const order: Record<string, number> = { free: 0, basic: 1, premium: 2, enterprise: 3 };
                    return (order[a.planType] ?? 99) - (order[b.planType] ?? 99);
                });
                setPlans(sorted);
            })
            .catch(() => setPlans([]))
            .finally(() => setLoading(false));
    }, []);

    const getCtaHref = (plan: Plan) => {
        if (!user) return `/register?plan=${plan.planType}`;
        if (user.role === "vendor") {
            if (plan.planType === "free") return "/dashboard";
            return `/dashboard?upgrade=${plan.id}`;
        }
        return "/dashboard";
    };

    const getCtaLabel = (plan: Plan) => {
        if (!user) return plan.planType === "free" ? "Get Started Free" : "Start Basic Plan";
        if (user.role === "vendor") return plan.planType === "free" ? "Go to Dashboard" : "Upgrade Now";
        return "Create Business Profile";
    };

    return (
        <>
            <Navbar />
            <main>
                {/* ── Hero ── */}
                <section className="relative overflow-hidden bg-gradient-to-br from-[#112D4E] via-[#1a3f6b] to-[#2D3E50] py-24 px-4">
                    <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#FF7A30]/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative max-w-3xl mx-auto text-center">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-sm border border-white/10">
                            <Zap className="w-3.5 h-3.5 text-[#FF7A30]" /> Simple Pricing
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-5">
                            Grow Your Business<br />
                            <span className="text-[#FF7A30]">Without Hidden Fees</span>
                        </h1>
                        <p className="text-lg text-white/70 font-medium max-w-xl mx-auto">
                            Start free, upgrade when ready. No contracts, no surprises — just tools that help local businesses thrive.
                        </p>

                        {/* Billing badge */}
                        <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                            <span className="text-white/60 text-sm font-medium">Billed</span>
                            <span className="px-3 py-1 rounded-lg bg-[#FF7A30] text-white text-xs font-black uppercase tracking-wider">Monthly</span>
                            <span className="text-white/60 text-sm font-medium">· Cancel anytime</span>
                        </div>
                    </div>
                </section>

                {/* ── Plan Cards ── */}
                <section className="py-20 px-4 bg-slate-50">
                    <div className="max-w-4xl mx-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-24">
                                <Loader2 className="w-8 h-8 animate-spin text-[#FF7A30]" />
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-8 items-stretch">
                                {plans.map((plan) => {
                                    const config = PLAN_FEATURES[plan.planType as keyof typeof PLAN_FEATURES] || PLAN_FEATURES.free;
                                    const PlanIcon = config.icon;
                                    const isBasic = plan.planType === "basic";
                                    const priceDisplay = plan.price === 0 ? "Free" : `PKR ${Number(plan.price).toLocaleString("en-PK")}`;

                                    return (
                                        <div
                                            key={plan.id}
                                            className={`relative bg-white rounded-3xl border-2 ${config.borderColor} p-8 flex flex-col transition-all duration-300 hover:shadow-2xl ${isBasic ? "shadow-xl shadow-orange-500/10 scale-[1.02]" : "shadow-sm"}`}
                                        >
                                            {/* Most Popular badge */}
                                            {isBasic && (
                                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF7A30] to-rose-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/30">
                                                        <Star className="w-3 h-3 fill-white" /> Most Popular
                                                    </span>
                                                </div>
                                            )}

                                            {/* Plan header */}
                                            <div className="mb-6">
                                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center mb-4 shadow-lg`}>
                                                    <PlanIcon className="w-6 h-6 text-white" />
                                                </div>

                                                <div className="flex items-center gap-2 mb-1">
                                                    <h2 className="text-xl font-black text-[#112D4E]">{plan.name}</h2>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${config.badgeBg}`}>
                                                        {plan.billingCycle}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500 font-medium">{config.tagline}</p>
                                            </div>

                                            {/* Price */}
                                            <div className="mb-8 pb-8 border-b border-slate-100">
                                                <div className="flex items-end gap-1">
                                                    <span className={`text-5xl font-black ${config.accentColor}`}>{priceDisplay}</span>
                                                    {plan.price > 0 && (
                                                        <span className="text-slate-400 font-medium mb-2">/{plan.billingCycle?.toLowerCase() === "yearly" ? "year" : "month"}</span>
                                                    )}
                                                </div>
                                                {plan.price === 0 && (
                                                    <p className="text-slate-400 text-sm font-medium mt-1">Free forever · No credit card required</p>
                                                )}
                                                {plan.price > 0 && (
                                                    <p className="text-slate-400 text-sm font-medium mt-1">{plan.billingCycle?.toLowerCase() === "yearly" ? "Billed yearly" : "Billed monthly"} · Cancel anytime</p>
                                                )}
                                            </div>

                                            {/* Features */}
                                            <ul className="space-y-3 flex-1 mb-8">
                                                {config.features.map(({ label, included, icon: FeatIcon }) => (
                                                    <li key={label} className={`flex items-center gap-3 ${!included ? "opacity-40" : ""}`}>
                                                        {included ? (
                                                            <CheckCircle className={`w-5 h-5 flex-shrink-0 ${config.accentColor}`} />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 flex-shrink-0 text-slate-300" />
                                                        )}
                                                        <span className={`text-sm font-semibold ${included ? "text-slate-700" : "text-slate-400 line-through"}`}>
                                                            {label}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>

                                            {/* CTA */}
                                            <Link
                                                href={getCtaHref(plan)}
                                                className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95 ${config.ctaClass}`}
                                            >
                                                {getCtaLabel(plan)} <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Guarantee strip */}
                        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-500 font-medium">
                            {[
                                { icon: Shield, text: "Secure Stripe payments" },
                                { icon: CheckCircle, text: "Cancel anytime, no questions" },
                                { icon: Zap, text: "Instant activation" },
                            ].map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-center gap-2">
                                    <Icon className="w-4 h-4 text-[#FF7A30]" />
                                    {text}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Feature Comparison Table ── */}
                <section className="py-20 px-4 bg-white">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-14">
                            <span className="text-[#FF7A30] text-xs font-black uppercase tracking-widest">Detailed Comparison</span>
                            <h2 className="mt-2 text-3xl md:text-4xl font-black text-[#112D4E]">What's Included</h2>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                            {/* Header */}
                            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-100">
                                <div className="p-5 font-black text-slate-400 text-xs uppercase tracking-widest">Feature</div>
                                <div className="p-5 text-center font-black text-slate-700">Free</div>
                                <div className="p-5 text-center font-black text-[#FF7A30]">Basic</div>
                            </div>

                            {[
                                { feature: "Business Listings", free: "1", basic: "1" },
                                { feature: "Business Categories", free: "1", basic: "Up to 3 Subcategories" },
                                { feature: "Gallery Photos", free: "3 Photos", basic: "Unlimited (Albums)" },
                                { feature: "Search Keywords", free: "0", basic: "10" },
                                { feature: "Analytics Dashboard", free: false, basic: true },
                                { feature: "Live Chat & WhatsApp", free: false, basic: true },
                                { feature: "Broadcast Leads", free: "Receive Only", basic: "Receive & Respond" },
                                { feature: "Review Management", free: "Receive Only", basic: "Reply to Reviews" },
                                { feature: "Profile FAQs", free: "0", basic: "Up to 10" },
                                { feature: "Named Phone Numbers", free: "1", basic: "Up to 5" },
                                { feature: "Customer Notes", free: false, basic: true },
                                { feature: "Deals & Events (Add-on)", free: false, basic: false },
                            ].map(({ feature, free, basic }, i) => (
                                <div
                                    key={feature}
                                    className={`grid grid-cols-3 border-b border-slate-50 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                                >
                                    <div className="p-4 text-sm font-semibold text-slate-600">{feature}</div>
                                    <div className="p-4 flex items-center justify-center">
                                        {typeof free === "boolean" ? (
                                            free ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-slate-300" />
                                        ) : (
                                            <span className="text-sm font-bold text-slate-500">{free}</span>
                                        )}
                                    </div>
                                    <div className="p-4 flex items-center justify-center bg-orange-50/30">
                                        {typeof basic === "boolean" ? (
                                            basic ? <CheckCircle className="w-5 h-5 text-[#FF7A30]" /> : <XCircle className="w-5 h-5 text-slate-300" />
                                        ) : (
                                            <span className="text-sm font-black text-[#FF7A30]">{basic}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section className="py-20 px-4 bg-slate-50">
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center mb-14">
                            <span className="text-[#FF7A30] text-xs font-black uppercase tracking-widest">Questions?</span>
                            <h2 className="mt-2 text-3xl md:text-4xl font-black text-[#112D4E]">Frequently Asked</h2>
                        </div>

                        <div className="space-y-3">
                            {FAQS.map(({ q, a }, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors"
                                    >
                                        <span className="font-bold text-[#112D4E] pr-4 text-sm">{q}</span>
                                        <ChevronRight className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-90 text-[#FF7A30]" : ""}`} />
                                    </button>
                                    {openFaq === i && (
                                        <div className="px-6 pb-5 text-sm text-slate-500 font-medium leading-relaxed border-t border-slate-100 pt-4">
                                            {a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Bottom CTA ── */}
                <section className="py-20 px-4 bg-gradient-to-br from-[#112D4E] to-[#1a3f6b]">
                    <div className="max-w-2xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                            Still have questions?
                        </h2>
                        <p className="text-white/70 font-medium mb-8">
                            Our team is happy to walk you through the right plan for your business.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/register"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF7A30] text-white font-bold rounded-2xl hover:bg-[#E86920] shadow-lg shadow-orange-500/30 transition-all active:scale-95"
                            >
                                Start for Free <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/contact"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 border border-white/20 transition-all"
                            >
                                Talk to Sales
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}

