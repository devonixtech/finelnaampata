"use client";

import React, { useState, useEffect, useRef } from "react";
import { calculateVisibilityTotal, checkoutVisibilityPayment, fetchVisibilityDayRate } from "../../../lib/visibility-pricing";
import { visibilityDayCount } from "../../../lib/location-detect";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Loader2,
  Tag,
  Calendar,
  ImagePlus,
  Store,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Zap,
  Star,
  Home,
  Layout,
  Search,
  FileText,
  Receipt,
  History,
  Clock,
  Download,
} from "lucide-react";
import { api } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FeatureGate } from '../../../components/vendor/FeatureGate';
import { usePlanFeature } from "../../../hooks/usePlanFeature";

type OfferType = "offer" | "event";
type OfferStatus = "active" | "scheduled" | "expired";

interface OfferItem {
  id: string;
  title: string;
  description?: string;
  type: OfferType;
  offerBadge?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  expiryDate?: string;
  highlights?: string[];
  terms?: string[];
  status: OfferStatus;
  businessId: string;
  business?: { id: string; title: string };
  createdAt: string;
  isFeatured?: boolean;
  featuredUntil?: string;
  pricingId?: string;
  isActive?: boolean;
}

const inputClass =
  "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all placeholder:text-slate-400";
const labelClass =
  "block text-xs font-black uppercase tracking-widest text-slate-400 mb-2";

