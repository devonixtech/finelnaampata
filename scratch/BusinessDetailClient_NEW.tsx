"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { getGoogleMapEmbedUrl } from "../../../lib/map-embed";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Star,
  MapPin,
  Globe,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Share2,
  Heart,
  MessageSquare,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X,
  Send,
  User,
  Tag,
  Zap,
  Calendar,
  Megaphone,
  Store,
  Search,
  ArrowLeft,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Link as LinkIcon,
  Images,
  Navigation,
  Loader2,
  Footprints,
  Info,
  Award,
  Activity,
  Flag,
  ArrowUpDown,
  ThumbsUp,
  Bookmark,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Link from "next/link";
import FollowButton from "../../../components/FollowButton";
import { api, getImageUrl } from "../../../lib/api";
import { Business } from "../../../types/api";
import { useAuth, setCookie } from "../../../context/AuthContext";
import { getBusinessOpenStatus } from "../../../lib/business-status";
import toast from "react-hot-toast";
import ChatTrigger, {
  ChatTriggerHandle,
} from "../../../components/chat/ChatTrigger";
import { useChat } from "../../../hooks/useChat";
import { chatApi } from "../../../services/chat.service";
import DynamicIcon from "../../../components/DynamicIcon";
import PopularTimesChart from "@/components/business/PopularTimesChart";
import ReviewDistribution from "@/components/business/ReviewDistribution";
import dynamic from "next/dynamic";

const BusinessMap = dynamic(() => import("../../../components/BusinessMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[300px] bg-slate-100 animate-pulse rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400"><MapPin className="w-8 h-8 opacity-50" /></div>
});

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

// Simple Online/Offline badge — green when vendor is logged in, red when not
const VendorOnlineBadge = ({
  isOnline,
}: {
  isOnline?: boolean;
}) => {
  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Online
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 shadow-sm">
      <span className="w-2 h-2 rounded-full bg-rose-500" />
      Offline
    </span>
  );
};

// User Trust Badge
const TrustBadge = ({ badge, score }: { badge?: string; score?: number }) => {
  if (!badge) return null;

  const getBadgeStyles = (b: string) => {
    const lb = b.toLowerCase();
    if (lb.includes("trusted") || lb.includes("verified")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (lb.includes("active")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (lb.includes("new")) return "bg-green-50 text-green-700 border-green-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border shadow-sm ${getBadgeStyles(
        badge
      )}`}
    >
      <Award className="w-2.5 h-2.5" />
      {badge}
    </div>
  );
};

// Open / Closed badge based on business hours
// Falls back to vendor.businessHours (Record) if listing.businessHours (Array) is empty
const BusinessOpenBadge = ({ business }: { business: Business }) => {
  const hoursData =
    business.businessHours && business.businessHours.length > 0
      ? business.businessHours
      : business.vendor?.businessHours;

  const { status, label, todayHours } = getBusinessOpenStatus(hoursData, business.timezone);
  if (status === "UNKNOWN") return null;

  const isOpen = status === "OPEN";
  return (
    <span
      title={todayHours ? `Today: ${todayHours}` : undefined}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${isOpen
        ? "bg-green-50 text-green-700 border-green-200"
        : "bg-slate-100 text-slate-600 border-slate-200"
        }`}
    >
      <Clock className="w-3.5 h-3.5" />
      {todayHours ? `${todayHours} (${label})` : label}
    </span>
  );
};

interface BusinessDetailClientProps {
  slug: string | string[];
  initialData?: Business;
}

