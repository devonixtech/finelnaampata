"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
    MapPin, Phone, Mail, Clock, Send, MessageSquare,
    ChevronRight, CheckCircle, AlertCircle, HelpCircle, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const contactInfo = [
    {
        icon: Mail,
        label: "Email Us",
        value: "hello@naampata.com",
        sub: "We reply within 24 hours",
        color: "text-[#FF7A30] bg-orange-50",
    },
    {
        icon: Phone,
        label: "Call Us",
        value: "+91 98765 43210",
        sub: "Mon – Sat, 9 AM – 6 PM IST",
        color: "text-blue-600 bg-blue-50",
    },
    {
        icon: MapPin,
        label: "Our Office",
        value: "Bandra West, Mumbai 400050",
        sub: "Maharashtra, India",
        color: "text-emerald-600 bg-emerald-50",
    },
    {
        icon: Clock,
        label: "Support Hours",
        value: "Mon – Sat: 9 AM – 6 PM",
        sub: "Closed on national holidays",
        color: "text-indigo-600 bg-indigo-50",
    },
];

const faqs = [
    {
        q: "How do I list my business on naampata?",
        a: "Simply click 'Add Business' in the top navigation, create a business account, and fill in your business details. The basic listing is completely free.",
    },
    {
        q: "How long does it take to review a listing?",
        a: "Most listings are reviewed within 24–48 hours. You'll receive an email notification once your listing is approved.",
    },
    {
        q: "Can I update my business information?",
        a: "Yes! Log in to your business dashboard at any time to update your business details, photos, offers, and contact information.",
    },
    {
        q: "How do I report incorrect information?",
        a: "Use the 'Report' button on any business listing page, or email us directly at hello@naampata.com with the details.",
    },
];

