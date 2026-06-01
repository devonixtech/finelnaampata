// "use client";

// import React from 'react';
// import Navbar from '../../components/Navbar';
// import Footer from '../../components/Footer';
// import BroadcastRequestForm from '../../components/leads/BroadcastRequestForm';
// import { Megaphone, Sparkles, CheckCircle2, Zap, Target, ChevronRight } from 'lucide-react';
// import { motion } from 'framer-motion';
// import Link from 'next/link';

// export default function BroadcastsPage() {
//     return (
//         <main className="min-h-screen bg-[#FDFDFF]">
//             <Navbar />

//             {/* Premium Header Container */}
//             <div className="bg-white border-b border-slate-50 pt-10 pb-12 lg:pt-10 lg:pb-16">
//                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//                     {/* Breadcrumbs */}
//                     <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 mb-10">
//                         <Link href="/" className="hover:text-blue-600">Home</Link>
//                         <ChevronRight className="w-3 h-3" />
//                         <span className="text-slate-900">Broadcast Request</span>
//                     </div>

//                     <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
//                         <div className="max-w-2xl">
//                             <div className="flex items-center gap-4 mb-8">
//                                 <div className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-2">
//                                     <Target className="w-3 h-3" /> Instant Matching
//                                 </div>
//                                 <div className="px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100 flex items-center gap-2">
//                                     <Zap className="w-3 h-3" /> Real-time Signals
//                                 </div>
//                             </div>
//                             <h1 className="text-5xl lg:text-7xl font-black text-slate-900 mb-8 tracking-tighter leading-[0.9]">
//                                 Broadcast Your <br />
//                                 <span className="text-blue-600">Requirements.</span>
//                             </h1>
//                             <p className="text-xl text-slate-400 font-bold leading-relaxed max-w-xl">
//                                 Reach out to hundreds of trusted local experts instantly. Describe your needs and receive tailored responses in minutes.
//                             </p>
//                         </div>

                        
//                     </div>
//                 </div>
//             </div>

//             <div className="max-w-6xl mx-auto px-4 py-20 -mt-20 lg:-mt-24 relative z-10">
//                 <motion.div
                   
//                     viewport={{ once: true }}
//                     className="max-w-4xl mx-auto bg-  p-4 md:p-12 rounded-[32px] border border-white  relative"
//                 >
                   
//                     <div className="relative">
//                         <BroadcastRequestForm />
//                     </div>
//                 </motion.div>
//             </div>

//             <Footer />
//         </main>
//     );
// }







"use client";

import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import BroadcastRequestForm from '../../components/leads/BroadcastRequestForm';
import {
    Zap,
    Target,
    ChevronRight,
    Send,
    Users,
    CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function BroadcastsPage() {
    return (
        <main className="min-h-screen bg-[#fcfcfd] overflow-hidden">
            <Navbar />

            {/* Hero Section */}
            <section className="relative border-b border-slate-100 bg-[#fcfcfd]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-300 mb-12">
                        <Link
                            href="/"
                            className="hover:text-[#ff7a29] transition-colors"
                        >
                            Home
                        </Link>

                        <ChevronRight className="w-3 h-3" />

                        <span className="text-slate-700">
                            Broadcast Request
                        </span>
                    </div>

                    {/* Main Layout */}
                    <div className="grid lg:grid-cols-2 gap-14 items-start">

                        {/* Left Content */}
                        <div className="max-w-xl">

                            {/* Top Tags */}
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <div className="px-3 py-1 bg-orange-50 text-[#ff7a29] rounded-full text-[10px] font-semibold uppercase tracking-wide border border-orange-100 flex items-center gap-1.5">
                                    <Zap className="w-3 h-3" />
                                    Real-time Signals
                                </div>

                                <div className="px-3 py-1 bg-blue-50 text-[#2563eb] rounded-full text-[10px] font-semibold uppercase tracking-wide border border-blue-100 flex items-center gap-1.5">
                                    <Target className="w-3 h-3" />
                                    Instant Matching
                                </div>
                            </div>

                            {/* Heading */}
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0f2747] leading-[1.02] mb-6">
                                Broadcast Your
                                <br />
                                <span className="text-[#ff7a29]">
                                    Requirements
                                </span>
                            </h1>

                            {/* Description */}
                            <p className="text-[15px] sm:text-base text-slate-500 leading-7 font-medium mb-10">
                                Connect with local businesses instantly.
                                Share your requirements and receive tailored responses
                                from trusted experts near you.
                            </p>

                            {/* Steps */}
                            <div className="space-y-5">

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#2563eb] shrink-0">
                                        <Send className="w-4 h-4" />
                                    </div>

                                    <div>
                                        <h3 className="text-[15px] font-semibold text-[#0f2747] mb-1">
                                            Submit Requirement
                                        </h3>

                                        <p className="text-sm text-slate-500 leading-6">
                                            Fill a quick form with your business needs.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#ff7a29] shrink-0">
                                        <Users className="w-4 h-4" />
                                    </div>

                                    <div>
                                        <h3 className="text-[15px] font-semibold text-[#0f2747] mb-1">
                                            Experts Get Notified
                                        </h3>

                                        <p className="text-sm text-slate-500 leading-6">
                                            Matching businesses instantly receive your request.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>

                                    <div>
                                        <h3 className="text-[15px] font-semibold text-[#0f2747] mb-1">
                                            Compare & Choose
                                        </h3>

                                        <p className="text-sm text-slate-500 leading-6">
                                            Review responses and hire the best provider.
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Right Form */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="relative"
                        >
                            <div className="bg-white rounded-[28px] border border-slate-100 p-4 md:p-6">
                                <BroadcastRequestForm />
                            </div>
                        </motion.div>

                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