export default function BusinessDetailClient({
  slug,
  initialData,
}: BusinessDetailClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [activeTab, setActiveTab] = useState("overview");

  const [comments, setComments] = useState<any[]>([]); // We keep the name 'comments' to minimize changes but it will hold Review objects
  const [isFavorite, setIsFavorite] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Review replying state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Review sort & report state
  const [reviewSort, setReviewSort] = useState<string>("most_relevant");
  const [reportingReview, setReportingReview] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [showReportModal, setShowReportModal] = useState<string | null>(null);
  const [helpfulLoading, setHelpfulLoading] = useState<string | null>(null);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const chatRef = useRef<ChatTriggerHandle>(null);

  // Enquiry modal state
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [enquiryName, setEnquiryName] = useState("");
  const [enquiryEmail, setEnquiryEmail] = useState("");
  const [enquiryPhone, setEnquiryPhone] = useState("");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  const [enquiryError, setEnquiryError] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "call" | "whatsapp" | null
  >(null);

  // Lightbox state
  const [showLightbox, setShowLightbox] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Offers & Events
  const [offers, setOffers] = useState<any[]>([]);

  // Q&A State
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionContent, setQuestionContent] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [answerContent, setAnswerContent] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [qaLoading, setQaLoading] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [showMapEmbed, setShowMapEmbed] = useState(false);
  const [vendorHasChat, setVendorHasChat] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState('all');
  const [userPhotos, setUserPhotos] = useState<any[]>([]);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [addPhotoUrl, setAddPhotoUrl] = useState('');
  const [addPhotoCaption, setAddPhotoCaption] = useState('');
  const [submittingPhoto, setSubmittingPhoto] = useState(false);
  const [photoSubmitSuccess, setPhotoSubmitSuccess] = useState(false);
  const [reviewStep, setReviewStep] = useState(1);

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    return categories.filter((cat: any) =>
      cat.name?.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  const galleryImages = useMemo(() => {
    const images: string[] = [];
    if (business?.coverImageUrl) images.push(getImageUrl(business.coverImageUrl));
    if (Array.isArray(business?.vendor?.shopPhotos)) {
      images.push(...business.vendor.shopPhotos.map(getImageUrl));
    }
    return images.filter(Boolean);
  }, [business]);

  const isOwner = user?.id === business?.vendor?.userId || user?.vendor?.id === business?.vendorId;

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setShowLightbox(true);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
  };

  useEffect(() => {
    api.categories.getAll().then((data: any) => setCategories(data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (business?.id) {
      fetch(`/api/analytics/track/view/${business.id}`, { method: 'POST' }).catch(console.error);
    }
  }, [business?.id]);


  const mapEmbedUrl = useMemo(
    () => (business ? getGoogleMapEmbedUrl(business) : null),
    [business],
  );

  useEffect(() => {
    if (business?.planFeatures?.showChat) {
      setVendorHasChat(true);
    } else if (business) {
      setVendorHasChat(false);
    }
  }, [business]);
  const openInGoogleMapsUrl = useMemo(() => {
    if (!business?.latitude || !business?.longitude) return null;
    return `https://www.google.com/maps?q=${business.latitude},${business.longitude}`;
  }, [business]);
  const additionalPhoneNumbers = useMemo(
    () =>
      (Array.isArray(business?.namedPhoneNumbers) ? business.namedPhoneNumbers : []).filter(
        (item) => item?.label && item?.number
      ),
    [business?.namedPhoneNumbers]
  );
  const businessProfileHref = useMemo(() => {
    if (business?.vendor?.slug) {
      return `/businesses/${encodeURIComponent(business.vendor.slug)}`;
    }

    const vendorIdentifier = business?.vendor?.id || business?.vendorId;
    if (vendorIdentifier) {
      return `/businesses/${encodeURIComponent(vendorIdentifier)}`;
    }

    return "#";
  }, [business?.vendor?.slug, business?.vendor?.id, business?.vendorId]);

  useEffect(() => {
    const loadBusiness = async () => {
      let actualSlug = Array.isArray(slug) ? slug[0] : slug;

      // Handle SPA fallback where the page is served by a 'template' HTML file or data is missing
      if (typeof window !== "undefined") {
        const pathParts = window.location.pathname.split("/").filter(Boolean);

        // Check for originalSlug in query params (passed by NotFound redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const querySlug = urlParams.get('originalSlug');

        // URL structure: /business/slug/ or /business/slug
        if (
          pathParts[0] === "business" &&
          pathParts[1] &&
          pathParts[1] !== "template" &&
          pathParts[1] !== "index"
        ) {
          if (!business || actualSlug !== pathParts[1]) {
            actualSlug = pathParts[1];
            console.log(
              "[BusinessDetail] Route detected from URL:",
              actualSlug,
            );
          }
        } else if (querySlug) {
          actualSlug = querySlug;
          console.log("[BusinessDetail] Route detected from query param:", actualSlug);
        }
      }

      console.log(
        "[BusinessDetail] Starting loadBusiness for slug:",
        actualSlug,
      );
      setLoading(true);
      setError(null);

      try {
        let data = business;

        // If the slug from the URL is different from the currently loaded business, force a reload
        if (data && data.slug !== actualSlug) {
          console.log("[BusinessDetail] Slug mismatch, forcing reload for:", actualSlug);
          data = null;
        }

        if (!data) {
          data = await api.listings.getBySlug(actualSlug as string);
          console.log(
            "[BusinessDetail] Business data received:",
            data?.id,
            "isOnline:",
            data?.vendor?.user?.isOnline,
          );
          setBusiness(data);
          // Track ad click for sponsored listings
          if (data?.isSponsored && data?.id) {
            api.listings.trackAdClick(data.id).catch(() => {});
          }
        } else {
          console.log("[BusinessDetail] Using initialData for slug:", actualSlug);
        }
        console.log("[BusinessDetail] Loaded Amenities:", data?.businessAmenities);
        // Load reviews (replaces legacy comments)
        try {
          const reviewsData = await api.reviews.getByBusiness(data.id);
          setComments(reviewsData.data || []);
        } catch (ce) {
          console.error("[BusinessDetail] Failed to load reviews:", ce);
        }

        // Load public offers for this business
        try {
          const offersData = await api.offers.getByBusiness(data.id);
          if (Array.isArray(offersData)) {
            const now = new Date();
            const activeOnly = offersData.filter((o: any) => {
              const expiry = o.expiryDate ? new Date(o.expiryDate) : null;
              const end = o.endDate ? new Date(o.endDate) : null;
              return (!expiry || expiry > now) && (!end || end > now);
            });
            setOffers(activeOnly);
          } else {
            setOffers([]);
          }
        } catch (oe) {
          console.error("[BusinessDetail] Failed to load offers:", oe);
        }

        // Check for referral code in URL
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get("ref");
        if (refCode && typeof window !== "undefined") {
          // Try to track the click for the logged in user
          if (user) {
            try {
              await api.affiliate.trackClick(refCode);
            } catch (e) { }
          } else {
            // Store in a 10-day cookie for later if not logged in
            setCookie("referralCode", refCode, 30);
          }
        }
      } catch (err: any) {
        console.error(
          "[BusinessDetail] CRITICAL error loading business details:",
          err,
        );
        setError(err.message || "Failed to load business details");
      } finally {
        console.log(
          "[BusinessDetail] Finishing loadBusiness, setting loading false",
        );
        setLoading(false);
      }
    };
    if (slug) loadBusiness();
  }, [slug]);

  // Load Q&As
  useEffect(() => {
    const loadQA = async () => {
      if (!business?.id) return;
      setQaLoading(true);
      try {
        const data = await api.qa.getForBusiness(business.id);
        setQuestions(data || []);
      } catch (err) {
        console.error("[BusinessDetail] Failed to load Q&A:", err);
      } finally {
        setQaLoading(false);
      }
    };
    if (activeTab === "Q&A") {
      loadQA();
    }
  }, [business?.id, activeTab]);

  // Separate effect for user-specific state (e.g. favorite status)
  useEffect(() => {
    const checkUserStates = async () => {
      if (user && business?.id) {
        try {
          const favs = await api.users.getFavorites();
          setIsFavorite(favs.data.some((fav) => fav.id === business.id));
        } catch (fe) {
          console.error(
            "[BusinessDetail] Failed to check favorite status:",
            fe,
          );
        }
      }
    };
    checkUserStates();
  }, [user, business?.id]);

  // Pre-fill enquiry form when user is available
  useEffect(() => {
    if (user) {
      setEnquiryName(user.fullName || "");
      setEnquiryEmail(user.email || "");
    }
  }, [user]);

  const handleLike = async () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!business) return;

    try {
      if (isFavorite) {
        await api.users.removeFavorite(business.id);
        setIsFavorite(false);
      } else {
        await api.users.addFavorite(business.id);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleContactIntent = async (
    action: "call" | "whatsapp" | "enquiry" | "sms",
  ) => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // For direct actions (Call/WhatsApp), generate lead immediately and then redirect
    if (action === "enquiry") {
      setPendingAction(null);
      openEnquiryModal();
      return;
    }

    // For direct actions (Call/WhatsApp), generate lead immediately and then redirect
    try {
      await api.leads.createLead({
        businessId: business!.id,
        name: user.fullName || "User",
        email: user.email || "",
        phone: user.phone || undefined,
        message: `User clicked ${action === "call" ? "Call Now" : "WhatsApp Express"}`,
        type: action,
        source: `direct-${action}`,
      });

      if (action === "call" && business?.phone) {
        fetch(`/api/analytics/track/contact/${business.id}`, { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'call' }) }).catch(console.error);
        window.location.href = `tel:${business.phone}`;
      } else if (action === "sms" && business?.phone) {
        fetch(`/api/analytics/track/contact/${business.id}`, { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'sms' }) }).catch(console.error);
        window.location.href = `sms:${business.phone}`;
      } else if (
        action === "whatsapp" &&
        (business?.whatsapp || business?.phone)
      ) {
        fetch(`/api/analytics/track/contact/${business.id}`, { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'whatsapp' }) }).catch(console.error);
        const waNumber = (business.whatsapp || business.phone).replace(
          /\s+/g,
          "",
        );
        window.open(
          `https://wa.me/${waNumber.startsWith("+") ? waNumber.substring(1) : waNumber}`,
          "_blank",
        );
      }
    } catch (err) {
      console.error("Failed to generate lead:", err);
      // Still perform the action even if lead capture fails
      if (action === "call" && business?.phone) {
        window.location.href = `tel:${business.phone}`;
      } else if (action === "sms" && business?.phone) {
        window.location.href = `sms:${business.phone}`;
      } else if (
        action === "whatsapp" &&
        (business?.whatsapp || business?.phone)
      ) {
        const waNumber = (business.whatsapp || business.phone).replace(
          /\s+/g,
          "",
        );
        window.open(
          `https://wa.me/${waNumber.startsWith("+") ? waNumber.substring(1) : waNumber}`,
          "_blank",
        );
      }
    }
  };

  const trackContactClick = (type: string) => {
    if (!business) return;
    
    // Legacy lead capture
    api.leads.createLead({
      businessId: business.id,
      name: user?.fullName || "Guest",
      email: user?.email || "",
      phone: user?.phone || undefined,
      message: `User clicked ${type}`,
      type: type as any,
      source: `listing-${type}`,
    }).catch(() => {});

    // New funnel analytics
    fetch(`/api/analytics/track/contact/${business.id}`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    }).catch(console.error);
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    if (!enquiryName.trim() || !enquiryEmail.trim() || !enquiryMessage.trim()) {
      setEnquiryError("Please fill in all required fields.");
      return;
    }
    setSubmittingEnquiry(true);
    setEnquiryError("");
    try {
      await api.leads.createLead({
        businessId: business.id,
        name: enquiryName.trim(),
        email: enquiryEmail.trim(),
        phone: enquiryPhone.trim() || undefined,
        message: enquiryMessage.trim(),
        type: "chat",
        source: pendingAction ? `intent-${pendingAction}` : "business-page",
      });

      // Integrate with Chat: Send the enquiry as a message and open chat window
      try {
        const conversation = await chatApi.getOrCreateConversation(business.id) as any;
        if (conversation && conversation.id) {
          const inquiryText = `BUSINESS INQUIRY:\n\nMessage: ${enquiryMessage.trim()}\n\nSender: ${enquiryName.trim()}\nEmail: ${enquiryEmail.trim()}${enquiryPhone.trim() ? `\nPhone: ${enquiryPhone.trim()}` : ""}`;
          await chatApi.sendMessage(conversation.id, inquiryText);
          
          // Open chat window after a small delay to allow state to settle
          setTimeout(() => {
            if (chatRef.current) {
              chatRef.current.open();
            }
          }, 500);
        }
      } catch (chatErr) {
        console.error("Failed to sync inquiry with chat:", chatErr);
      }

      setEnquirySuccess(true);
      setEnquiryMessage("");

      // After successful lead capture (for modal flow if any), trigger the pending action
      if (pendingAction === "call" && business.phone) {
        window.location.href = `tel:${business.phone}`;
      } else if (
        pendingAction === "whatsapp" &&
        (business.whatsapp || business.phone)
      ) {
        const waNumber = (business.whatsapp || business.phone).replace(
          /\s+/g,
          "",
        );
        window.open(
          `https://wa.me/${waNumber.startsWith("+") ? waNumber.substring(1) : waNumber}`,
          "_blank",
        );
      }

      setTimeout(() => {
        setShowEnquiryModal(false);
        setEnquirySuccess(false);
        setPendingAction(null);
      }, 2500);
    } catch (err: any) {
      setEnquiryError(
        err.message || "Failed to send enquiry. Please try again.",
      );
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  const openEnquiryModal = () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setEnquirySuccess(false);
    setEnquiryError("");
    setEnquiryMessage("");
    setEnquiryName(user.fullName || "");
    setEnquiryEmail(user.email || "");
    setEnquiryPhone(user.phone || "");
    setShowEnquiryModal(true);
  };

  const handleReviewSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!user.isPhoneVerified) {
      toast.error("Please verify your phone number before writing a review. Go to Settings → Phone Verification.");
      return;
    }
    if (!business) return;

    if (reviewComment.trim().length < 10) {
      toast.error("Review comment must be at least 10 characters long.");
      return;
    }

    setSubmittingReview(true);
    try {
      await api.reviews.create({
        businessId: business.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
        images: reviewImages.length > 0 ? reviewImages : undefined,
      });
      // Refresh reviews
      const reviewsData = await api.reviews.getByBusiness(business.id);
      setComments(reviewsData.data || []);
      setShowReviewModal(false);
      setReviewComment("");
      setReviewRating(5);
      setReviewImages([]);
      setReviewStep(1);
    } catch (err: any) {
      alert(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReplySubmit = async (reviewId: string) => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!isOwner) {
      alert("Only the business owner can reply to reviews");
      return;
    }
    if (!replyContent.trim()) return;

    setSubmittingReply(true);
    try {
      await api.reviews.createReply(reviewId, replyContent.trim());
      // Refresh reviews
      const reviewsData = await api.reviews.getByBusiness(business!.id);
      setComments(reviewsData.data || []);
      setReplyingTo(null);
      setReplyContent("");
    } catch (err: any) {
      alert(err.message || "Failed to submit reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  const loadReviews = async (sortBy?: string) => {
    if (!business) return;
    try {
      const reviewsData = await api.reviews.findAll({
        businessId: business.id,
        sortBy: sortBy || reviewSort,
      });
      setComments(reviewsData.data || []);
    } catch (ce) {
      console.error("[BusinessDetail] Failed to load reviews:", ce);
    }
  };

  const handleReportReview = async (reviewId: string) => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!reportReason.trim()) {
      alert("Please provide a reason for reporting.");
      return;
    }
    setReportingReview(reviewId);
    try {
      await api.reviews.report(reviewId, reportReason, reportDetails);
      alert("Review reported successfully. Our team will investigate.");
      setShowReportModal(null);
      setReportReason("");
      setReportDetails("");
    } catch (err: any) {
      alert(err.message || "Failed to report review");
    } finally {
      setReportingReview(null);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setHelpfulLoading(reviewId);
    try {
      const comment = comments.find((c: any) => c.id === reviewId);
      if (comment?.userHelpful) {
        await api.reviews.removeHelpful(reviewId);
        setComments(prev => prev.map((c: any) => c.id === reviewId ? { ...c, helpfulCount: Math.max(0, (c.helpfulCount || 1) - 1), userHelpful: false } : c));
      } else {
        await api.reviews.markHelpful(reviewId);
        setComments(prev => prev.map((c: any) => c.id === reviewId ? { ...c, helpfulCount: (c.helpfulCount || 0) + 1, userHelpful: true } : c));
      }
    } catch (err: any) {
      console.error("Helpful toggle failed:", err);
    } finally {
      setHelpfulLoading(null);
    }
  };

  useEffect(() => {
    const loadUserPhotos = async () => {
      if (!business?.id) return;
      try {
        const data = await api.listings.getUserPhotos(business.id);
        setUserPhotos(data || []);
      } catch (err) {
        console.error("[BusinessDetail] Failed to load user photos:", err);
      }
    };
    if (activeTab === 'photos') loadUserPhotos();
  }, [business?.id, activeTab]);

  const handleSubmitUserPhoto = async () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!business || !addPhotoUrl.trim()) return;
    setSubmittingPhoto(true);
    try {
      const updated = await api.listings.submitUserPhoto(business.id, {
        url: addPhotoUrl.trim(),
        caption: addPhotoCaption.trim() || undefined,
      });
      if (updated?.userSubmittedPhotos) {
        setUserPhotos(updated.userSubmittedPhotos.filter((p: any) => p.isApproved));
      }
      setAddPhotoUrl('');
      setAddPhotoCaption('');
      setShowAddPhotoModal(false);
      setPhotoSubmitSuccess(true);
      setTimeout(() => setPhotoSubmitSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to submit photo");
    } finally {
      setSubmittingPhoto(false);
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!business || !questionContent.trim()) return;

    if (questionContent.trim().length < 10) {
      alert("Question must be at least 10 characters long.");
      return;
    }

    setSubmittingQuestion(true);
    try {
      await api.qa.askQuestion({
        businessId: business.id,
        content: questionContent.trim(),
      });
      alert("Your question has been submitted and is pending moderation.");
      setQuestionContent("");
    } catch (err: any) {
      alert(err.message || "Failed to submit question");
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleAnswerSubmit = async (e: React.FormEvent, questionId: string) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!answerContent.trim()) return;

    setSubmittingAnswer(true);
    try {
      await api.qa.postAnswer({
        questionId,
        content: answerContent.trim(),
      });
      alert("Your answer has been submitted and is pending moderation.");
      setAnswerContent("");
      setAnsweringQuestionId(null);
    } catch (err: any) {
      alert(err.message || "Failed to submit answer");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Loading business...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <Store className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">Business Not Found</h2>
        <p className="text-slate-500 mb-6">This business may have been removed or doesn't exist.</p>
        <Link href="/" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
          Browse Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {business.status === "pending" && (
        <div className="bg-amber-50 border-y border-amber-100 py-3">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-3 text-amber-700">
            <Clock className="w-5 h-5 shrink-0" />
            <span className="text-sm font-black uppercase tracking-wider">
              Pending Approval
            </span>
            <span className="text-sm opacity-80 hidden sm:inline">
              | This listing is currently being reviewed by our team.
            </span>
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="max-w-5xl mx-auto px-4 py-4 md:py-6 flex flex-wrap items-center gap-2 text-xs md:text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600 shrink-0">Home</Link>
        <ChevronRight className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
        <Link href={`/search?category=${business.category?.slug || ""}`} className="hover:text-blue-600 truncate max-w-[100px] md:max-w-none">
          {business.category?.name || "Category"}
        </Link>
        <ChevronRight className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
        <span className="text-slate-900 font-medium truncate">{business.title}</span>
      </div>

      <main className="max-w-5xl mx-auto px-4 pb-24 lg:pb-12">
        {/* TOP HEADER: 3-Column Photo Layout */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-2 mb-6 h-[400px]">
          {/* Main Large Image (Left) */}
          <div
            className="relative rounded-l-2xl overflow-hidden bg-slate-100 cursor-pointer group h-full"
            onClick={() => galleryImages.length > 0 && openLightbox(0)}
          >
            {galleryImages.length > 0 ? (
              <>
                <img
                  src={galleryImages[0]}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt={business.title}
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                <Images className="w-12 h-12 mb-2" />
                <span className="text-xs font-medium">No photos</span>
              </div>
            )}
          </div>

          {/* Right Column (Map Top, Grid Bottom) */}
          <div className="grid grid-rows-2 gap-2 h-full">
            {/* Map (Top Right or Full Right if no extra photos) */}
            <div className={`relative overflow-hidden bg-slate-100 cursor-pointer group ${galleryImages.length <= 1 ? 'row-span-2 rounded-r-2xl' : 'rounded-tr-2xl'}`}>
              {mapEmbedUrl ? (
                showMapEmbed ? (
                  <iframe
                    title="Business location map"
                    src={mapEmbedUrl}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="w-full h-full relative" onClick={() => setShowMapEmbed(true)}>
                    <div className="absolute inset-0 bg-slate-200 animate-pulse" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors bg-white/50 backdrop-blur-sm">
                      <MapPin className="w-8 h-8 mb-2" />
                      <span className="text-sm font-bold">See Map</span>
                    </div>
                  </div>
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                  <MapPin className="w-8 h-8 mb-2" />
                  <span className="text-xs">No Location</span>
                </div>
              )}
            </div>

            {/* Smaller Photos Grid (Bottom Right) - Only show if we have > 1 images */}
            {galleryImages.length > 1 && (
              <div className="grid grid-cols-2 gap-2 h-full relative">
                <div
                  className="relative overflow-hidden bg-slate-100 cursor-pointer group"
                  onClick={() => openLightbox(1)}
                >
                  <img src={galleryImages[1]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Gallery 2" />
                </div>
                <div
                  className="relative rounded-br-2xl overflow-hidden bg-slate-100 cursor-pointer group"
                  onClick={() => galleryImages.length > 2 ? openLightbox(2) : undefined}
                >
                  {galleryImages.length > 2 ? (
                    <img src={galleryImages[2]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Gallery 3" />
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                       <Images className="w-6 h-6 opacity-50" />
                    </div>
                  )}
                  {galleryImages.length > 3 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/50 transition-colors">
                      <div className="flex items-center gap-2 text-white font-medium text-sm">
                        <Images className="w-4 h-4" />
                        See all {galleryImages.length} photos
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TITLE BLOCK */}
        <div className="mb-6 flex items-start gap-4">
          {business.logoUrl && (
            <img 
              src={business.logoUrl} 
              alt={`${business.title} logo`} 
              className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-full border border-slate-200 shadow-sm shrink-0" 
            />
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                {business.title}
              </h1>
              {business.isVerified && (
                <ShieldCheck className="w-6 h-6 text-blue-500 fill-blue-50" />
              )}
            </div>
            {business.businessTagline && (
              <p className="text-slate-600 font-medium italic mb-2 text-lg">"{business.businessTagline}"</p>
            )}
          
          <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-900">{business.averageRating || 'New'}</span>
              <div className="flex text-amber-400">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className={`w-4 h-4 ${i <= (business.averageRating || 0) ? 'fill-current' : 'text-slate-300'}`} />
                ))}
              </div>
              <a href="#reviews" className="text-blue-600 hover:underline">({business.totalReviews || 0} reviews)</a>
            </div>
            <span className="text-slate-300">·</span>
            <span className="text-slate-700">{business.category?.name || 'Business'}</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-700">{business.address}, {business.city}</span>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium mb-6">
            <BusinessOpenBadge business={business} />
          </div>

          {/* ACTION BUTTONS (Pills) */}
          <div className="flex flex-wrap gap-3">
            {business.website && (
              <a 
                href={business.website.startsWith('http') ? business.website : `https://${business.website}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={() => {
                  fetch(`/api/businesses/${business.id}/track/ad-click`, { method: 'POST' }).catch(console.error);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm font-bold text-blue-600"
              >
                <Globe className="w-4 h-4" /> Website
              </a>
            )}
            <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 border border-blue-600 rounded-full hover:bg-blue-700 transition-colors text-sm font-bold text-white">
              <Navigation className="w-4 h-4" /> Directions
            </button>
            {business.phone && (
              <>
                <button 
                  onClick={() => handleContactIntent('call')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm font-bold text-blue-600"
                >
                  <Phone className="w-4 h-4" /> Call
                </button>
                <button 
                  onClick={() => handleContactIntent('sms')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm font-bold text-blue-600"
                >
                  <MessageSquare className="w-4 h-4" /> SMS
                </button>
              </>
            )}
            {/* WhatsApp Button */}
            {vendorHasChat && (business.whatsappNumber || business.whatsapp || business.phone) && (
              <button 
                onClick={() => handleContactIntent('whatsapp')}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white border border-[#25D366] rounded-full hover:bg-[#1ebd5a] transition-colors text-sm font-bold"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
            )}
            {/* In-App Chat (Paid Feature) */}
            {vendorHasChat && (
              <button 
                onClick={() => router.push(`/messages?vendorId=${business.vendorId || business.vendor?.id}`)} 
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm font-bold text-blue-600"
              >
                <MessageSquare className="w-4 h-4" /> Chat
              </button>
            )}
            <button onClick={handleLike} className={`flex items-center gap-2 px-5 py-2.5 bg-white border rounded-full transition-colors text-sm font-bold ${isFavorite ? 'border-blue-200 text-blue-600' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
              <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-blue-500 text-blue-500' : ''}`} /> Save
            </button>
            <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm font-bold text-slate-700">
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>
        </div>

        {/* TABS */}
        <div className="flex gap-8 border-b border-slate-200 mb-8 overflow-x-auto">
          {['Overview', 'Services', 'Reviews', 'Photos', 'About'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`pb-4 text-sm font-bold whitespace-nowrap border-b-4 transition-colors ${
                activeTab === tab.toLowerCase()
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="min-h-[400px]">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
              <div className="space-y-8">
                {/* About snippet */}
                {business.description && (
                  <div>
                    <p className={`text-sm text-slate-700 leading-relaxed ${!aboutExpanded ? 'line-clamp-4' : ''}`}>
                      {business.description}
                    </p>
                    {business.description.length > 200 && (
                      <button onClick={() => setAboutExpanded(!aboutExpanded)} className="text-sm font-bold text-blue-600 hover:underline mt-2">
                        {aboutExpanded ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                )}
                
                {/* Highlights */}
                {business.businessAmenities && business.businessAmenities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Highlights</h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                      {business.businessAmenities.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                          <span className="text-sm text-slate-700 font-medium">{item.amenity?.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Times */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Popular times</h3>
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <PopularTimesChart businessHours={business.businessHours} />
                  </div>
                </div>
              </div>

              {/* Sidebar Cards */}
              <div className="space-y-6">
                {/* Map Integration Card */}
                {business.latitude && business.longitude && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm">
                    <BusinessMap 
                      latitude={business.latitude} 
                      longitude={business.longitude} 
                      className="w-full h-[300px] rounded-xl"
                    />
                  </div>
                )}
                            {/* Business Information Card */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                  
                  <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                    Business Info
                    <div className="h-px bg-slate-100 flex-1 ml-2" />
                  </h3>
                  
                  <div className="space-y-6 relative z-10">
                    {business.address && (
                      <div className="flex gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                          <MapPin className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="pt-1">
                          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Location</div>
                          <div className="text-sm font-bold text-slate-800 leading-tight">{business.address}</div>
                          {business.city && <div className="text-sm text-slate-500 mt-1">{business.city}</div>}
                        </div>
                      </div>
                    )}
                    
                    {business.yearEstablished && (
                      <div className="flex gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
                          <Calendar className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="pt-1">
                          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Established</div>
                          <div className="text-sm font-bold text-slate-800">{business.yearEstablished}</div>
                        </div>
                      </div>
                    )}

                    {business.employeeCount && (
                      <div className="flex gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-purple-100 transition-all">
                          <User className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="pt-1">
                          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Team Size</div>
                          <div className="text-sm font-bold text-slate-800">{business.employeeCount} Employees</div>
                        </div>
                      </div>
                    )}

                    {business.businessHours && business.businessHours.length > 0 && (
                      <div className="flex gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
                          <Clock className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3">Operating Hours</div>
                          <div className="space-y-2 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                              const hour = business.businessHours?.find((h: any) => h.dayOfWeek.toLowerCase() === day);
                              const isToday = day === new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                              
                              const formatTime = (time: string) => {
                                if (!time) return '';
                                const [h, m] = time.split(':');
                                let hours = parseInt(h, 10);
                                const ampm = hours >= 12 ? 'PM' : 'AM';
                                hours = hours % 12;
                                hours = hours ? hours : 12;
                                return `${hours}:${m} ${ampm}`;
                              };

                              let timeDisplay = 'Closed';
                              if (hour?.isOpen && hour.openTime && hour.closeTime) {
                                timeDisplay = `${formatTime(hour.openTime)} - ${formatTime(hour.closeTime)}`;
                              }

                              return (
                                <div key={day} className={`flex items-center justify-between text-sm ${isToday ? 'font-black text-blue-600 bg-blue-50/50 p-2 -mx-2 rounded-lg' : 'text-slate-600 font-medium px-2'}`}>
                                  <span className="capitalize">{day.substring(0, 3)}</span>
                                  <span>{timeDisplay}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {business.phone && (
                      <div className="flex gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-amber-100 transition-all">
                          <Phone className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="pt-1 flex-1">
                          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Contact Number</div>
                          <a href={`tel:${business.phone}`} className="text-sm font-bold text-slate-800 hover:text-blue-600 hover:underline">{business.phone}</a>
                          
                          {business.namedPhoneNumbers && business.namedPhoneNumbers.length > 0 && (
                            <div className="mt-3 space-y-2.5">
                              {business.namedPhoneNumbers.map((npn: any, idx: number) => (
                                <div key={idx} className="flex flex-col bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-0.5">{npn.label} {npn.personName && `• ${npn.personName}`}</span>
                                  <a href={`tel:${npn.number}`} className="text-sm font-bold text-slate-800 hover:text-blue-600">{npn.number}</a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {business.website && (
                      <div className="flex gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-rose-100 transition-all">
                          <Globe className="w-6 h-6 text-rose-600" />
                        </div>
                        <div className="pt-1 overflow-hidden">
                          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Website</div>
                          <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 hover:underline block truncate">
                            {business.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      </div>
                    )}

                    {business.priceRange && (
                      <div className="flex gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-green-100 transition-all">
                          <Tag className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="pt-1">
                          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Price Range</div>
                          <span className="text-sm font-bold text-slate-800">{business.priceRange}</span>
                        </div>
                      </div>
                    )}

                    {business.socialLinks && business.socialLinks.length > 0 && (
                      <div className="pt-6 mt-6 border-t border-slate-100">
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-4">Social Media</div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {business.socialLinks.map((link: any, idx: number) => {
                            const Icon = link.platform.toLowerCase() === 'facebook' ? Facebook :
                                       link.platform.toLowerCase() === 'twitter' ? Twitter :
                                       link.platform.toLowerCase() === 'instagram' ? Instagram :
                                       link.platform.toLowerCase() === 'linkedin' ? Linkedin :
                                       link.platform.toLowerCase() === 'youtube' ? Youtube : Globe;
                          return (
                            <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors" title={link.platform}>
                              <Icon className="w-5 h-5" />
                            </a>
                          );
                        })}
                      </div>
                      </div>
                    )}
                  </div>
                </div>

                {vendorHasChat && !isOwner && (
                  <ChatTrigger
                    ref={chatRef}
                    businessId={business.id}
                    businessName={business.title}
                    vendorHasChat={vendorHasChat}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                  />
                )}
                {!isOwner && (
                  <div className="space-y-3">
                    <button onClick={openEnquiryModal} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                      <Send className="w-4 h-4" /> Send Enquiry
                    </button>
                    <Link href={`/businesses/${business.slug}`} className="w-full py-4 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-100 hover:text-blue-700 transition-all shadow-sm">
                      <Store className="w-4 h-4" /> View Business Profile
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SERVICES TAB */}
          {activeTab === 'services' && (
            <div className="animate-in fade-in duration-500">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Services offered</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {business.category && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-500 transition-colors cursor-pointer group">
                    <Store className="w-6 h-6 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                    <h4 className="font-bold text-slate-900">{business.category.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">Primary category</p>
                  </div>
                )}
                {business.subcategories && business.subcategories.map((sub: any, idx: number) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:border-blue-500 transition-colors cursor-pointer">
                    <CheckCircle2 className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span className="font-medium text-slate-900">{sub.name || sub}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div className="animate-in fade-in duration-500 space-y-8">
              {/* Review Distribution */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <ReviewDistribution reviews={comments} />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-slate-900">Reviews</h3>
                <div className="flex items-center gap-3">
                  <select
                    value={reviewSort}
                    onChange={(e) => {
                      setReviewSort(e.target.value);
                      loadReviews(e.target.value);
                    }}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '32px' }}
                  >
                    <option value="most_relevant">Most Relevant</option>
                    <option value="most_helpful">Most Helpful</option>
                    <option value="photos_first">Photos First</option>
                    <option value="newest">Newest</option>
                    <option value="lowest">Lowest Rating</option>
                  </select>
                  {!isOwner && (
                    <button
                      onClick={() => {
                        if (!user) {
                          router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                          return;
                        }
                        setShowReviewModal(true);
                      }}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                    >
                      Write a review
                    </button>
                  )}
                </div>
              </div>

              {comments.length > 0 ? (
                <div className="space-y-6">
                  {comments.map((comment: any, idx: number) => (
                    <div key={comment.id || `comment-${idx}`} className="pb-6 border-b border-slate-100 last:border-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold overflow-hidden border border-slate-200">
                            {comment.user?.avatarUrl ? (
                              <img
                                src={getImageUrl(comment.user.avatarUrl) as string}
                                alt={comment.user.fullName || 'User'}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-avatar.png'; }}
                              />
                            ) : (
                              (comment.user?.fullName?.[0] || 'U').toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900">{comment.user?.fullName || 'Anonymous'}</h4>
                              <TrustBadge badge={comment.user?.badge} score={comment.user?.trust_score} />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${i < (comment.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {comment.comment && (
                        <p className="text-slate-700 leading-relaxed text-sm">{comment.comment}</p>
                      )}

                      {comment.images && comment.images.length > 0 && (
                        <div className="mt-4 flex gap-2 flex-wrap">
                          {comment.images.map((img: string, imgIdx: number) => (
                            <a key={imgIdx} href={img} target="_blank" rel="noopener noreferrer">
                              <img src={img} alt={`Review photo ${imgIdx + 1}`} className="w-24 h-24 rounded-xl object-cover border border-slate-200 hover:border-blue-400 transition-colors" />
                            </a>
                          ))}
                        </div>
                      )}
                      
                      {user && !isOwner && user.id !== comment.userId && (
                        <div className="mt-4 flex items-center gap-4">
                          <button onClick={() => handleHelpful(comment.id)} disabled={helpfulLoading === comment.id} className={`inline-flex items-center gap-2 text-xs font-bold transition-colors ${comment.userHelpful ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>
                            {helpfulLoading === comment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className={`w-4 h-4 ${comment.userHelpful ? 'fill-blue-600 text-blue-600' : ''}`} />}
                            Helpful {comment.helpfulCount > 0 && `(${comment.helpfulCount})`}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-2">No reviews yet</h4>
                  <p className="text-sm text-slate-500">Be the first to review {business.title}.</p>
                </div>
              )}
            </div>
          )}

          {/* PHOTOS TAB */}
          {activeTab === 'photos' && (
            <div className="animate-in fade-in duration-500">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-bold text-slate-900">Photos</h3>
                {!isOwner && user && (
                  <button onClick={() => setShowAddPhotoModal(true)} className="px-5 py-2.5 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2">
                    <Images className="w-4 h-4" /> Add a photo
                  </button>
                )}
              </div>

              {business.albums && business.albums.length > 0 && (
                <div className="space-y-8 mb-8">
                  {business.albums.map((album: any, idx: number) => (
                    <div key={idx} className="space-y-4">
                      <h4 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">{album.name}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {album.images?.map((img: any, imgIdx: number) => (
                          <div
                            key={imgIdx}
                            className="aspect-square rounded-2xl overflow-hidden cursor-pointer group shadow-sm relative"
                            onClick={() => window.open(img.url, '_blank')}
                          >
                            <img
                              src={img.url}
                              alt={img.caption || `${album.name} photo ${imgIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {img.caption && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                {img.caption}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {galleryImages.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">All Photos</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {galleryImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="aspect-square rounded-2xl overflow-hidden cursor-pointer group shadow-sm"
                        onClick={() => openLightbox(idx)}
                      >
                        <img
                          src={img}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Images className="w-12 h-12 mx-auto mb-3" />
                  <p className="text-sm font-medium">No photos yet</p>
                </div>
              )}
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <div className="animate-in fade-in duration-500 space-y-8 max-w-3xl">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">From the business</h3>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {business.description || "No description provided."}
                </p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-6">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm">
                   {(business.logoUrl || business.vendor?.user?.avatarUrl) ? (
                     <img
                       src={getImageUrl(business.logoUrl || business.vendor?.user?.avatarUrl) as string}
                       alt={business.title}
                       className="w-full h-full object-cover"
                     />
                   ) : (
                     <span className="text-2xl font-bold text-slate-300">
                       {(business.title?.[0] || 'B').toUpperCase()}
                     </span>
                   )}
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-900 text-lg mb-1">{business.vendor?.user?.fullName || 'Business Owner'}</h4>
                   <p className="text-sm text-slate-500">Business owner</p>
                   {business.vendor?.user?.createdAt && (
                     <p className="text-xs text-slate-400 mt-1">Joined {new Date(business.vendor.user.createdAt).getFullYear()}</p>
                   )}
                 </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Lightbox / Modals / Footer */}
      {/* Keeping original Modals and Footer below by just adding them directly as they were mostly independent */}
      <Footer />
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[20px] md:rounded-[16px] p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setShowReviewModal(false); setReviewStep(1); }}
              className="absolute top-4 right-4 md:top-8 md:right-8 text-slate-400 hover:text-slate-900 transition-colors p-2"
            >
              <span className="sr-only">Close</span>
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6 md:mb-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      step <= reviewStep
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                Write a Review
              </h3>
              <p className="text-sm text-slate-500">
                Share your experience with {business.title}
              </p>
            </div>

            <div className="space-y-4 md:space-y-6">
              {reviewStep === 1 && (
                <div className="flex flex-col items-center">
                  <label className="block text-sm font-bold text-slate-700 mb-4">
                    How was your experience?
                  </label>
                  <div className="flex gap-1 md:gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 transition-transform hover:scale-110 active:scale-90"
                      >
                        <Star
                          className={`w-8 h-8 md:w-10 md:h-10 ${star <= reviewRating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                        />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewStep(2)}
                    className="mt-8 w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                  >
                    Next
                  </button>
                </div>
              )}

              {reviewStep === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Your review
                    </label>
                    <textarea
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={4}
                      placeholder="Tell others what you liked or disliked..."
                      className="w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border border-slate-100 rounded-2xl md:rounded-3xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 text-sm md:text-base text-slate-600"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewStep(1)}
                      className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewStep(3)}
                      className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {reviewStep === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Photos (optional, max 5)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      max={5}
                      onChange={async (e) => {
                        const rawFiles = Array.from(e.target.files || []).slice(0, 5);
                        for (const file of rawFiles) {
                          try {
                            const imageCompression = (await import('browser-image-compression')).default;
                            const compressed = await imageCompression(file, {
                              maxSizeMB: 0.5,
                              maxWidthOrHeight: 1600,
                              useWebWorker: true,
                              fileType: 'image/jpeg',
                              initialQuality: 0.8,
                            });
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setReviewImages(prev => [...prev.slice(0, 4), reader.result as string]);
                            };
                            reader.readAsDataURL(compressed);
                          } catch {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setReviewImages(prev => [...prev.slice(0, 4), reader.result as string]);
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                      }}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-all"
                    />
                    {reviewImages.length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {reviewImages.map((img, idx) => (
                          <div key={idx} className="relative">
                            <img src={img} alt={`Preview ${idx + 1}`} className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                            <button
                              type="button"
                              onClick={() => setReviewImages(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewStep(2)}
                      className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleReviewSubmit}
                      disabled={submittingReview}
                      className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    >
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enquiry Modal */}
      <AnimatePresence>
        {showEnquiryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-lg rounded-[16px] shadow-2xl relative overflow-hidden"
            >
              {/* Header gradient bar */}
              {/* <div className="h-2 w-full bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500" /> */}

              <div className="p-6 md:p-8">
                <button
                  onClick={() => setShowEnquiryModal(false)}
                  className="absolute top-4 right-4 md:top-6 md:right-6 text-slate-400 hover:text-slate-900 transition-colors p-1.5 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>

                {enquirySuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 text-center"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-violet-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">
                      Enquiry Sent!
                    </h3>
                    <p className="text-slate-500">
                      The business owner will get back to you soon.
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
                          <Send className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900">
                            Send Enquiry
                          </h3>
                          <p className="text-sm text-slate-400">
                            to {business?.title}
                          </p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleEnquirySubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                            Full Name *
                          </label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input
                              id="enquiry-name"
                              type="text"
                              required
                              value={enquiryName}
                              onChange={(e) => setEnquiryName(e.target.value)}
                              placeholder="Your name"
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none transition-all placeholder:text-slate-300"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                            Email *
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input
                              id="enquiry-email"
                              type="email"
                              required
                              value={enquiryEmail}
                              onChange={(e) => setEnquiryEmail(e.target.value)}
                              placeholder="your@email.com"
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none transition-all placeholder:text-slate-300"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                          Phone{" "}
                          <span className="normal-case font-medium text-slate-300">
                            (optional)
                          </span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input
                            id="enquiry-phone"
                            type="tel"
                            value={enquiryPhone}
                            onChange={(e) => setEnquiryPhone(e.target.value)}
                            placeholder="+60 123 456 7890"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none transition-all placeholder:text-slate-300"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                          Your Message *
                        </label>
                        <textarea
                          id="enquiry-message"
                          required
                          value={enquiryMessage}
                          onChange={(e) => setEnquiryMessage(e.target.value)}
                          rows={4}
                          placeholder="Hi, I'd like to enquire about your services..."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none transition-all placeholder:text-slate-300 resize-none"
                        />
                      </div>

                      {enquiryError && (
                        <div className="px-4 py-3 bg-rose-50 border border-rose-100 rounded-2xl text-sm text-rose-600 font-medium">
                          {enquiryError}
                        </div>
                      )}

                      <button
                        type="submit"
                        id="enquiry-submit-btn"
                        disabled={submittingEnquiry}
                        className="w-full py-4 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:from-violet-700 hover:to-blue-700 transition-all shadow-lg shadow-violet-500/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                      >
                        {submittingEnquiry ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" /> Send Enquiry
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Lightbox Slider */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-12 bg-slate-950/95 backdrop-blur-2xl"
            onClick={() => setShowLightbox(false)}
          >
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-6 right-6 z-[210] p-3 bg-white/10 hover:bg-white/25 text-white rounded-full backdrop-blur-md transition-all border border-white/10 shadow-2xl"
            >
              <X className="w-6 h-6" />
            </button>

            <div
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute left-4 md:left-8 z-[210] p-4 bg-white/10 hover:bg-white/25 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/10 shadow-2xl"
                onClick={prevImage}
              >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 0.95, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: -20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="w-full h-full flex flex-col items-center justify-center"
                >
                  <img
                    src={galleryImages[currentImageIndex]}
                    alt={`Gallery selection ${currentImageIndex + 1}`}
                    className="w-full h-full max-h-[85vh] object-contain select-none drop-shadow-2xl rounded-xl"
                  />
                  
                  {/* Thumbnails Indicator */}
                  <div className="absolute bottom-4 flex gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/10 shadow-xl">
                    {galleryImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === currentImageIndex ? "bg-white w-8" : "bg-white/40 hover:bg-white/80"}`}
                      />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <button
                className="absolute right-4 md:right-8 z-[210] p-4 bg-white/10 hover:bg-white/25 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/10 shadow-2xl"
                onClick={nextImage}
              >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-[16px] shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" /> */}

              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">
                      Share Listing
                    </h3>
                    <p className="text-sm text-slate-400 font-medium">
                      Spreading the word about {business?.title}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="text-slate-400 hover:text-slate-900 transition-colors p-2 rounded-full hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-8">
                  {[
                    {
                      name: "WhatsApp",
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                      ),
                      color: "bg-[#25D366]",
                      url: `https://wa.me/?text=Check out ${business?.title} on Local Business Listing: ${window.location.href}`,
                    },
                    {
                      name: "Facebook",
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      ),
                      color: "bg-[#1877F2]",
                      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
                    },
                    {
                      name: "Twitter",
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                        </svg>
                      ),
                      color: "bg-black",
                      url: `https://twitter.com/intent/tweet?text=Check out ${business?.title}&url=${encodeURIComponent(window.location.href)}`,
                    },
                    {
                      name: "LinkedIn",
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      ),
                      color: "bg-[#0A66C2]",
                      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                    },
                  ].map((platform) => (
                    <a
                      key={platform.name}
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div
                        className={`w-16 h-16 ${platform.color} text-white rounded-[20px] flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}
                      >
                        {platform.icon}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                        {platform.name}
                      </span>
                    </a>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={window.location.href}
                      className="w-full pl-4 pr-24 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-500 outline-none"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="absolute right-2 top-2 bottom-2 px-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors"
                    >
                      {copySuccess ? "Copied!" : "Copy Link"}
                    </button>
                  </div>

                  <a
                    href={`mailto:?subject=Check out ${business?.title}&body=I found this business on Local Listings: ${window.location.href}`}
                    className="w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center gap-3 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-all"
                  >
                    <Mail className="w-4 h-4" /> Share via Email
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Review Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowReportModal(null); setReportReason(""); setReportDetails(""); }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[24px] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                  <Flag className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Report Review</h3>
                  <p className="text-xs text-slate-400 font-medium">Help us maintain quality</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reason *</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-red-500/20 outline-none"
                  >
                    <option value="">Select a reason...</option>
                    <option value="spam">Spam or fake review</option>
                    <option value="inappropriate">Inappropriate content</option>
                    <option value="offtopic">Off-topic or irrelevant</option>
                    <option value="conflict">Conflict of interest</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Additional Details</label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-red-500/20 outline-none resize-none"
                    placeholder="Optional: provide more context..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowReportModal(null); setReportReason(""); setReportDetails(""); }}
                  className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-sm hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReportReview(showReportModal)}
                  disabled={!reportReason.trim() || reportingReview === showReportModal}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black text-sm hover:bg-red-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {reportingReview === showReportModal ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Flag className="w-4 h-4" /> Submit Report
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add User Photo Modal */}
      <AnimatePresence>
        {showAddPhotoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-[16px] shadow-2xl relative overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <button
                  onClick={() => { setShowAddPhotoModal(false); setAddPhotoUrl(''); setAddPhotoCaption(''); }}
                  className="absolute top-4 right-4 md:top-6 md:right-6 text-slate-400 hover:text-slate-900 transition-colors p-1.5 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                      <Images className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Add a Photo</h3>
                      <p className="text-sm text-slate-400">Submit a photo for {business?.title}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Image URL *
                    </label>
                    <input
                      type="url"
                      value={addPhotoUrl}
                      onChange={(e) => setAddPhotoUrl(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Caption (optional)
                    </label>
                    <input
                      type="text"
                      value={addPhotoCaption}
                      onChange={(e) => setAddPhotoCaption(e.target.value)}
                      placeholder="Describe this photo..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>

                  <button
                    onClick={handleSubmitUserPhoto}
                    disabled={submittingPhoto || !addPhotoUrl.trim()}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  >
                    {submittingPhoto ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" /> Submit Photo
                      </>
                    )}
                  </button>
                  <p className="text-xs text-slate-400 text-center">
                    Your photo will be reviewed before appearing publicly.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
