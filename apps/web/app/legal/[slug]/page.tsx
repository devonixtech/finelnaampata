import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { Shield } from 'lucide-react';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const titles: Record<string, string> = {
    'privacy': 'Privacy Policy',
    'terms-users': 'Terms of Service (Users)',
    'terms-business': 'Business Terms of Service',
    'refund-policy': 'Subscription & Refund Policy',
    'content-moderation': 'Content Moderation Policy',
    'cookie-policy': 'Cookie Policy',
    'dpa': 'Data Processing Agreement',
    'affiliate-policy': 'Affiliate Commission Policy',
    'dmca': 'IP & Copyright (DMCA) Policy'
  };
  return {
    title: `${titles[slug] || 'Legal'} | naampata`,
  };
}

export function generateStaticParams() {
  return [
    { slug: 'privacy' },
    { slug: 'terms-users' },
    { slug: 'terms-business' },
    { slug: 'refund-policy' },
    { slug: 'content-moderation' },
    { slug: 'cookie-policy' },
    { slug: 'dpa' },
    { slug: 'affiliate-policy' },
    { slug: 'dmca' }
  ];
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const possiblePaths = [
    path.join(process.cwd(), 'content', 'legal', `${slug}.md`),
    path.join(process.cwd(), 'apps', 'web', 'content', 'legal', `${slug}.md`)
  ];

  const filePath = possiblePaths.find(p => fs.existsSync(p));

  if (!filePath) {
    notFound();
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  return (
    <>
      <Navbar />
      <main className="bg-white min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-br from-[#112D4E] via-[#1a3f6b] to-[#2D3E50] py-24 px-4">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#FF7A30]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative max-w-4xl mx-auto text-center">
             <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-sm border border-white/10">
                <Shield className="w-3.5 h-3.5 text-[#FF7A30]" /> Legal Suite
             </span>
             <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 capitalize">
                naampata <span className="text-[#FF7A30]">Legal</span>
             </h1>
          </div>
        </section>
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto prose prose-slate prose-headings:font-black prose-headings:text-[#112D4E] prose-a:text-[#FF7A30] prose-a:font-bold hover:prose-a:text-[#E86920] prose-img:rounded-xl">
             <ReactMarkdown remarkPlugins={[remarkGfm]}>
               {content}
             </ReactMarkdown>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
