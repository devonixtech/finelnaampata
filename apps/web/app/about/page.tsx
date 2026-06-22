import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
    MapPin, Users, Building2, Star, Heart, Zap, Globe, Shield,
    ArrowRight, CheckCircle
} from "lucide-react";

export const metadata: Metadata = {
    title: "About Us | naampata – Find Local Businesses",
    description:
        "Learn about naampata's mission to connect people with the best local businesses in their community. Discover our story, values, and the team behind the platform.",
};

const stats = [
    { label: "Businesses Listed", value: "10,000+", icon: Building2, color: "text-primary bg-primary/10" },
    { label: "Active Users", value: "50,000+", icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Active Cities", value: "200+", icon: Globe, color: "text-emerald-600 bg-emerald-50" },
    { label: "Trust Reviews", value: "120,000+", icon: Star, color: "text-amber-500 bg-amber-50" },
];

const values = [
    {
        icon: Heart,
        title: "Community First",
        desc: "We believe in the power of local communities. Every feature we build starts with the question: does this help our neighbours thrive?",
        color: "text-rose-500 bg-rose-50",
    },
    {
        icon: Shield,
        title: "Trust & Transparency",
        desc: "Clear listings, honest reviews, and transparent pricing. We hold ourselves and every business on our platform to high standards.",
        color: "text-indigo-500 bg-indigo-50",
    },
    {
        icon: Zap,
        title: "Relentless Innovation",
        desc: "From live chat to push notifications, we continuously ship features that make discovering and connecting with local businesses effortless.",
        color: "text-primary bg-primary/10",
    },
    {
        icon: Globe,
        title: "Inclusive Growth",
        desc: "Whether you're a one-person shop or a growing enterprise, naampata gives every business an equal chance to shine in front of local customers.",
        color: "text-emerald-500 bg-emerald-50",
    },
];

const team = [
    { name: "Arjun Sharma", role: "Co-founder & CEO", initials: "AS", gradient: "from-orange-400 to-rose-500" },
    { name: "Priya Mehta", role: "Co-founder & CTO", initials: "PM", gradient: "from-indigo-400 to-purple-500" },
    { name: "Ravi Patel", role: "Head of Product", initials: "RP", gradient: "from-emerald-400 to-teal-500" },
    { name: "Sneha Gupta", role: "Head of Growth", initials: "SG", gradient: "from-sky-400 to-blue-500" },
];

export default function AboutPage() {
    return (
        <div className="bg-white min-h-screen font-medium">
            <Navbar />
            <main>
                {/* ── Hero ── */}
                <section className="relative pt-44 pb-32 px-4 bg-slate-900 overflow-hidden">
                    {/* decorative elements */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
                    </div>

                    <div className="relative max-w-5xl mx-auto text-center z-10">
                        <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-10">
                            <span className="w-10 h-[1px] bg-slate-700" />
                            Our Genesis
                            <span className="w-10 h-[1px] bg-slate-700" />
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.85] mb-10">
                            Empowering <br />
                            <span className="text-primary italic">Local Greatness.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-bold">
                            naampata was born from a simple belief — every neighbourhood has hidden gems waiting to be discovered. We built the platform to make that discovery effortless.
                        </p>
                    </div>
                </section>

                {/* ── Stats ── */}
                <section className="py-24 px-4 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {stats.map(({ label, value, icon: Icon, color }) => (
                                <div key={label} className="group p-10 rounded-[40px] border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500">
                                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform ${color}`}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <div className="text-5xl font-black text-slate-900 tracking-tighter mb-2">{value}</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Mission ── */}
                <section className="py-32 px-4 relative overflow-hidden">
                     <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
                        <div className="relative order-2 lg:order-1">
                             <div className="relative z-10 p-2 bg-slate-100 rounded-[48px] overflow-hidden rotate-[-2deg]">
                                <div className="bg-slate-900 rounded-[40px] p-12 text-white">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-10">
                                        <Zap className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="text-4xl font-black tracking-tighter leading-none mb-8">
                                        The <span className="text-primary italic">Vision</span> behind the platform.
                                    </h3>
                                    <p className="text-slate-400 text-lg font-bold leading-relaxed mb-10">
                                        "Making local businesses as easy to find as they are great to experience is our singular focus."
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-black">NP</div>
                                        <div>
                                            <div className="text-sm font-black uppercase tracking-widest text-white">Founder Core</div>
                                            <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Est. 2024</div>
                                        </div>
                                    </div>
                                </div>
                             </div>
                             {/* Floating elements */}
                             <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
                             <div className="absolute bottom-[-20px] left-[-20px] w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -z-10" />
                        </div>

                        <div className="order-1 lg:order-2">
                            <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-primary" />
                                Our Mission
                            </div>
                            <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-10">
                                Empowering Local <br />
                                <span className="text-slate-400">Economies.</span>
                            </h2>
                            <p className="text-lg text-slate-500 font-bold leading-relaxed mb-10">
                                We give local businesses a powerful digital presence — complete with rich profiles, customer reviews, real-time chat, and targeted offers — so that when someone searches for a service nearby, the best match is right at their fingertips.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {[
                                    "Precision Discovery",
                                    "Trustworthy Ratings",
                                    "Real-time Enquiry",
                                    "Free Basic Tier"
                                ].map((item) => (
                                    <div key={item} className="flex items-center gap-4 p-6 rounded-[24px] bg-slate-50 border border-slate-100 hover:border-primary/30 transition-colors group">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <CheckCircle className="w-5 h-5 text-primary" />
                                        </div>
                                        <span className="font-black text-slate-900 uppercase tracking-widest text-[11px]">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Values ── */}
                <section className="py-32 px-4 bg-slate-900 text-white rounded-[64px] mx-4 mb-32 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                    </div>
                    
                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="text-center mb-24">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center justify-center gap-3">
                                <span className="w-8 h-[1px] bg-slate-700" />
                                Principles
                                <span className="w-8 h-[1px] bg-slate-700" />
                            </div>
                            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                                Core <span className="text-primary italic">Values.</span>
                            </h2>
                        </div>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {values.map(({ icon: Icon, title, desc, color }) => (
                                <div key={title} className="p-10 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all group">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform ${color.replace('bg-', 'bg-opacity-20 bg-')}`}>
                                        <Icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-black mb-4 tracking-tight">{title}</h3>
                                    <p className="text-slate-400 text-sm font-bold leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA ── */}
                <section className="py-44 px-4 relative">
                    <div className="max-w-4xl mx-auto text-center">
                         <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto mb-12 rotate-12">
                            <Building2 className="w-12 h-12 text-primary" />
                         </div>
                        <h2 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.85] mb-10">
                            Join the <br />
                            <span className="text-slate-400">Network.</span>
                        </h2>
                        <p className="text-xl text-slate-500 font-bold mb-16 max-w-xl mx-auto">
                            Join thousands of local businesses already thriving on naampata systems.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <Link
                                href="/register"
                                className="inline-flex items-center gap-4 px-12 py-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-[24px] hover:shadow-2xl hover:shadow-primary/40 transition-all active:scale-95 group"
                            >
                                Sign Up
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                            </Link>
                            <Link
                                href="/contact"
                                className="inline-flex items-center gap-4 px-12 py-8 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-[24px] hover:bg-slate-800 transition-all"
                            >
                                Contact Support
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
