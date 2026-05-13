import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { FileText, AlertCircle, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
    title: "Terms of Service | naampata",
    description:
        "Read naampata's Terms of Service to understand the rules, rights, and responsibilities governing your use of our local business discovery platform.",
};

const lastUpdated = "March 1, 2026";

const sections = [
    {
        id: "acceptance",
        title: "1. Acceptance of Terms",
        content: `By accessing or using naampata (the "Platform"), you agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree to these Terms, please do not use the Platform.

These Terms apply to all visitors, users, and businesses who access the Platform. We may update these Terms at any time; continued use of the Platform after changes constitutes your acceptance of the revised Terms.`,
    },
    {
        id: "eligibility",
        title: "2. Eligibility",
        content: `You must be at least 18 years old to use naampata. By using the Platform, you represent and warrant that you meet this requirement and have the legal capacity to enter into these Terms.

Businesses must provide accurate and complete information when creating a listing. naampata reserves the right to verify business information and remove any listing we reasonably believe to be fraudulent or misleading.`,
    },
    {
        id: "accounts",
        title: "3. User Accounts",
        content: `You are responsible for maintaining the confidentiality of your account credentials. You agree to:

• Provide accurate, current, and complete registration information
• Update your information to keep it accurate and current
• Notify us immediately of any unauthorised use of your account
• Accept responsibility for all activities that occur under your account

naampata reserves the right to suspend or terminate accounts that violate these Terms without prior notice.`,
    },
    {
        id: "listings",
        title: "4. Business Listings",
        content: `businesses who list their businesses on naampata agree that:

• All listing information provided is accurate, truthful, and not misleading
• You hold the rights to any images, text, or other content submitted
• You will promptly update your listing if information changes
• naampata may review, modify, or remove any listing at its sole discretion
• Paid listing features are subject to our subscription terms and pricing

naampata does not endorse, guarantee, or verify the quality of listed businesses. Users engage with businesses at their own risk.`,
    },
    {
        id: "reviews",
        title: "5. Reviews & Content",
        content: `Users may submit reviews, ratings, and other content ("User Content"). By submitting User Content, you grant naampata a worldwide, royalty-free licence to use, reproduce, modify, and display that content on the Platform.

You agree NOT to submit content that:
• Is false, misleading, or defamatory
• Infringes any third-party intellectual property rights
• Contains spam, promotional material, or affiliate links
• Violates any applicable laws or regulations

businesses may not submit reviews of their own businesses or their competitors. naampata moderates all reviews and may remove content that violates these guidelines.`,
    },
    {
        id: "payments",
        title: "6. Payments & Subscriptions",
        content: `naampata offers both free and paid subscription plans for businesses. By subscribing to a paid plan, you agree to pay all applicable fees as described at the time of purchase. Subscriptions auto-renew unless cancelled before the renewal date.

All payments are processed securely through Stripe. Refunds are provided at our discretion and in accordance with our Refund Policy. naampata reserves the right to change pricing with 30 days' notice.`,
    },
    {
        id: "prohibited",
        title: "7. Prohibited Conduct",
        content: `You agree not to:

• Use the Platform for any unlawful purpose or in violation of any regulations
• Scrape, crawl, or collect data from the Platform without written permission
• Reverse-engineer, decompile, or disassemble any part of the Platform
• Impersonate any person or entity or misrepresent your affiliation
• Post spam, unsolicited communications, or deceptive content
• Attempt to gain unauthorised access to any part of the Platform
• Engage in any activity that disrupts or interferes with the Platform's functionality`,
    },
    {
        id: "ip",
        title: "8. Intellectual Property",
        content: `All content on naampata, including but not limited to our logo, design, text, graphics, and software, is owned by or licensed to naampata and protected by applicable intellectual property laws.

You are granted a limited, non-exclusive, non-transferable licence to access and use the Platform for personal, non-commercial purposes. You may not reproduce, distribute, or create derivative works without our written consent.`,
    },
    {
        id: "liability",
        title: "9. Limitation of Liability",
        content: `To the maximum extent permitted by law, naampata and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from:

• Your use of or inability to use the Platform
• Conduct or content of any third party on the Platform
• Any business transactions made through or facilitated by the Platform
• Unauthorised access to or alteration of your transmissions or data

Our total liability to you for any claim shall not exceed the greater of ₹1,000 or the amount you paid us in the 12 months preceding the claim.`,
    },
    {
        id: "termination",
        title: "10. Termination",
        content: `Either party may terminate the agreement under these Terms at any time. We may suspend or terminate your access to the Platform immediately, without notice, if we believe you have violated these Terms.

Upon termination, your right to use the Platform ceases. Any data associated with your account may be deleted in accordance with our data retention policy. Paid subscriptions are not refunded upon termination due to a Terms violation.`,
    },
    {
        id: "governing",
        title: "11. Governing Law & Disputes",
        content: `These Terms are governed by the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.

We encourage you to contact us first at legal@naampata.com to resolve any dispute amicably before initiating formal legal proceedings.`,
    },
    {
        id: "contact-legal",
        title: "12. Contact",
        content: `If you have any questions about these Terms, please contact us at:

naampata
Bandra West, Mumbai 400050
Maharashtra, India

Email: legal@naampata.com
Phone: +91 98765 43210`,
    },
];

