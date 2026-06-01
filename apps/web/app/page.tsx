"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
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
// Script is removed to avoid multiple loads (already in layout.tsx)

export default function HomePage() {
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
  const [latestOffers, setLatestOffers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [statsComments, setStatsComments] = useState<any[]>([]);
  // heroImages slider removed in favor of clean design
  const badgeText = "Your Local. Your Choice.";
  const highlights = [
    {
      icon: <ShieldCheck className="w-5 h-5 text-orange-500" />,
      title: "Trusted Businesses",
      desc: "Trusted and reliable listings",
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
          api.categories.getAll(),
          api.cities.getAll(),
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
        const allCats = getValue(results[3], []);
        const allCities = getValue(results[4], []);
        const offerBundles = getValue(results[5], []);
        const dealsData = offerBundles[0]?.status === 'fulfilled' ? offerBundles[0].value : { data: [] };
        const eventsData = offerBundles[1]?.status === 'fulfilled' ? offerBundles[1].value : { data: [] };
        const reviewsData = getValue(results[6], { data: [] });

        setCategories(cats || []);
        setFeaturedBusinesses(featured?.data || []);
        if (featured?.meta) {
          setPaginationMetadata((prev) => ({ ...prev, ...featured.meta }));
        }
        setPopularCities(cities || []);
        setCategoriesList(allCats || []);
        setCitiesList(allCities || []);
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
    loadInitialData().then(() => {
      // Mark initial mount as done so the page-change effect can run freely
      isInitialMount.current = false;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch only businesses when pagination page changes
  // Skip the very first mount since initial data is already loaded above
  useEffect(() => {
    if (isInitialMount.current) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim() && !selectedCity) return;
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append("q", searchQuery);
    if (selectedCity) params.append("city", selectedCity);
    if (userLocation) {
      params.append("latitude", String(userLocation.lat));
      params.append("longitude", String(userLocation.lng));
    }
    window.location.href = `/search?${params.toString()}`;
  };

  // Debounced search logging for "Live Search" heatmap
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) return;

    const timer = setTimeout(() => {
      api.demand
        .logSearch({
          keyword: searchQuery,
          city: selectedCity || undefined,
          latitude: userLocation?.lat,
          longitude: userLocation?.lng,
        })
        .catch((err) => console.error("Live demand logging failed:", err));
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCity, userLocation]);

  // Detect when Google Maps API is ready
  useEffect(() => {
    if ((window as any).google) {
      setMapReady(true);
      return;
    }

    const interval = setInterval(() => {
      if ((window as any).google) {
        setMapReady(true);
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Do not auto-request user location on app launch.
  // User can select city manually via the location picker.
  useEffect(() => {
    return;
  }, [mapReady, selectedCity]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#FF7A30]" />
          <p className="text-slate-500 font-bold animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  const filteredCategories = categoriesList
    .filter((cat) => cat.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 5);

  const filteredCities = citiesList
    .filter((city) =>
      city.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .slice(0, 5);

  return (
    <div className=" bg-white font-sans text-slate-900 overflow-x-hidden">
      <Navbar />
      {/* Google Maps Script is handled in layout.tsx */}

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 bg-[#FDFCFB]">
        {/* Subtle background patterns like in the image */}
        <div className="absolute top-10 left-10 opacity-20">
          <div className="grid grid-cols-4 gap-2">
            {[...Array(12)].map((_, i) => <div key={i} className="w-1 h-1 bg-gray-400 rounded-full" />)}
          </div>
        </div>
        <div className="absolute bottom-10 right-10 opacity-20">
          <div className="grid grid-cols-4 gap-2">
            {[...Array(12)].map((_, i) => <div key={i} className="w-1 h-1 bg-gray-400 rounded-full" />)}
          </div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-8">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">✨ Your Local. Your Choice.</span>
            </div> */}

            <h1 className="text-5xl md:text-7xl font-black text-[#112D4E] mb-6 tracking-tight leading-[1.1]">
              Discover Trusted Local Businesses <br />
              <span className="text-orange-500">Instantly</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-500 mb-12 max-w-2xl mx-auto font-medium">
              Search, compare & contact the best services near you — <br className="hidden md:block" />
              fast and reliable.
            </p>
          </motion.div>

          {/* New Search Bar Design */}
          <motion.div
            ref={searchRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-5xl mx-auto mb-12"
          >
            <div className="bg-white rounded-[32px]  border border-gray-100 p-3 flex flex-col md:flex-row items-center gap-2">
              {/* City Selection */}
              <div className="flex-1 w-full flex items-center px-6 py-4 md:border-r border-gray-100 group">
                {/* <MapPin className="w-5 h-5 text-slate-300 mr-4 group-hover:text-orange-500 transition-colors" /> */}
                <div className="flex flex-col items-start text-left flex-1">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Your Area</span>
                  <CitySearchSelect
                    cities={citiesList}
                    value={selectedCity}
                    onChange={setSelectedCity}
                    minimal
                  />
                </div>
              </div>

              {/* Search Input */}
              <div className="flex-[1.5] w-full flex items-center px-6 py-4 group">
                <Search className="w-5 h-5 text-slate-300 mr-4 group-hover:text-orange-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search categories or businesses..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSuggestionsOpen(true);
                  }}
                  onFocus={() => setIsSuggestionsOpen(true)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full bg-transparent border-none outline-none text-slate-900 text-lg font-medium placeholder:text-slate-300"
                />
              </div>

              <button
                onClick={handleSearch}
                className="w-full md:w-auto bg-[#FF7A30] hover:bg-[#E86920] text-white px-10 py-5 rounded-[24px] font-black text-lg transition-all active:scale-95  flex items-center justify-center gap-3"
              >
                <Search className="w-5 h-5" />
                Search
              </button>
            </div>
          </motion.div>

          {/* Call to Action Cards - Matching the image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
            {/* Hot Local Deals */}
            <Link
              href="/offers-events"
              className="bg-white rounded-[18px] border border-gray-50 shadow-[0_15px_45px_rgba(0,0,0,0.04)] p-8 flex items-center gap-6 hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              <div className="w-16 h-16 rounded-[22px] bg-orange-50 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform shrink-0">
                <Tag className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h3 className="font-black text-[#112D4E] text-xl mb-1 group-hover:text-orange-500 transition-colors">Hot Local Deals</h3>
                <p className="text-slate-400 text-base font-medium">Best deals & events near you</p>
              </div>
            </Link>

            {/* Get Expert Quotes */}
            <Link
              href="/broadcast-request"
              className="bg-white rounded-[28px] border border-gray-50 shadow-[0_15px_45px_rgba(0,0,0,0.04)] p-8 flex items-center gap-6 hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              <div className="w-16 h-16 rounded-[22px] bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform shrink-0">
                <Megaphone className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h3 className="font-black text-[#112D4E] text-xl mb-1 group-hover:text-blue-500 transition-colors">Get Expert Quotes</h3>
                <p className="text-slate-400 text-base font-medium">Post your requirement easily</p>
              </div>
            </Link>
          </div>

          {/* Feature Highlights Bar - Matching the image */}
          <div className="max-w-6xl mx-auto bg-white/50 backdrop-blur-sm rounded-[32px] border border-gray-100 shadow-sm p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-4 px-8 py-4 md:py-0 first:pt-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-50 shrink-0">
                  {h.icon}
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-[#112D4E] text-[11px] uppercase tracking-wider mb-0.5">
                    {h.title}
                  </h4>
                  <p className="text-slate-400 text-[10px] font-medium leading-tight">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center mb-16 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[#202124] tracking-tight relative pb-4">
              Popular Categories
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#FF7A30] rounded-full"></div>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  href={`/search?category=${cat.slug}`}
                  className="group block"
                >
                  <div className="bg-slate-50 p-5 rounded-2xl border  flex items-center gap-6 hover:bg-white  hover:-translate-y-1 transition-all duration-500">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-50/30 transition-all text-blue-600">
                      <DynamicIcon name={cat.icon} className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 mb-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                        {cat.name}
                      </h3>
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-80">
                        {cat.businessCount || 0}+ Listings
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-24 bg-white relative overflow-hidden">

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center justify-center mb-16 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[#202124] tracking-tight relative pb-4">
              Featured Businesses
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#FF7A30] rounded-full"></div>
            </h2>
          </div>

          <div className="relative min-h-[300px]">
            {/* Section-level loading overlay */}
            {businessesLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-sm rounded-[40px]">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#FF7A30]" />
                  <p className="text-slate-900 font-black text-xs uppercase tracking-widest animate-pulse">Refreshing...</p>
                </div>
              </div>
            )}
            <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-10 transition-all duration-500 ${businessesLoading ? "opacity-40 blur-[2px] pointer-events-none scale-95" : "opacity-100 scale-100"}`}>
              {featuredBusinesses.length > 0 ? (
                featuredBusinesses.map((biz, idx) => (
                  <motion.div
                    key={biz.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (idx % 4) * 0.1, duration: 0.5 }}
                  >
                    <BusinessCard
                      business={biz}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-24 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">No featured businesses found</h3>
                  <p className="text-slate-500 font-medium">Check back later for new premium listings in your area.</p>
                </div>
              )}
            </div>
          </div>

          {/* Pagination Bar */}
          {paginationMetadata.totalPages > 1 && (
            <div className="mt-16 flex justify-center items-center gap-4">
              <button
                onClick={() =>
                  setPaginationMetadata((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={paginationMetadata.page === 1}
                className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white hover:shadow-lg transition-all disabled:opacity-30 disabled:hover:shadow-none"
              >
                <ChevronDown className="w-6 h-6 rotate-90" />
              </button>

              <div className="flex items-center gap-2">
                {[...Array(paginationMetadata.totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setPaginationMetadata((prev) => ({
                        ...prev,
                        page: i + 1,
                      }))
                    }
                    className={`w-12 h-12 rounded-full font-black transition-all ${paginationMetadata.page === i + 1
                      ? "bg-[#FF7A30] text-white shadow-lg"
                      : "hover:bg-white hover:shadow-md text-slate-600"
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  setPaginationMetadata((prev) => ({
                    ...prev,
                    page: Math.min(prev.totalPages, prev.page + 1),
                  }))
                }
                disabled={
                  paginationMetadata.page === paginationMetadata.totalPages
                }
                className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white hover:shadow-lg transition-all disabled:opacity-30 disabled:hover:shadow-none"
              >
                <ChevronDown className="w-6 h-6 -rotate-90" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center mb-16 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[#202124] tracking-tight relative pb-4">
              How It Works
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#FF7A30] rounded-full"></div>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-[#202124] mb-3">Search & Find</h3>
              <p className="text-[#70757a] text-sm leading-relaxed">
                Choose the service you need from our trusted categories.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-[#202124] mb-3">Compare & Review</h3>
              <p className="text-[#70757a] text-sm leading-relaxed">
                Read reviews & select the best local providers.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Phone className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-[#202124] mb-3">Contact & Connect</h3>
              <p className="text-[#70757a] text-sm leading-relaxed">
                Reach out directly to your chosen business in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Special Offers & Events */}
      <section className="py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center mb-16 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[#202124] tracking-tight relative pb-4">
              Offers & Events
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#FF7A30] rounded-full"></div>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {latestOffers.length > 0 ? (
              latestOffers.map((offer, idx) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: (idx % 4) * 0.1 }}
                >
                  <OfferCard
                    offer={offer}
                    onEnquire={() => {
                      window.location.href = `/offers-events/${offer.id}`;
                    }}
                  />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-100">
                <p className="text-slate-500 font-bold">
                  More offers and events coming soon from our trusted businesses.
                </p>
              </div>
            )}
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/offers-events"
              className="text-orange-500 font-bold hover:gap-4 transition-all inline-flex items-center gap-2 text-lg"
            >
              View All Offers & Events <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Top Cities We Serve */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center mb-16 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[#202124] tracking-tight relative pb-4">
              Top Cities We Serve
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#FF7A30] rounded-full"></div>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {popularCities.slice(0, 10).map((city, idx) => (
              <motion.div
                key={city.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link
                  href={`/search?city=${city.name}`}
                  className="relative h-48 rounded-2xl overflow-hidden block group shadow-lg"
                >
                  <ListingImage
                    src={city.heroImageUrl || city.imageUrl}
                    alt={city.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 brightness-75 group-hover:brightness-90"
                    iconSize={48}
                  />
                  <div className="absolute inset-x-0 bottom-6 text-center">
                    <span className="text-white text-xl font-black drop-shadow-lg tracking-tight">
                      {city.name}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/cities"
              className="text-blue-600 font-bold hover:gap-4 transition-all inline-flex items-center gap-2 text-lg"
            >
              View All Cities <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials - What People Are Saying */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-16">
          <div className="flex items-center justify-center gap-4 mb-16 text-center">
            <div className="flex-1 h-px bg-slate-200 hidden md:block max-w-[200px]" />
            <h2 className="text-3xl md:text-4xl font-bold text-[#112D4E] tracking-tight px-4">
              What People Are Saying
            </h2>
            <div className="flex-1 h-px bg-slate-200 hidden md:block max-w-[200px]" />
          </div>
        </div>

        {(() => {
          const fallbackReviews = [
            {
              id: "f1",
              name: "Ahmed S.",
              location: "Karachi",
              text: "Found a great plumber in Karachi in minutes. Highly recommend!",
              rating: 5,
              img: "https://i.pravatar.cc/150?u=ahmed",
            },
            {
              id: "f2",
              name: "Zainab R.",
              location: "Lahore",
              text: "Excellent service. Easy to find and contact businesses in Lahore.",
              rating: 5,
              img: "https://i.pravatar.cc/150?u=zainab",
            },
            {
              id: "f3",
              name: "Bilal K.",
              location: "Islamabad",
              text: "Trusted and reliable listings. Best platform for Pakistan.",
              rating: 5,
              img: "https://i.pravatar.cc/150?u=bilal",
            },
            {
              id: "f4",
              name: "Sara M.",
              location: "Faisalabad",
              text: "Booking appointments has never been so easy. Love this platform!",
              rating: 4,
              img: "https://i.pravatar.cc/150?u=sara",
            },
            {
              id: "f5",
              name: "Usman T.",
              location: "Rawalpindi",
              text: "Great variety of businesses listed. Found exactly what I needed.",
              rating: 5,
              img: "https://i.pravatar.cc/150?u=usman",
            },
            {
              id: "f6",
              name: "Hina N.",
              location: "Multan",
              text: "Very user-friendly! Found a top doctor in my area within seconds.",
              rating: 5,
              img: "https://i.pravatar.cc/150?u=hina",
            },
          ];
          // Fallback to professional reviews if no community results
          const communityReviews = statsComments && Array.isArray(statsComments)
            ? statsComments
              .filter(rev => rev.comment && rev.comment.trim().length > 0)
              .map((rev) => ({
                id: rev.id,
                name: rev.user?.fullName || "Aman U.",
                location: rev.user?.branch || rev.user?.city || "",
                role: "Local Resident",
                text: rev.comment,
                rating: rev.rating || 5,
                img: rev.user?.avatarUrl || null,
                date: rev.createdAt,
                business: rev.business?.title || "Local Shop",
              }))
            : [];

          const cards = communityReviews.length > 0 ? communityReviews : fallbackReviews;


          const row1 = [...cards, ...cards, ...cards];
          const row2 = [...cards, ...cards, ...cards];

          const ReviewCard = ({
            card,
            idx,
          }: {
            card: (typeof row1)[0];
            idx: number;
          }) => (
            <div
              key={`${card.id}-${idx}`}
              className="flex-shrink-0 w-80 bg-[#F8FAFC] p-6 rounded-2xl border border-slate-100 flex items-start gap-4 shadow-sm mx-3"
            >
              <div className="w-12 h-12 rounded-full border-2 border-white shadow bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-base uppercase overflow-hidden flex-shrink-0">
                {card.img ? (
                  <img
                    src={card.img}
                    alt={card.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  card.name[0].toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 text-sm mb-0.5 truncate">
                  {card.name}
                  {card.location ? `, ${card.location}` : ""}
                </h4>
                <div className="flex gap-0.5 mb-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < (card.rating || 5) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                    />
                  ))}
                </div>
                <p className="text-slate-600 text-sm italic leading-relaxed line-clamp-3">
                  "{card.text}"
                </p>
              </div>
            </div>
          );

          return (
            <div className="max-w-7xl mx-auto px-4 overflow-hidden">
              <div className="space-y-4">
                <div className="relative">
                  <div
                    className="flex"
                    style={{
                      animation: "marquee-rtl 35s linear infinite",
                      width: "max-content",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.animationPlayState = "paused")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.animationPlayState = "running")
                    }
                  >
                    {row1.map((card, idx) => (
                      <ReviewCard key={idx} card={card} idx={idx} />
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div
                    className="flex"
                    style={{
                      animation: "marquee-ltr 35s linear infinite",
                      width: "max-content",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.animationPlayState = "paused")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.animationPlayState = "running")
                    }
                  >
                    {row2.map((card, idx) => (
                      <ReviewCard key={idx} card={card} idx={idx} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        <style>{`
          @keyframes marquee-rtl {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-33.333%); }
          }
          @keyframes marquee-ltr {
            0%   { transform: translateX(-33.333%); }
            100% { transform: translateX(0); }
          }
        `}</style>
      </section>

      {/* Own a Business Section - Matching the reference image */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#112D4E] rounded-[24px] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
            <div className="text-center md:text-left">
              <h3 className="text-3xl md:text-3xl font-black text-white mb-4 tracking-tight">
                Own a Business? Get More Customers Today!
              </h3>
              <p className="text-slate-300 text-lg md:text-xl font-medium">
                List your business for free and grow your reach.
              </p>
            </div>
            <div className="shrink-0 w-full md:w-auto">
              <Link
                href="/register"
                className="bg-[#FF7A30] hover:bg-[#E86920] text-white px-10 py-5 rounded-[16px] font-black text-lg transition-all shadow-[0_10px_30px_rgba(255,122,48,0.3)] active:scale-95 whitespace-nowrap block text-center"
              >
                Add Your Business
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
