'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-20 pb-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-2">
              <img src="/logo.png" alt="naampata" className="h-[10.5rem] w-auto object-contain -ml-8 -my-8" />
            </Link>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs">
              Discover the best local businesses, services, and professionals in your area. Your local guide to everything around you.
            </p>
          </div>

          {/* Discover Column */}
          <div>
            <h4 className="text-[#112D4E] font-black uppercase tracking-widest text-xs mb-8">Discover</h4>
            <ul className="space-y-4">
              {['Restaurants', 'Health & Wellness', 'Education', 'Automotive'].map((item) => (
                <li key={item}>
                  <Link href={`/search?q=${item.toLowerCase()}`} className="text-slate-600 text-sm font-bold hover:text-orange-500 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For business Column */}
          <div>
            <h4 className="text-[#112D4E] font-black uppercase tracking-widest text-xs mb-8">For businesses</h4>
            <ul className="space-y-4">
              {[
                { label: 'List My Business', href: '/register' },
                { label: 'Business Login', href: '/login' },
                { label: 'Pricing Plans', href: '/pricing' }
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-slate-600 text-sm font-bold hover:text-orange-500 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-[#112D4E] font-black uppercase tracking-widest text-xs mb-8">Company</h4>
            <ul className="space-y-4">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'Contact', href: '/contact' },
                { label: 'Terms of Service', href: '/legal/terms-users' },
                { label: 'Privacy Policy', href: '/legal/privacy' },
                { label: 'Refund Policy', href: '/legal/refund-policy' }
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-slate-600 text-sm font-bold hover:text-orange-500 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            &copy; {currentYear} naampata. All rights reserved.
          </p>
          <div className="flex gap-8 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Twitter</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Linkedin</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