const STATUS_CONFIG: Record<OfferStatus, { label: string; cls: string }> = {
  active: {
    label: "Active",
    cls: "bg-green-50 text-green-700 border border-green-200",
  },
  scheduled: {
    label: "Scheduled",
    cls: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  expired: {
    label: "Expired",
    cls: "bg-slate-100 text-slate-500 border border-slate-200",
  },
};

const emptyForm = {
  title: "",
  description: "",
  type: "event" as OfferType,
  offerBadge: "",
  imageUrl: "",
  businessId: "",
  startDate: "",
  endDate: "",
  expiryDate: "",
  highlights: [] as string[],
  terms: [] as string[],
  placements: [] as string[],
  promoStartTime: "",
  promoEndTime: "",
};

export default function BusinessEventsPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  
  const featureName = "Events";
  const { features } = usePlanFeature();
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "history">("list");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [dayRate, setDayRate] = useState(150);
  const [deleting, setDeleting] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<any>({
    plan: {
      name: "Super Admin",
      features: { maxOffers: 999, maxEvents: 999 },
      dashboardFeatures: {
        showLeads: true,
        showAnalytics: true,
        showReviews: true,
        showSaved: true,
        showFollowing: true,
        showMessages: true,
        showBroadcast: true,
        showHotDemand: true,
      },
    },
  });
  const [form, setForm] = useState(emptyForm);
  const [imageUploading, setImageUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [meta, setMeta] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const priceRequestRef = useRef(0);

  // Events is freely available to all businesses.
  // Premium plan purchases (via /offer-plans) are for boosting/featuring only.

  const loadOffers = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.events.getMy(p, 10);
      setOffers(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.message || "Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  const loadBusinesses = async () => {
    try {
      const res = await api.listings.getMyListings({ limit: 100 });
      setBusinesses(res.data || []);
    } catch { }
  };

  const loadInvoices = async () => {
    try {
      const res = await api.subscriptions.getMyInvoices({ silent: true });
      setInvoices(res || []);
    } catch { }
  };


  const loadActiveSub = async () => {
    try {
      const res = await api.subscriptions.getActive({ silent: true });
      const isAdmin = user?.role === "admin" || user?.role === "superadmin";
      
      if (isAdmin) {
        setActiveSub({
          plan: {
            name: "Super Admin",
            features: { maxOffers: 999, maxEvents: 999 },
            dashboardFeatures: {
              showLeads: true,
              showAnalytics: true,
              showReviews: true,
              showSaved: true,
              showFollowing: true,
              showMessages: true,
              showBroadcast: true,
              showHotDemand: true,
            },
          },
        });
      } else if (res) {
        setActiveSub(res);
      } else {
        // Fallback for businesses with no active subscription
        setActiveSub(null);
      }
    } catch { 
      setActiveSub(null);
    }
  };

  useEffect(() => {
    fetchVisibilityDayRate('event').then(setDayRate);
  }, []);

  useEffect(() => {
    loadOffers(1);
    loadBusinesses();
    loadActiveSub();
    loadInvoices();
  }, [user]);

  useEffect(() => {
    setForm((prev) => {
      if (
        prev.startDate === prev.promoStartTime &&
        prev.endDate === prev.promoEndTime &&
        prev.expiryDate === prev.promoEndTime
      ) {
        return prev;
      }

      return {
        ...prev,
        startDate: prev.promoStartTime,
        endDate: prev.promoEndTime,
        expiryDate: prev.promoEndTime,
      };
    });
  }, [form.promoStartTime, form.promoEndTime]);

  useEffect(() => {
    let cancelled = false;
    if (!showModal || !form.startDate || !form.endDate) {
      setEstimatedPrice(0);
      return;
    }
    calculateVisibilityTotal(form.startDate, form.endDate, 'event').then((res) => {
      if (!cancelled) {
        setDayRate(res.dayRate);
        setEstimatedPrice(res.totalPrice);
      }
    });
    return () => { cancelled = true; };
  }, [form.startDate, form.endDate, showModal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const openCreate = () => {
    setForm({ ...emptyForm, type: "event" });
    setEditingId(null);
    setAgreed(false);
    setShowModal(true);
    setError(null);
  };

  const openEdit = (offer: OfferItem) => {
    setAgreed(false);
    setForm({
      ...emptyForm,
      title: offer.title || "",
      description: offer.description || "",
      type: "event",
      offerBadge: offer.offerBadge || "",
      imageUrl: offer.imageUrl || "",
      businessId: offer.businessId || "",
      startDate: offer.startDate ? offer.startDate.slice(0, 16) : "",
      endDate: offer.endDate ? offer.endDate.slice(0, 16) : "",
      expiryDate: offer.expiryDate ? offer.expiryDate.slice(0, 16) : "",
      highlights: Array.isArray(offer.highlights) ? offer.highlights : [],
      terms: Array.isArray(offer.terms) ? offer.terms : [],
      placements: [],
      promoStartTime: offer.startDate ? offer.startDate.slice(0, 16) : "",
      promoEndTime: offer.endDate ? offer.endDate.slice(0, 16) : "",
    });
    setEditingId(offer.id);
    setShowModal(true);
    setError(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const res = await api.listings.uploadImage(file);
      setForm((prev) => ({ ...prev, imageUrl: res.url }));
    } catch (err: any) {
      setError(err.message || "Image upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessId) {
      setError("Please select a business");
      return;
    }
    if (!form.startDate || !form.endDate) {
      setError("Please select both start and end dates.");
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setError("End date must be after the start date.");
      return;
    }
    if (!agreed) {
      setError("You must agree to the Terms & Conditions and Privacy Policy.");
      return;
    }

    const isAdmin = user?.role === "admin" || user?.role === "superadmin";
    if (!editingId && offers.length >= (features.maxEvents || 0) && !isAdmin) {
      setError(`You have reached the limit of ${features.maxEvents} free event(s). Upgrade your plan or extend visibility dates to publish more.`);
      setSaving(false);
      return;
    }

    setSaving(true);
    try {
      const offerPayload = {
        title: form.title,
        description: form.description || undefined,
        offerBadge: form.offerBadge || undefined,
        imageUrl: form.imageUrl || undefined,
        businessId: form.businessId,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        expiryDate: form.expiryDate || undefined,
        highlights: form.highlights.filter((h) => h.trim() !== ""),
        terms: form.terms.filter((t) => t.trim() !== ""),
        pricingId: undefined,
      };

      let offerId = editingId;
      if (editingId) {
        await api.events.update(editingId, offerPayload);
        setSuccess("Offer updated successfully!");
      } else {
        const res = await api.events.create(offerPayload);
        offerId = res.id;
        if (estimatedPrice > 0 && offerId) {
          const checkout = await checkoutVisibilityPayment({
            eventId: offerId,
            startTime: form.startDate,
            endTime: form.endDate,
          });
          if (checkout.checkoutUrl) {
            window.location.href = checkout.checkoutUrl;
            return;
          }
        } else if (offerId) {
          await api.events.publish(offerId);
        }
        setSuccess("Event created successfully!");
      }

      setShowModal(false);
      await loadOffers(page);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save offer");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.events.remove(deleteId);
      setDeleteId(null);
      setSuccess("Offer deleted.");
      await loadOffers(page);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete offer");
    } finally {
      setDeleting(false);
    }
  };

  const handlePublish = async (offerId: string) => {
    setPublishingId(offerId);
    setError(null);
    try {
      await api.events.publish(offerId);
      setSuccess("Listing published successfully.");
      await loadOffers(page);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Publish failed. Please complete required add-on payment first.");
    } finally {
      setPublishingId(null);
    }
  };

  const fmtDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : "—";

  return (
    <FeatureGate feature="showOffers">
      <div className="max-w-6xl mx-auto pb-16">
        {/* Header */}
        <div className="relative mb-8 rounded-3xl overflow-hidden bg-gradient-to-br from-[#0B2244] via-[#0D2E61] to-[#1a3a70] p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <Megaphone className="w-7 h-7 text-orange-400" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">
                  {featureName}
                </h1>
                <p className="text-orange-200/80 font-bold text-sm mt-1 uppercase tracking-widest">
                  Promote your business with premium listings
                </p>
              </div>
            </div>
            <button
              onClick={openCreate}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black flex items-center gap-2 transition-all shadow-lg shadow-orange-500/25 group active:scale-95"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              Create New
            </button>
          </div>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-green-700 font-bold shadow-sm"
            >
              <CheckCircle2 className="w-5 h-5" />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'list'
              ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
          >
            <Layout className="w-4 h-4" />
            My Listings
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'history'
              ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
          >
            <History className="w-4 h-4" />
            Billing History
          </button>
        </div>

        {activeTab === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => {
              const status = STATUS_CONFIG[offer.status] || STATUS_CONFIG.expired;
              return (
                <motion.div
                  layout
                  key={offer.id}
                  className="group bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {offer.imageUrl ? (
                      <img
                        src={offer.imageUrl}
                        alt={offer.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <ImagePlus className="w-10 h-10 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm backdrop-blur-md ${status.cls}`}
                      >
                        {status.label}
                      </span>
                      {offer.isActive === false && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-200">
                          Draft
                        </span>
                      )}
                      {offer.type === "event" && (
                        <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm shadow-blue-500/20">
                          Event
                        </span>
                      )}
                    </div>
                    {offer.isFeatured && (
                      <div className="absolute top-4 right-4 bg-orange-500 text-white p-2 rounded-xl shadow-lg shadow-orange-500/20">
                        <Zap className="w-4 h-4 fill-current" />
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-orange-50 rounded-lg">
                        <Store className="w-3.5 h-3.5 text-orange-500" />
                      </div>
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest truncate">
                        {offer.business?.title || "No Business"}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-orange-500 transition-colors line-clamp-1">
                      {offer.title}
                    </h3>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2.5 text-slate-500">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-bold">
                          {fmtDate(offer.startDate)} - {fmtDate(offer.endDate)}
                        </span>
                      </div>
                      {offer.offerBadge && (
                        <div className="flex items-center gap-2.5 text-orange-600">
                          <Tag className="w-4 h-4" />
                          <span className="text-xs font-black uppercase tracking-widest">
                            {offer.offerBadge}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto flex items-center gap-2 pt-4 border-t border-slate-100">
                      {offer.isActive === false && (
                        <button
                          onClick={() => handlePublish(offer.id)}
                          disabled={publishingId === offer.id}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all active:scale-95 disabled:opacity-60"
                        >
                          {publishingId === offer.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(offer)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all active:scale-95"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(offer.id)}
                        className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all active:scale-95 border border-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {offers.length === 0 && (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
                  <Megaphone className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  No listings found
                </h3>
                <p className="text-slate-500 font-bold max-w-xs mx-auto mb-8">
                  Start promoting your business by creating your first offer or
                  event listing.
                </p>
                <button
                  onClick={openCreate}
                  className="px-8 py-3 bg-orange-500 text-white rounded-2xl font-black shadow-lg shadow-orange-500/20 active:scale-95 transition-transform"
                >
                  Create Your First Listing
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm"
          >
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900">Billing History</h2>
              <p className="text-sm font-bold text-slate-500 mt-1">Review your promotion and boost payments</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction ID</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-8 py-4 whitespace-nowrap">
                        <p className="text-xs font-black text-slate-900">{fmtDate(invoice.paidAt || invoice.createdAt)}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{new Date(invoice.paidAt || invoice.createdAt).toLocaleTimeString()}</p>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap">
                        <p className="text-xs font-mono font-bold text-slate-600">#{invoice.invoiceNumber || invoice.gatewayTransactionId?.slice(-8).toUpperCase() || 'N/A'}</p>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${invoice.metadata?.type === 'promotion_boost' ? 'bg-orange-50' : 'bg-blue-50'}`}>
                            {invoice.metadata?.type === 'promotion_boost' ? <Zap className="w-3 h-3 text-orange-500" /> : <Receipt className="w-3 h-3 text-blue-500" />}
                          </div>
                          <span className="text-xs font-black text-slate-700">
                            {invoice.subscription?.plan?.name || (invoice.metadata?.type === 'promotion_boost' ? 'Promotion Boost' : 'Subscription Plan')}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap">
                        <span className="text-sm font-black text-slate-900">Rs. {invoice.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          (invoice.status === 'paid' || invoice.status === 'completed') 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        {invoice.invoiceUrl && (
                          <Link
                            href={invoice.invoiceUrl}
                            target="_blank"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            <Download className="w-3 h-3" />
                            PDF
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center">
                          <Receipt className="w-12 h-12 text-slate-200 mb-4" />
                          <p className="text-sm font-black text-slate-900">No payment history found</p>
                          <p className="text-xs font-bold text-slate-400 mt-1">Your transaction records will appear here</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !saving && setShowModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                {/* Modal Header */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${editingId ? "bg-orange-500" : "bg-orange-500"} shadow-lg shadow-orange-500/20`}>
                      {editingId ? (
                        <Pencil className="w-6 h-6 text-white" />
                      ) : (
                        <Plus className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">
                        {editingId ? "Edit Listing" : "Create New Listing"}
                      </h2>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        {editingId ? "Update your promotion" : "Launch a new promotion"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => !saving && setShowModal(false)}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl transition-all active:scale-90"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
                  {/* Pricing Info Banner */}
                  {!editingId && (
                    <div className="mx-8 mt-8 p-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl text-white shadow-xl shadow-blue-900/20">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                          <Zap className="w-6 h-6 text-blue-200" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-blue-100">
                            Set Your Event Visibility Window
                          </p>
                          <p className="text-[11px] font-bold text-blue-100/80 mt-0.5 leading-relaxed">
                            Choose how many days your event stays visible. You are charged per day for the selected window.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {error}
                      </div>
                    )}

                    

                    {/* Listing Plan Section */}
                    <div className="space-y-6 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500 shadow-lg shadow-orange-500/20 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-tight">
                            Listing Visibility & Schedule
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight mt-1">
                            Per-day visibility pricing
                          </p>
                        </div>
                      </div>

                      <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Visibility Start</label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                type="datetime-local"
                                value={form.startDate}
                                onChange={(e) =>
                                  setForm((p) => ({
                                    ...p,
                                    startDate: e.target.value,
                                    promoStartTime: e.target.value,
                                  }))
                                }
                                className={inputClass + " pl-10"}
                              />
                            </div>
                          </div>
                          <div>
                            <label className={labelClass}>Visibility End</label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                type="datetime-local"
                                value={form.endDate}
                                onChange={(e) =>
                                  setForm((p) => ({
                                    ...p,
                                    endDate: e.target.value,
                                    promoEndTime: e.target.value,
                                  }))
                                }
                                className={inputClass + " pl-10"}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                              Per-Day Visibility Pricing
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              Rs. {dayRate.toLocaleString()}/day
                            </span>
                          </div>
                          {(() => {
                            const days = visibilityDayCount(form.startDate, form.endDate);
                            const total = days * dayRate;
                            return (
                              <div className="space-y-1 text-sm font-bold text-slate-700">
                                <p>{days > 0 ? `${days} day${days === 1 ? '' : 's'} selected` : 'Select start and end dates'}</p>
                                {days > 0 && (
                                  <p className="text-orange-600 text-lg font-black">
                                    Estimated total: Rs. {total.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className={labelClass}>Select Business *</label>
                        <select
                          value={form.businessId}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, businessId: e.target.value }))
                          }
                          className={inputClass}
                        >
                          <option value="">Choose a business</option>
                          {businesses.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className={labelClass}>Title *</label>
                        <input
                          required
                          value={form.title}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, title: e.target.value }))
                          }
                          className={inputClass}
                          placeholder="e.g. 50% Off Weekend Sale"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className={labelClass}>Description</label>
                        <textarea
                          rows={3}
                          value={form.description}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              description: e.target.value,
                            }))
                          }
                          className={inputClass}
                          placeholder="Describe your offer or event details..."
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Offer Badge</label>
                        <input
                          value={form.offerBadge}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              offerBadge: e.target.value,
                            }))
                          }
                          className={inputClass}
                          placeholder="e.g. LIMITED TIME"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className={labelClass}>Image</label>
                        <div className="flex items-center gap-4">
                          {form.imageUrl && (
                            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-xl flex-shrink-0">
                              <img
                                src={form.imageUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <button
                              type="button"
                              onClick={() => fileRef.current?.click()}
                              disabled={imageUploading}
                              className="w-full h-24 rounded-2xl border-2 border-dashed border-slate-200 hover:border-orange-400 hover:bg-orange-50 transition-all flex flex-col items-center justify-center gap-2 group"
                            >
                              {imageUploading ? (
                                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                              ) : (
                                <>
                                  <ImagePlus className="w-6 h-6 text-slate-400 group-hover:text-orange-500" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-orange-600">
                                    Upload Banner
                                  </span>
                                </>
                              )}
                            </button>
                            <input
                              type="file"
                              ref={fileRef}
                              onChange={handleImageUpload}
                              className="hidden"
                              accept="image/*"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center mt-0.5">
                          <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="w-5 h-5 appearance-none border-2 border-slate-300 rounded-lg checked:border-orange-500 checked:bg-orange-500 transition-colors cursor-pointer peer"
                          />
                          <svg className="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                          I agree to the <Link href="/terms" target="_blank" className="text-orange-500 font-bold hover:underline">Terms & Conditions</Link> and <Link href="/privacy" target="_blank" className="text-orange-500 font-bold hover:underline">Privacy Policy</Link>, and acknowledge that creating this listing constitutes a legal obligation.
                        </span>
                      </label>
                    </div>
                  </form>
                </div>

                {/* Modal Footer */}
                <div className="p-8 border-t border-slate-100 bg-white flex items-center justify-between gap-4">
                  <div className="hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                      Final Amount
                    </p>
                    <p className="text-2xl font-black text-slate-900 leading-none">
                      Rs. {estimatedPrice.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-1 sm:flex-initial">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setShowModal(false)}
                      className="flex-1 sm:px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={saving}
                      className="flex-[2] sm:px-12 py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white rounded-2xl font-black shadow-lg shadow-orange-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Zap className="w-5 h-5" />
                      )}
                      {editingId ? "Update Listing" : estimatedPrice > 0 ? "Create Draft + Boost" : "Create Draft"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteId && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !deleting && setDeleteId(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-white rounded-[40px] p-8 max-w-sm w-full text-center shadow-2xl"
              >
                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Delete Listing?</h3>
                <p className="text-slate-500 font-bold mb-8">This action cannot be undone. Are you sure you want to remove this promotion?</p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:bg-slate-300"
                  >
                    {deleting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Yes, Delete It"}
                  </button>
                  <button
                    onClick={() => setDeleteId(null)}
                    disabled={deleting}
                    className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </FeatureGate>
  );
}