export default function TermsPage() {
    return (
        <>
            <Navbar />
            <main>
                {/* ── Hero ── */}
                <section className="relative overflow-hidden bg-gradient-to-br from-[#112D4E] via-[#1a3f6b] to-[#2D3E50] py-24 px-4">
                    <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#FF7A30]/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative max-w-3xl mx-auto text-center">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-sm border border-white/10">
                            <FileText className="w-3.5 h-3.5 text-[#FF7A30]" /> Legal
                        </span>
                        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
                            Terms of <span className="text-[#FF7A30]">Service</span>
                        </h1>
                        <p className="text-white/60 font-medium text-sm">Last updated: {lastUpdated}</p>
                    </div>
                </section>

                {/* ── Important notice ── */}
                <div className="bg-amber-50 border-b border-amber-100 px-4 py-4">
                    <div className="max-w-4xl mx-auto flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800 font-medium">
                            Please read these Terms carefully. By using naampata, you agree to be bound by these Terms of Service. If you disagree with any part, please discontinue use of the platform.
                        </p>
                    </div>
                </div>

                {/* ── Content ── */}
                <section className="py-16 px-4 bg-white">
                    <div className="max-w-5xl mx-auto flex gap-10 items-start">
                        {/* Sidebar TOC — desktop only */}
                        <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-24">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Contents</p>
                            <nav className="space-y-1">
                                {sections.map(({ id, title }) => (
                                    <a
                                        key={id}
                                        href={`#${id}`}
                                        className="block text-xs font-semibold text-slate-500 hover:text-[#FF7A30] py-1.5 px-3 rounded-lg hover:bg-orange-50 transition-colors leading-snug"
                                    >
                                        {title}
                                    </a>
                                ))}
                            </nav>
                        </aside>

                        {/* Main content */}
                        <div className="flex-1 min-w-0 space-y-10">
                            {sections.map(({ id, title, content }) => (
                                <div key={id} id={id} className="scroll-mt-28">
                                    <h2 className="text-xl font-black text-[#112D4E] mb-3 pb-3 border-b border-slate-100">{title}</h2>
                                    <div className="text-slate-600 text-sm font-medium leading-relaxed whitespace-pre-line">
                                        {content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Footer CTA ── */}
                <section className="bg-slate-50 border-t border-slate-100 py-12 px-4">
                    <div className="max-w-2xl mx-auto text-center">
                        <p className="text-slate-600 font-medium text-sm mb-4">
                            Have questions about these terms? We're happy to help.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/contact"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF7A30] text-white font-bold rounded-xl hover:bg-[#E86920] text-sm transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                            >
                                Contact Support <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/privacy"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#112D4E] font-bold rounded-xl hover:bg-slate-100 text-sm border border-slate-200 transition-all"
                            >
                                Privacy Policy
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
