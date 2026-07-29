"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  ArrowRight,
  TrendingUp,
  Compass,
  Sliders,
  Users,
  Heart,
  Phone,
  ShieldCheck,
  Star,
  ChefHat,
  Stethoscope,
  Sparkles,
  Wrench,
  ChevronDown,
  Plane,
  GraduationCap,
  Gamepad2,
  Ticket,
  Smartphone,
  Headset,
  CheckCircle2,
  Megaphone,
  Tag,
  Loader2,
  Globe,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BusinessCard from "../components/BusinessCard";
import DynamicIcon from "../components/DynamicIcon";
import OfferCard from "../components/OfferCard";
import { api, getImageUrl } from "../lib/api";
import { ListingImage } from "../components/ListingImage";
import Link from "next/link";
import { Category, Business, City } from "../types/api";
import Slider from "react-slick";
import CitySearchSelect from "../components/CitySearchSelect";
import { useAuth } from "../context/AuthContext";
import { COUNTRIES_STATES } from "../lib/data/countries-states";
import { SearchableSelect } from "../components/ui/SearchableSelect";
// Script is removed to avoid multiple loads (already in layout.tsx)

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [paginationMetadata, setPaginationMetadata] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
    hasMore: false,
  });
  const [popularCities, setPopularCities] = useState<City[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [citiesList, setCitiesList] = useState<City[]>([]);
  const [countryCities, setCountryCities] = useState<City[]>([]);
  const [latestOffers, setLatestOffers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [statsComments, setStatsComments] = useState<any[]>([]);
  const [showUsersOnlyModal, setShowUsersOnlyModal] = useState(false);
  const featuredSectionRef = useRef<HTMLDivElement>(null);
  // heroImages slider removed in favor of clean design
  const badgeText = "Your Local. Your Choice.";
  const highlights = [
    {
      icon: <ShieldCheck className="w-5 h-5 text-orange-500" />,
      title: "Local Businesses",
      desc: "Active and reliable listings",
    },
    {
      icon: <Search className="w-5 h-5 text-green-500" />,
      title: "Fast & Easy Search",
      desc: "Find what you need instantly",
    },
    {
      icon: <Headset className="w-5 h-5 text-blue-500" />,
      title: "Local Support",
      desc: "We're here to help",
    },
  ];
  const quickCategories = [
    {
      name: "Education",
      icon: <GraduationCap className="w-5 h-5" />,
      color: "bg-orange-50 text-orange-600",
      slug: "education",
    },
    {
      name: "Airport",
      icon: <Plane className="w-5 h-5" />,
      color: "bg-blue-50 text-blue-600",
      slug: "airport",
    },
    {
      name: "Amusement park",
      icon: <Gamepad2 className="w-5 h-5" />,
      color: "bg-purple-50 text-purple-600",
      slug: "amusement-park",
    },
    {
      name: "Car repair",
      icon: <Wrench className="w-5 h-5" />,
      color: "bg-green-50 text-green-600",
      slug: "car-repair",
    },
  ];
  const sliderSettings = {
    dots: false,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 4000,
    speed: 1000,
    fade: true,
    arrows: false,
    pauseOnHover: false,
  };

  // Initial data load — runs once on mount for all static page data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          api.categories.getPopular(8),
          api.listings.getFeatured(1, 12),
          api.cities.getPopular(),
          Promise.allSettled([
            api.deals.search({ limit: 10 }),
            api.events.search({ limit: 10 }),
          ]),
          api.reviews.getPopular(15),
        ]);

        const getValue = (result: PromiseSettledResult<any>, fallback: any) =>
          result.status === "fulfilled" ? result.value : fallback;

        const cats = getValue(results[0], []);
        const featured = getValue(results[1], { data: [], meta: {} });
        const cities = getValue(results[2], []);
        const offerBundles = getValue(results[3], []);
        const dealsData = offerBundles[0]?.status === 'fulfilled' ? offerBundles[0].value : { data: [] };
        const eventsData = offerBundles[1]?.status === 'fulfilled' ? offerBundles[1].value : { data: [] };
        const reviewsData = getValue(results[4], { data: [] });

        setCategories(cats || []);
        setFeaturedBusinesses(featured?.data || []);
        if (featured?.meta) {
          setPaginationMetadata((prev) => ({ ...prev, ...featured.meta }));
        }
        setPopularCities(cities || []);
        setCategoriesList(cats || []);
        setCitiesList(cities || []);
        setStatsComments(reviewsData?.data || []);
        setLatestOffers(
          [...(dealsData?.data || []).map((d: any) => ({ ...d, type: 'offer' as const })),
           ...(eventsData?.data || []).map((e: any) => ({ ...e, type: 'event' as const }))]
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .slice(0, 20),
        );
      } catch (err) {
        console.error("CRITICAL: Unexpected error in loadInitialData:", err);
      } finally {
        setLoading(false);
      }
    };

    const loadSearchMetadata = async () => {
      try {
        const metadataResults = await Promise.allSettled([
          api.categories.getAll({ timeout: 15000 }),
          api.cities.getAll({ timeout: 15000 }),
        ]);

        const allCats = metadataResults[0].status === "fulfilled" ? metadataResults[0].value : [];
        const allCities = metadataResults[1].status === "fulfilled" ? metadataResults[1].value : [];

        if (allCats.length > 0) {
          setCategoriesList(allCats);
        }

        if (allCities.length > 0) {
          setCitiesList(allCities);
        }
      } catch (err) {
        console.warn("Search metadata loaded with fallbacks only:", err);
      }
    };

    loadInitialData().then(() => {
      // Mark initial mount as done so the page-change effect can run freely
      isInitialMount.current = false;
    });
    loadSearchMetadata();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load cities filtered by selected country for the city dropdown
  useEffect(() => {
    const loadCountryCities = async () => {
      if (!selectedCountry) {
        setCountryCities(citiesList.length > 0 ? citiesList : popularCities);
        return;
      }
      try {
        const cities = await api.cities.getAll({ country: selectedCountry });
        const allCities = cities || [];
        const filtered = allCities.filter(c => c.country?.toLowerCase() === selectedCountry.toLowerCase());
        setCountryCities(filtered);
      } catch (err) {
        console.error('Failed to load country cities:', err);
        setCountryCities([]);
      }
    };
    loadCountryCities();
  }, [selectedCountry, citiesList, popularCities]);

  // Fetch only businesses when pagination page changes
  // Skip the very first mount since initial data is already loaded above
  useEffect(() => {
    if (isInitialMount.current) return;
    const scrollTarget = featuredSectionRef.current;
    if (scrollTarget && typeof window !== "undefined") {
      const targetTop = scrollTarget.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    }
    const fetchBusinessesPage = async () => {
      try {
        setBusinessesLoading(true);
        const featured = await api.listings.getFeatured(paginationMetadata.page, 12);
        setFeaturedBusinesses(featured?.data || []);
        if (featured?.meta) {
          setPaginationMetadata((prev) => ({ ...prev, ...featured.meta }));
        }
      } catch (err) {
        console.error("Error fetching businesses page:", err);
      } finally {
        setBusinessesLoading(false);
      }
    };
    fetchBusinessesPage();
  }, [paginationMetadata.page]);

  const isInitialMount = useRef(true);
  const searchRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return (
    <div className="bg-white min-h-screen font-sans text-slate-900 pb-20 md:pb-0 overflow-x-hidden selection:bg-orange-500 selection:text-white">
      <div className="max-w-2xl mx-auto bg-white min-h-screen relative shadow-none md:shadow-2xl md:border-x border-slate-100 overflow-hidden">
        
        {/* Mobile Top Header */}
        <header className="flex items-center justify-between px-5 py-4 bg-white/95 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform">
              {user?.avatarUrl ? (
                <img src={getImageUrl(user.avatarUrl)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-500 font-bold text-sm">{user?.fullName?.[0] || 'U'}</span>
              )}
            </div>
          </div>
          
          <div className="flex-1 flex justify-center pl-4">
            <h1 className="text-[26px] font-black tracking-[-0.05em] flex items-center cursor-pointer" style={{fontFamily: 'Arial, sans-serif'}}>
              <span className="text-[#0052cc]">Just</span><span className="text-[#ff6b00]">dial</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative hover:scale-110 transition-transform active:scale-95">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-[#111]">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff6b00] text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">1</span>
            </button>
            <button className="hover:scale-110 transition-transform active:scale-95">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#111]">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>
          </div>
        </header>

        {/* Search Bar */}
        <div className="px-5 py-3 mb-4">
          <div className="flex items-center bg-white border border-slate-300 rounded-[12px] px-3.5 py-3 shadow-sm focus-within:shadow-md focus-within:border-blue-400 transition-all">
            <Search className="w-5 h-5 text-[#0052cc] shrink-0 stroke-[2.5]" />
            <input
              type="text"
              placeholder="Packers and Movers"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-transparent border-none outline-none px-3 text-[16px] text-slate-800 placeholder:text-slate-400 font-medium"
            />
            <div className="flex items-center gap-4 shrink-0">
              <button className="hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-700">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                  <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
                  <rect x="7" y="7" width="10" height="10" rx="1"></rect>
                </svg>
              </button>
              <button className="hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-700">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" x2="12" y1="19" y2="22"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Categories Grid with Emojis to simulate colorful icons */}
        <div className="px-5 pb-6">
          <div className="grid grid-cols-4 gap-y-7 gap-x-2">
            {[
              { name: 'B2B', iconUrl: 'https://img.icons8.com/color/96/handshake.png', slug: 'b2b' },
              { name: 'Doctors', iconUrl: 'https://img.icons8.com/color/96/medical-doctor.png', slug: 'doctors' },
              { name: 'Travel', iconUrl: 'https://img.icons8.com/color/96/airplane-take-off.png', slug: 'travel' },
              { name: 'Beauty', iconUrl: 'https://img.icons8.com/color/96/cosmetics.png', slug: 'beauty' },
              { name: 'Education', iconUrl: 'https://img.icons8.com/color/96/graduation-cap.png', slug: 'education' },
              { name: 'Consultants', iconUrl: 'https://img.icons8.com/color/96/consultation.png', slug: 'consultants' },
              { name: 'Rent & Hire', iconUrl: 'https://img.icons8.com/color/96/key.png', slug: 'rent-hire' },
              { name: 'Wedding', iconUrl: 'https://img.icons8.com/color/96/wedding-rings.png', slug: 'wedding' },
              { name: 'Interiors', iconUrl: 'https://img.icons8.com/color/96/sofa.png', slug: 'interiors' },
              { name: 'Home Serv.', iconUrl: 'https://img.icons8.com/color/96/broom.png', slug: 'home-services' },
              { name: 'Repairs', iconUrl: 'https://img.icons8.com/color/96/maintenance.png', slug: 'repairs' },
              { name: 'Contractors', iconUrl: 'https://img.icons8.com/color/96/worker-male.png', slug: 'contractors' },
              { name: 'Loans', iconUrl: 'https://img.icons8.com/color/96/money-bag.png', badge: 'Instant', slug: 'loans' },
              { name: 'Real Estate', iconUrl: 'https://img.icons8.com/color/96/house.png', slug: 'real-estate' },
              { name: 'Jd Xperts', iconUrl: 'https://img.icons8.com/color/96/service.png', badge: 'New', slug: 'jd-xperts' },
            ].map((cat, idx) => (
              <Link key={idx} href={`/search?category=${cat.slug}`} className="flex flex-col items-center group relative cursor-pointer active:scale-95 transition-transform">
                {cat.badge && (
                  <span className="absolute -bottom-2 px-1.5 py-[1px] bg-white text-red-500 border border-red-200 text-[9px] font-bold rounded-sm z-10 tracking-wide uppercase">{cat.badge}</span>
                )}
                <div className="w-[52px] h-[52px] mb-1 flex items-center justify-center transition-colors rounded-full group-hover:bg-blue-50/50">
                  <img src={cat.iconUrl} alt={cat.name} className="w-9 h-9 drop-shadow-sm group-hover:scale-110 transition-transform object-contain" />
                </div>
                <span className="text-[12px] font-semibold text-slate-700 text-center leading-[1.1] group-hover:text-blue-600 transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
            
            {/* Show More Button */}
            <Link href="/categories" className="flex flex-col items-center group cursor-pointer active:scale-95 transition-transform">
               <div className="w-[52px] h-[52px] rounded-full bg-[#4b6bf5] mb-2 flex items-center justify-center shadow-md shadow-blue-200 group-hover:bg-[#3451d1] transition-colors">
                  <ChevronDown className="w-7 h-7 text-white stroke-[2.5]" />
               </div>
               <span className="text-[12px] font-semibold text-slate-700 text-center leading-[1.1] group-hover:text-blue-600 transition-colors">
                  Show More
               </span>
            </Link>
          </div>
        </div>

        {/* Bottom Sheet Section */}
        <div className="bg-white rounded-t-[24px] pt-4 border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] relative z-10 min-h-[400px]">
          {/* Handle */}
          <div className="w-12 h-[5px] bg-[#d1d5db] rounded-full mx-auto mb-6"></div>

          {/* Promo Cards Scroll */}
          <div className="overflow-x-auto custom-scrollbar px-5 pb-6">
            <div className="flex gap-3 w-max">
              {/* Order Food */}
              <Link href="/search?q=food" className="w-[105px] h-[105px] rounded-[16px] overflow-hidden relative group cursor-pointer active:scale-95 transition-all shadow-sm border border-orange-100">
                <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop" alt="Food" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                <div className="absolute bottom-2.5 left-2.5">
                  <span className="text-white font-black text-[14px] leading-[1.1] tracking-wide text-shadow-md">ORDER<br/>FOOD</span>
                </div>
              </Link>

              {/* Gift Cards */}
              <Link href="/search?q=gift" className="w-[105px] h-[105px] rounded-[16px] overflow-hidden relative bg-[#5E2CA5] group flex flex-col justify-end p-2.5 cursor-pointer active:scale-95 transition-all shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#4c1d95] to-[#7c3aed]"></div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl"></div>
                <span className="absolute top-2 right-2 text-3xl drop-shadow-md group-hover:scale-110 transition-transform origin-bottom-left">🎁</span>
                <span className="text-white font-black text-[14px] leading-[1.1] relative z-10 tracking-wide">GIFT<br/>CARDS</span>
              </Link>

              {/* Shopping */}
              <Link href="/search?q=shopping" className="w-[105px] h-[105px] rounded-[16px] overflow-hidden relative bg-[#1F8D98] group cursor-pointer active:scale-95 transition-all shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-[#14b8a6] to-[#0f766e]"></div>
                <span className="absolute top-2 right-2 text-3xl drop-shadow-md group-hover:-translate-y-1 transition-transform">🛍️</span>
                <div className="absolute bottom-2.5 left-2.5">
                  <span className="text-white font-black text-[14px] leading-[1.1] tracking-wide">SHOPPING</span>
                </div>
              </Link>

              {/* Pay Bills */}
              <Link href="/search?q=bills" className="w-[105px] h-[105px] rounded-[16px] overflow-hidden relative bg-[#152B6A] group flex flex-col justify-end p-2.5 cursor-pointer active:scale-95 transition-all shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#1e3a8a] to-[#1e40af]"></div>
                <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[55px] font-black text-[#ff6b00] leading-none drop-shadow-lg group-hover:scale-105 transition-transform">B</span>
                <span className="text-white font-black text-[14px] leading-[1.1] relative z-10 text-center tracking-wide">PAY BILLS</span>
              </Link>
            </div>
          </div>

          {/* Banner Ad */}
          <div className="px-5 pb-10">
            <div className="bg-[#2a2c3a] rounded-[12px] overflow-hidden flex relative p-4 shadow-md group cursor-pointer active:scale-[0.98] transition-transform h-[110px]">
              <div className="z-10 w-[65%] flex flex-col justify-center">
                <h3 className="text-white font-bold text-[14px] leading-[1.25] mb-1">Propel your career towards growth</h3>
                <p className="text-slate-300 text-[11px] mb-2.5">Connect with Career Experts</p>
                <div className="mt-auto">
                  <button className="bg-[#a62b3b] text-white text-[11px] font-bold px-3 py-1.5 rounded-[4px] hover:bg-[#8a222f] transition-colors">Enquire Now</button>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 w-[35%] h-full overflow-hidden flex items-end justify-end">
                <span className="text-[60px] opacity-80 translate-x-2 translate-y-2 group-hover:scale-110 transition-transform origin-bottom-right">🎯</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