export default function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("sending");
        // Simulate API call
        await new Promise((r) => setTimeout(r, 1500));
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
    };

    return (
        <>
            <Navbar />
            <main>
                {/* ── Hero ── */}
                <section className="relative overflow-hidden bg-gradient-to-br from-[#112D4E] via-[#1a3f6b] to-[#2D3E50] py-24 px-4">
                    <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#FF7A30]/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative max-w-3xl mx-auto text-center">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-sm border border-white/10">
                            <MessageSquare className="w-3.5 h-3.5 text-[#FF7A30]" /> Get in Touch
                        </span>
                        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
                            We'd Love to <span className="text-[#FF7A30]">Hear from You</span>
                        </h1>
                        <p className="text-lg text-white/70 font-medium max-w-xl mx-auto">
                            Have a question, feedback, or need help with your listing? Our team is just a message away.
                        </p>
                    </div>
                </section>

                {/* ── Contact Cards ── */}
                <section className="py-14 px-4 bg-slate-50 border-b border-slate-100">
                    <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                        {contactInfo.map(({ icon: Icon, label, value, sub, color }) => (
                            <div key={label} className="bg-white p-5 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow text-center">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3 ${color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                                <p className="text-sm font-bold text-[#112D4E] leading-snug">{value}</p>
                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{sub}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Form + Map Area ── */}
                <section className="py-20 px-4 bg-white">
                    <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
                        {/* Form */}
                        <div>
                            <h2 className="text-2xl font-black text-[#112D4E] mb-2">Send Us a Message</h2>
                            <p className="text-slate-500 text-sm font-medium mb-8">Fill in the form and our team will get back to you within 24 hours.</p>

                            {status === "success" ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5">
                                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <h3 className="text-xl font-black text-[#112D4E] mb-2">Message Sent!</h3>
                                    <p className="text-slate-500 font-medium text-sm mb-6">Thanks for reaching out. We'll be in touch soon.</p>
                                    <button
                                        onClick={() => setStatus("idle")}
                                        className="text-sm font-bold text-[#FF7A30] hover:text-[#E86920] underline underline-offset-2 transition-colors"
                                    >
                                        Send another message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Name</label>
                                            <input
                                                id="contact-name"
                                                name="name"
                                                type="text"
                                                required
                                                value={form.name}
                                                onChange={handleChange}
                                                placeholder="Your full name"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF7A30] focus:ring-2 focus:ring-orange-100 outline-none text-sm font-medium text-slate-800 transition-all placeholder:text-slate-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Email</label>
                                            <input
                                                id="contact-email"
                                                name="email"
                                                type="email"
                                                required
                                                value={form.email}
                                                onChange={handleChange}
                                                placeholder="you@example.com"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF7A30] focus:ring-2 focus:ring-orange-100 outline-none text-sm font-medium text-slate-800 transition-all placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Subject</label>
                                        <select
                                            id="contact-subject"
                                            name="subject"
                                            required
                                            value={form.subject}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF7A30] focus:ring-2 focus:ring-orange-100 outline-none text-sm font-medium text-slate-800 transition-all bg-white"
                                        >
                                            <option value="">Select a topic...</option>
                                            <option value="listing">Business Listing Help</option>
                                            <option value="billing">Billing & Subscriptions</option>
                                            <option value="review">Review Dispute</option>
                                            <option value="partnership">Partnership Enquiry</option>
                                            <option value="bug">Report a Bug</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Message</label>
                                        <textarea
                                            id="contact-message"
                                            name="message"
                                            required
                                            rows={5}
                                            value={form.message}
                                            onChange={handleChange}
                                            placeholder="Tell us how we can help you..."
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF7A30] focus:ring-2 focus:ring-orange-100 outline-none text-sm font-medium text-slate-800 transition-all placeholder:text-slate-300 resize-none"
                                        />
                                    </div>

                                    {status === "error" && (
                                        <div className="flex items-center gap-2 text-red-600 text-sm font-medium bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            Something went wrong. Please try again.
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        id="contact-submit"
                                        disabled={status === "sending"}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#FF7A30] text-white font-black rounded-2xl hover:bg-[#E86920] shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {status === "sending" ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                Sending…
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" /> Send Message
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Right: Map placeholder + FAQs */}
                        <div className="space-y-8">
                            {/* Map iframe placeholder */}
                            <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm h-56 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                <div className="text-center">
                                    <MapPin className="w-8 h-8 text-[#FF7A30] mx-auto mb-2" />
                                    <p className="text-sm font-bold text-slate-600">Bandra West, Mumbai</p>
                                    <p className="text-xs text-slate-400 font-medium">Maharashtra, India 400050</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-[#112D4E] mb-6 flex items-center gap-3">
                                    <HelpCircle className="w-6 h-6 text-[#FF7A30]" />
                                    Frequently Asked Questions
                                </h3>
                                <div className="space-y-4">
                                    {faqs.map(({ q, a }, i) => {
                                        const isOpen = openFaq === i;
                                        return (
                                            <div
                                                key={i}
                                                className={`rounded-2xl border transition-all duration-300 ${isOpen
                                                        ? "bg-white border-orange-200 shadow-xl shadow-orange-500/5 ring-4 ring-orange-500/5"
                                                        : "bg-slate-50/50 border-slate-100 hover:border-slate-200 hover:bg-white"
                                                    }`}
                                            >
                                                <button
                                                    id={`faq-${i}`}
                                                    onClick={() => setOpenFaq(isOpen ? null : i)}
                                                    className="w-full flex items-center justify-between px-6 py-5 text-left group"
                                                >
                                                    <span className={`text-sm font-bold transition-colors pr-6 ${isOpen ? "text-[#FF7A30]" : "text-[#112D4E] group-hover:text-[#FF7A30]/80"}`}>
                                                        {q}
                                                    </span>
                                                    <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${isOpen ? "bg-[#FF7A30] text-white rotate-180" : "bg-white text-slate-400 group-hover:text-[#FF7A30]"
                                                        }`}>
                                                        <ChevronDown className="w-4 h-4" />
                                                    </div>
                                                </button>
                                                <AnimatePresence initial={false}>
                                                    {isOpen && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="px-6 pb-6 pt-1 border-t border-slate-50/50">
                                                                <p className="text-sm text-slate-500 font-medium leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
                                                                    {a}
                                                                </p>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
