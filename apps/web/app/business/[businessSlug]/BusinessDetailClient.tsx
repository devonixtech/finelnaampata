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
import ChatTrigger, {
  ChatTriggerHandle,
} from "../../../components/chat/ChatTrigger";
import { useChat } from "../../../hooks/useChat";
import { chatApi } from "../../../services/chat.service";
import DynamicIcon from "../../../components/DynamicIcon";

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

  const normalizedBadge = (() => {
    const lb = badge.toLowerCase();
    if (lb.includes("trusted") || lb.includes("verified")) return "Recommended";
    return badge;
  })();

  const getBadgeStyles = (b: string) => {
    const lb = b.toLowerCase();
    if (lb.includes("trusted") || lb.includes("verified") || lb.includes("recommended")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (lb.includes("active")) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border shadow-sm ${getBadgeStyles(
        normalizedBadge
      )}`}
    >
      <Award className="w-2.5 h-2.5" />
      {normalizedBadge}
      {score !== undefined && <span className="ml-1 opacity-60">Score: {score}</span>}
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

  const { status, label, todayHours } = getBusinessOpenStatus(hoursData);
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
  const [activeTab, setActiveTab] = useState("Overview");

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
  const [showMapEmbed, setShowMapEmbed] = useState(true);


  const mapEmbedUrl = useMemo(
    () => (business ? getGoogleMapEmbedUrl(business) : null),
    [business],
  );
  const openInGoogleMapsUrl = useMemo(() => {
    if (!business?.latitude || !business?.longitude) return null;
    return `https://www.google.com/maps?q=${business.latitude},${business.longitude}`;
  }, [business]);
  const additionalPhoneNumbers = useMemo(
    () =>
      (business?.namedPhoneNumbers || []).filter(
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
            setCookie("referralCode", refCode, 10);
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
    action: "call" | "whatsapp" | "enquiry",
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
        window.location.href = `tel:${business.phone}`;
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
    } catch (err) {
      console.error("Failed to generate lead:", err);
      // Still perform the action even if lead capture fails
      if (action === "call" && business?.phone) {
        window.location.href = `tel:${business.phone}`;
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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!business) return;

    if (reviewComment.trim().length < 10) {
      alert("Review comment must be at least 10 characters long.");
      return;
    }

    setSubmittingReview(true);
    try {
      await api.reviews.create({
        businessId: business.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      // Refresh reviews
      const reviewsData = await api.reviews.getByBusiness(business.id);
      setComments(reviewsData.data || []);
      setShowReviewModal(false);
      setReviewComment("");
      setReviewRating(5);
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

  if (loading)
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">
          Loading business details...
        </div>
      </div>
    );

  if (error || !business) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="max-w-xl w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
            <div className="relative mx-auto w-40 h-40">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="absolute inset-0 bg-blue-50 rounded-[28px] rotate-6"
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: 0.1,
                }}
                className="absolute inset-0 bg-white border-2 border-slate-100 rounded-[28px] shadow-sm flex items-center justify-center"
              >
                <Store className="w-16 h-16 text-slate-200" />
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/30">
                  <X className="w-5 h-5 text-white" />
                </div>
              </motion.div>
            </div>

            <div>
              <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
                Business Not Found
              </h1>
              <p className="text-slate-500 font-medium leading-relaxed max-w-sm mx-auto mb-2">
                The business you're looking for might have been moved, deleted,
                or is currently awaiting approval.
              </p>
              {error && (
                <p className="text-rose-500 text-xs font-mono bg-rose-50 p-2 rounded-lg inline-block">
                  Error: {error}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/search"
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95"
              >
                <Search className="w-5 h-5" /> Browse Businesses
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" /> Go Back Home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Check if current logged-in user is the owner of this business.
  // STRICT: Both sides must be non-null, non-empty strings before comparing.
  // Prevents false positives from `undefined === undefined` when API fields are missing.
  const currentUserId = user?.id;
  const vendorUserId = business.vendor?.userId || business.vendor?.user?.id;
  const isOwner = !!(
    currentUserId &&
    vendorUserId &&
    typeof currentUserId === "string" &&
    typeof vendorUserId === "string" &&
    currentUserId === vendorUserId
  );

  const imagePaths = new Set(
    [business.coverImageUrl, ...(business.images || [])].filter(Boolean),
  );

  const actualImages = Array.from(imagePaths)
    .map((img) => getImageUrl(img))
    .filter(Boolean) as string[];

  const galleryImages = actualImages;

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setShowLightbox(true);
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex(
      (prev) => (prev - 1 + galleryImages.length) % galleryImages.length,
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

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
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 border-b border-slate-100 flex flex-wrap items-center gap-2 text-xs md:text-sm text-slate-400">
        <Link href="/" className="hover:text-blue-600 shrink-0">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
        <Link
          href={`/search?category=${business.category?.slug || ""}`}
          className="hover:text-blue-600 truncate max-w-[100px] md:max-w-none"
        >
          {business.category?.name || "Category"}
        </Link>
        <ChevronRight className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
        <span className="text-slate-900 font-medium truncate">{business.title}</span>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12 pb-24 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {business.isVerified && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" /> Recommended
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-wider border border-primary/20">
                      {business.category?.name || "Business"}
                    </div>
                    {business.status === "pending" && (
                      <div className="px-4 py-1.5 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-amber-500/20">
                        <Clock className="w-3.5 h-3.5" /> Pending
                      </div>
                    )}
                  </div>
                  <VendorOnlineBadge
                    isOnline={business.vendor?.isOnline}
                  />
                  <BusinessOpenBadge business={business} />
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
                  {business.title}
                </h1>

                <div className="flex flex-wrap items-center gap-6 text-slate-500">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="font-black text-slate-900 text-lg">
                      {business.averageRating || "New"}
                    </span>
                    <span className="text-sm font-bold text-slate-400">
                      ({business.totalReviews || 0} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                      {business.address}, {business.city}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  className={`p-4 rounded-2xl transition-all duration-300 shadow-sm border ${isFavorite
                    ? "bg-rose-500 text-white border-rose-500 shadow-rose-500/20"
                    : "bg-white border-slate-200 text-slate-400 hover:border-rose-400 hover:text-rose-500"
                    }`}
                >
                  <Heart
                    className={`w-6 h-6 ${isFavorite ? "fill-white" : ""}`}
                  />
                </button>
                <button
                  onClick={handleShare}
                  className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:border-primary hover:text-primary transition-all duration-300 shadow-sm relative group"
                >
                  <Share2 className="w-6 h-6" />
                  {copySuccess && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl whitespace-nowrap shadow-xl animate-in fade-in slide-in-from-bottom-2">
                      Link Copied!
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Gallery */}
            <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 h-[350px] md:h-[600px] gap-3 md:gap-5 mb-12 md:mb-20 relative z-10">
              {galleryImages.length > 0 ? (
                <>
                  <div
                    onClick={() => openLightbox(0)}
                    className={`${galleryImages.length === 1 ? 'col-span-2 md:col-span-4' : 'col-span-2 md:col-span-2'} row-span-1 md:row-span-2 rounded-[32px] overflow-hidden border border-slate-100 bg-slate-50 cursor-pointer group relative shadow-premium`}
                  >
                    <img
                      src={galleryImages[0]}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      alt={business.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-6 right-6 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl text-white text-[10px] font-black uppercase tracking-widest border border-white/20 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                      View HD Photo
                    </div>
                  </div>

                  {galleryImages.length > 1 && (
                    <div
                      onClick={() => openLightbox(1)}
                      className={`${galleryImages.length === 2 ? 'col-span-2' : 'col-span-1 md:col-span-2'} row-span-1 rounded-[28px] overflow-hidden border border-slate-100 bg-slate-50 cursor-pointer group relative shadow-premium`}
                    >
                      <img
                        src={galleryImages[1]}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        alt="Gallery 2"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  )}

                  {galleryImages.length > 2 && (
                    <div
                      onClick={() => openLightbox(2)}
                      className="col-span-1 row-span-1 rounded-[24px] overflow-hidden border border-slate-100 bg-slate-50 cursor-pointer group relative shadow-premium"
                    >
                      <img
                        src={galleryImages[2]}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        alt="Gallery 3"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  )}

                  {galleryImages.length > 0 && (
                    <div
                      onClick={() => openLightbox(galleryImages.length > 3 ? 3 : 0)}
                      className={`${galleryImages.length === 2 ? 'col-span-2' : 'col-span-1'} row-span-1 rounded-[24px] bg-slate-900 flex flex-col items-center justify-center cursor-pointer hover:bg-primary transition-all duration-500 group shadow-xl relative overflow-hidden`}
                    >
                      {galleryImages.length >= 4 && (
                        <>
                          <img
                            src={galleryImages[3]}
                            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-125 transition-transform duration-1000 blur-[2px]"
                            alt="More photos"
                          />
                          <div className="absolute inset-0 bg-slate-900/60 group-hover:bg-primary/40 transition-colors duration-500" />
                        </>
                      )}
                      <div className="relative z-10 flex flex-col items-center p-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Images className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white font-black uppercase tracking-[0.2em] text-[10px] text-center">
                          {galleryImages.length} Photos
                        </span>
                        <span className="text-white/50 font-bold uppercase tracking-widest text-[8px] mt-2 group-hover:text-white transition-colors">
                          Show All
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="col-span-2 md:col-span-4 row-span-1 md:row-span-2 rounded-[40px] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 gap-6 group hover:border-primary/30 transition-all duration-500 p-12">
                  <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center shadow-premium group-hover:scale-110 transition-transform duration-700">
                    <Images className="w-12 h-12 text-slate-200 group-hover:text-primary/20" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 mb-2">No Gallery Photos</p>
                    <p className="text-xs font-bold text-slate-300 max-w-[240px] mx-auto leading-relaxed">This business hasn't added any interior or service photos yet.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs / Content */}
            {(() => {
              const validFaqs =
                business.faqs?.filter((faq) => faq.question && faq.answer) ||
                [];
              return (
                <>
                  <div className="border-b border-slate-100 flex items-center gap-10 md:gap-16 mb-12 overflow-x-auto scrollbar-hide">
                    {[
                      "Overview",
                      "Reviews",
                      "Amenities",
                      "Q&A",
                      "FAQs",
                    ].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`relative py-5 text-sm font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === tab
                          ? "text-primary"
                          : "text-slate-400 hover:text-slate-600"
                          }`}
                      >
                        {tab}
                        {activeTab === tab && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full shadow-[0_0_12px_rgba(255,122,48,0.5)]"
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="min-h-[400px]">
                    <div
                      className={activeTab === "Overview" ? "block" : "hidden"}
                    >
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="bg-slate-50/50 rounded-[40px] p-8 md:p-12 border border-slate-100 mb-12">
                          <h3 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-4">
                            <span className="w-12 h-1.5 bg-primary rounded-full" />
                            About the Business
                          </h3>
                          <p className="text-xl text-slate-600 leading-relaxed font-medium">
                            {business.description}
                          </p>
                        </div>



                        {/* Detailed Map Section */}
                        <div className="space-y-8">
                          <h3 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                              <Navigation className="w-6 h-6 text-blue-600" />
                            </div>
                            Location & Directions
                          </h3>
                          <div className="flex flex-wrap gap-3">
                          </div>
                          <div className="relative h-[400px] rounded-[20px] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50 bg-slate-50">
                            {mapEmbedUrl && showMapEmbed ? (
                              <iframe
                                title="Business location map"
                                src={mapEmbedUrl}
                                className="w-full h-full border-0"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                allowFullScreen
                              />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                                <MapPin className="w-10 h-10 text-slate-300 mb-3" />
                                <p className="font-bold text-slate-900">
                                  {mapEmbedUrl ? "Map preview ready" : "Map preview"}
                                </p>
                                <p className="text-sm text-slate-500 mt-1 max-w-xs">
                                  {business.address}, {business.city}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {mapEmbedUrl && !showMapEmbed && (
                              <button
                                type="button"
                                onClick={() => setShowMapEmbed(true)}
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 text-xs font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition-colors"
                              >
                                <Navigation className="w-4 h-4" />
                                Load Map
                              </button>
                            )}
                            {openInGoogleMapsUrl && (
                              <button
                                type="button"
                                onClick={() => window.open(openInGoogleMapsUrl, '_blank')}
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-primary transition-colors"
                              >
                                <MapPin className="w-4 h-4" />
                                Get Directions
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className={activeTab === "Reviews" ? "block" : "hidden"}
                    >
                      <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-bold text-slate-900">
                            Customer Reviews
                          </h3>
                          {isOwner ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                              <ShieldCheck className="w-4 h-4 text-blue-500" />
                              <span className="text-xs font-bold text-blue-600">
                                Your Business
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (!user) {
                                  router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                                  return;
                                }
                                setShowReviewModal(true);
                              }}
                              className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
                            >
                              Write a Review
                            </button>
                          )}
                        </div>

                        {comments.length > 0 ? (
                          <div className="space-y-6">
                            {comments.map((comment: any, idx: number) => (
                              <div
                                key={comment.id || `comment-${idx}`}
                                className="p-4 bg-white rounded-[16px] border border-slate-100 shadow-sm transition-all hover:shadow-md"
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold overflow-hidden shadow-inner">
                                      {comment.user?.avatarUrl ? (
                                        <img
                                          src={
                                            getImageUrl(
                                              comment.user.avatarUrl,
                                            ) as string
                                          }
                                          alt={comment.user.fullName || "User"}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                                          }}
                                        />
                                      ) : (
                                        (
                                          comment.user?.fullName?.[0] || "U"
                                        ).toUpperCase()
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                        <h4 className="font-bold text-slate-900">
                                          {comment.user?.fullName || "Anonymous"}
                                        </h4>
                                        <TrustBadge
                                          badge={comment.user?.badge}
                                          score={comment.user?.trust_score}
                                        />
                                      </div>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`w-3.5 h-3.5 ${i < (comment.rating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                                          />
                                        ))}
                                        <span className="text-[10px] text-slate-400 ml-2">
                                          {new Date(
                                            comment.createdAt,
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {comment.comment && (
                                  <p className="text-slate-600 leading-relaxed italic">
                                    "{comment.comment}"
                                  </p>
                                )}

                                {/* Business Response (if any) */}
                                {comment.vendorResponse && (
                                  <div className="mt-6 p-5 bg-blue-50 rounded-3xl border border-blue-100 relative">
                                    <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-blue-100 rounded-lg shadow-sm">
                                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                        Business Response
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-700 font-medium leading-relaxed italic">
                                      "{comment.vendorResponse}"
                                    </p>
                                    {comment.vendorResponseAt && (
                                      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        <Clock className="w-3 h-3" />
                                        {new Date(
                                          comment.vendorResponseAt,
                                        ).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* User Replies */}
                                {comment.replies &&
                                  comment.replies.length > 0 && (
                                    <div className="mt-6 ml-4 sm:ml-8 space-y-4 border-l-2 border-slate-100 pl-4 sm:pl-6">
                                      {comment.replies.map((reply: any) => (
                                        <div
                                          key={reply.id}
                                          className="relative group"
                                        >
                                          <div className="flex items-center gap-3 mb-2">
                                            <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center text-violet-600 font-bold text-[10px] shadow-sm">
                                              {reply.user?.avatarUrl ? (
                                                <img
                                                  src={
                                                    getImageUrl(
                                                      reply.user.avatarUrl,
                                                    ) as string
                                                  }
                                                  alt={
                                                    reply.user.fullName ||
                                                    "User"
                                                  }
                                                  className="w-full h-full object-cover rounded-lg"
                                                  onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                                                  }}
                                                />
                                              ) : (
                                                (
                                                  reply.user?.fullName?.[0] ||
                                                  "U"
                                                ).toUpperCase()
                                              )}
                                            </div>
                                            <div>
                                              <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
                                                {reply.user?.fullName ||
                                                  "Anonymous"}
                                              </h5>
                                              <p className="text-[9px] text-slate-400 font-bold">
                                                {new Date(
                                                  reply.createdAt,
                                                ).toLocaleDateString()}
                                              </p>
                                            </div>
                                          </div>
                                          <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                            {reply.content}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                {/* Reply Action & Form */}
                                {isOwner && (
                                  <div className="mt-6 pt-4 border-t border-slate-50">
                                    {replyingTo === comment.id ? (
                                      <div className="animate-in slide-in-from-top-2 duration-300">
                                        <div className="flex items-center justify-between mb-3">
                                          <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">
                                            <MessageSquare className="w-3 h-3" />{" "}
                                            Replying to Review
                                          </span>
                                          <button
                                            onClick={() => setReplyingTo(null)}
                                            className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                        <textarea
                                          autoFocus
                                          value={replyContent}
                                          onChange={(e) =>
                                            setReplyContent(e.target.value)
                                          }
                                          placeholder="Write your reply..."
                                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-medium focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none transition-all placeholder:text-slate-300 resize-none"
                                          rows={3}
                                        />
                                        <div className="flex justify-end mt-3">
                                          <button
                                            onClick={() =>
                                              handleReplySubmit(comment.id)
                                            }
                                            disabled={
                                              submittingReply ||
                                              !replyContent.trim()
                                            }
                                            className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/20 active:scale-95 disabled:opacity-50"
                                          >
                                            {submittingReply
                                              ? "Posting..."
                                              : "Post Reply"}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setReplyingTo(comment.id)}
                                        className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-violet-600 uppercase tracking-widest transition-colors group"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                        Reply to{" "}
                                        {comment.user?.fullName?.split(" ")[0] ||
                                          "User"}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-12 bg-slate-50 rounded-[20px] text-center border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                              <MessageSquare className="w-8 h-8 text-slate-300" />
                            </div>
                            <h4 className="font-bold text-slate-900 mb-2">
                              No reviews yet
                            </h4>
                            <p className="text-sm text-slate-500">
                              Be the first to share your experience with{" "}
                              {business.title}.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={activeTab === "Amenities" ? "block" : "hidden"}
                    >
                      <div className="animate-in fade-in duration-500">
                        <h3 className="text-2xl font-bold text-slate-900 mb-8">
                          Business Amenities
                        </h3>
                        {business.businessAmenities && business.businessAmenities.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                            {business.businessAmenities.map((item, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group flex items-center gap-3 md:gap-4 p-4 md:p-5 bg-white rounded-xl md:rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all hover:-translate-y-1"
                              >
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors shrink-0">
                                  <DynamicIcon name={item.amenity?.icon || "CheckCircle2"} className="w-5 h-5 md:w-6 md:h-6 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-slate-900 leading-tight text-sm md:text-base truncate">{item.amenity?.name}</h4>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                              <CheckCircle2 className="w-10 h-10 text-slate-200" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No Amenities Listed</h3>
                            <p className="text-slate-400 font-medium max-w-sm mx-auto">
                              The business hasn't specified any amenities yet.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={activeTab === "Q&A" ? "block" : "hidden"}
                    >
                      <div className="animate-in fade-in duration-500">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-2xl font-bold text-slate-900">
                            Questions & Answers
                          </h3>
                          {!isOwner && (
                            <button
                              onClick={() => {
                                const el = document.getElementById(
                                  "ask-question-form",
                                );
                                el?.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="text-sm font-bold text-blue-600 hover:text-blue-700"
                            >
                              Ask a Question
                            </button>
                          )}
                        </div>

                        {qaLoading ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                            <p className="text-slate-500 font-medium">
                              Loading questions...
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            {questions.length > 0 ? (
                              questions.map((q) => (
                                <div
                                  key={q.id}
                                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                                >
                                  <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                                    <div className="flex items-start gap-4">
                                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 font-bold">
                                        Q
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-lg font-bold text-slate-900 mb-1">
                                          {q.content}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                                          <span>
                                            Asked by{" "}
                                            {q.user?.fullName || "Anonymous"}
                                          </span>
                                          <span>•</span>
                                          <span>
                                            {new Date(
                                              q.createdAt,
                                            ).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="p-6 space-y-6">
                                    {/* Answers List */}
                                    <div className="space-y-4">
                                      {(q.answers || [])
                                        .sort(
                                          (a: any, b: any) =>
                                            (b.isOfficial ? 1 : 0) -
                                            (a.isOfficial ? 1 : 0),
                                        )
                                        .map((a: any) => (
                                          <div
                                            key={a.id}
                                            className={`p-4 rounded-xl ${a.isOfficial ? "bg-blue-50/50 border border-blue-100" : "bg-slate-50/50"}`}
                                          >
                                            <div className="flex items-start gap-3">
                                              <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs ${a.isOfficial ? "bg-blue-600" : "bg-slate-400"}`}
                                              >
                                                {a.isOfficial ? "V" : "A"}
                                              </div>
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                  <span
                                                    className={`text-sm font-bold ${a.isOfficial ? "text-blue-700" : "text-slate-700"}`}
                                                  >
                                                    {a.isOfficial
                                                      ? "Official Answer"
                                                      : a.user?.fullName ||
                                                      "User Answer"}
                                                  </span>
                                                  {a.isOfficial && (
                                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                                  )}
                                                </div>
                                                <p className="text-sm text-slate-600 leading-relaxed">
                                                  {a.content}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-2">
                                                  {new Date(
                                                    a.createdAt,
                                                  ).toLocaleDateString()}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        ))}

                                      {(!q.answers ||
                                        q.answers.length === 0) && (
                                          <p className="text-sm text-slate-400 italic">
                                            No answers yet.
                                          </p>
                                        )}
                                    </div>

                                    {/* Reply Form Trigger */}
                                    {!answeringQuestionId && (
                                      <button
                                        onClick={() =>
                                          setAnsweringQuestionId(q.id)
                                        }
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" />{" "}
                                        Reply to this question
                                      </button>
                                    )}

                                    {/* Reply Form */}
                                    {answeringQuestionId === q.id && (
                                      <form
                                        onSubmit={(e) =>
                                          handleAnswerSubmit(e, q.id)
                                        }
                                        className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300"
                                      >
                                        <textarea
                                          required
                                          value={answerContent}
                                          onChange={(e) =>
                                            setAnswerContent(e.target.value)
                                          }
                                          placeholder="Write your answer..."
                                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:bg-white outline-none min-h-[100px] resize-none"
                                        />
                                        <div className="flex justify-end gap-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setAnsweringQuestionId(null);
                                              setAnswerContent("");
                                            }}
                                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="submit"
                                            disabled={
                                              submittingAnswer ||
                                              !answerContent.trim()
                                            }
                                            className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:bg-blue-300 transition-all flex items-center gap-2"
                                          >
                                            {submittingAnswer ? (
                                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                              <Send className="w-3.5 h-3.5" />
                                            )}
                                            Post Answer
                                          </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 italic">
                                          Your answer will be visible after
                                          admin approval.
                                        </p>
                                      </form>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h4 className="text-lg font-bold text-slate-900 mb-2">
                                  No questions yet
                                </h4>
                                <p className="text-slate-500 max-w-xs mx-auto text-sm">
                                  Be the first to ask a question to this
                                  business!
                                </p>
                              </div>
                            )}

                            {/* Ask Question Form */}
                            {!isOwner && (
                              <div
                                id="ask-question-form"
                                className="mt-8 md:mt-12 p-6 md:p-8 bg-blue-50/50 rounded-[24px] md:rounded-[32px] border border-blue-100"
                              >
                                <h4 className="text-lg md:text-xl font-bold text-slate-900 mb-4 md:mb-6">
                                  Ask a Question
                                </h4>
                                <form
                                  onSubmit={handleQuestionSubmit}
                                  className="space-y-4"
                                >
                                  <textarea
                                    required
                                    value={questionContent}
                                    onChange={(e) =>
                                      setQuestionContent(e.target.value)
                                    }
                                    placeholder="What would you like to know? (e.g. Do you have parking available?)"
                                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none min-h-[120px] resize-none"
                                  />
                                  <button
                                    type="submit"
                                    disabled={
                                      submittingQuestion ||
                                      !questionContent.trim()
                                    }
                                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:bg-blue-300 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20"
                                  >
                                    {submittingQuestion ? (
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                      <Send className="w-5 h-5" />
                                    )}
                                    Submit Question
                                  </button>
                                  <p className="text-xs text-slate-500 text-center font-medium italic">
                                    Questions are moderated and will appear
                                    after admin approval.
                                  </p>
                                </form>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={
                        activeTab === "Offer / Deal" ? "block" : "hidden"
                      }
                    >
                      <div className="animate-in fade-in duration-500">
                        <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                          <Tag className="w-6 h-6 text-orange-500" /> Offer /
                          Banner Ad
                        </h3>

                        {/* Banner image */}
                        {business.offerBannerUrl && (
                          <div className="rounded-[20px] overflow-hidden mb-6 h-52 sm:h-72">
                            <img
                              src={business.offerBannerUrl}
                              alt={business.offerTitle || "Offer Banner"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Offer card */}
                        <div className="relative p-6 md:p-8 bg-gradient-to-br from-orange-50 to-amber-50 rounded-[20px] border border-orange-100 overflow-hidden">
                          {/* Decorative blob */}
                          <div className="absolute -top-8 -right-8 w-40 h-40 bg-orange-100 rounded-full opacity-60" />
                          <div className="relative z-10">
                            {business.offerBadge && (
                              <span className="inline-flex items-center gap-1.5 px-3 md:px-4 py-1 md:py-1.5 bg-orange-500 text-white rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-widest mb-4 md:mb-5 shadow-md shadow-orange-500/30">
                                <Zap className="w-2.5 h-2.5 md:w-3 md:h-3" />{" "}
                                {business.offerBadge}
                              </span>
                            )}
                            <h4 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 md:mb-3 leading-tight">
                              {business.offerTitle || "Special Offer"}
                            </h4>
                            {business.offerDescription && (
                              <p className="text-slate-600 text-base leading-relaxed mb-6 max-w-2xl">
                                {business.offerDescription}
                              </p>
                            )}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
                              {!isOwner && (
                                <button
                                  onClick={openEnquiryModal}
                                  className="inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25 active:scale-95"
                                >
                                  <Zap className="w-4 h-4" /> Enquire Now
                                </button>
                              )}
                              {business.phone && (
                                <button
                                  onClick={() => handleContactIntent("call")}
                                  className="inline-flex items-center justify-center gap-2 px-5 md:px-6 py-3 md:py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm hover:border-orange-400 hover:text-orange-600 transition-all"
                                >
                                  <Phone className="w-4 h-4" /> Call to Claim
                                </button>
                              )}
                              {(business.whatsapp || business.phone) && (
                                <button
                                  onClick={() => handleContactIntent("whatsapp")}
                                  className="inline-flex items-center justify-center gap-2 px-5 md:px-6 py-3 md:py-3.5 bg-[#25D366] text-white rounded-xl md:rounded-2xl font-bold text-xs md:text-sm hover:bg-[#128C7E] transition-all shadow-lg shadow-green-500/20"
                                >
                                  <WhatsAppIcon className="w-4 h-4 md:w-5 md:h-5" /> WhatsApp
                                </button>
                              )}
                            </div>
                            {business.offerExpiresAt && (
                              <div className="flex items-center gap-2 mt-6 text-sm text-slate-500 font-medium">
                                <Calendar className="w-4 h-4 text-orange-400" />
                                <span>
                                  Offer valid until{" "}
                                  <strong className="text-orange-600">
                                    {new Date(
                                      business.offerExpiresAt,
                                    ).toLocaleDateString("en-US", {
                                      weekday: "long",
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    })}
                                  </strong>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={activeTab === "FAQs" ? "block" : "hidden"}>
                      <div className="animate-in fade-in duration-500">
                        <h3 className="text-2xl font-bold text-slate-900 mb-8">
                          Frequently Asked Questions
                        </h3>

                        {validFaqs.length > 0 ? (
                          <div className="space-y-4">
                            {validFaqs.map((faq, idx) => {
                              const isOpen = openFaqIndex === idx;

                              return (
                                <div
                                  key={idx}
                                  className={`rounded-3xl border border-black transition-all duration-500 overflow-hidden ${isOpen
                                      ? "bg-white shadow-2xl"
                                      : "bg-slate-50/50 hover:bg-white"
                                    }`}
                                >
                                  {/* Question */}
                                  <button
                                    onClick={() =>
                                      setOpenFaqIndex(isOpen ? null : idx)
                                    }
                                    className="w-full flex items-center justify-between p-6 md:p-8 text-left group"
                                  >
                                    <h4
                                      className={`font-black text-lg md:text-xl transition-colors leading-tight pr-8 ${isOpen
                                          ? "text-primary"
                                          : "text-slate-900 group-hover:text-primary/70"
                                        }`}
                                    >
                                      {faq.question}
                                    </h4>

                                    {/* Icon */}
                                    <div
                                      className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${isOpen
                                          ? "bg-primary text-white rotate-180 shadow-lg"
                                          : "bg-white text-slate-400 group-hover:text-primary"
                                        }`}
                                    >
                                      <ChevronDown className="w-5 h-5" />
                                    </div>
                                  </button>

                                  {/* Answer */}
                                  <AnimatePresence initial={false}>
                                    {isOpen && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{
                                          duration: 0.4,
                                          ease: [0.04, 0.62, 0.23, 0.98],
                                        }}
                                      >
                                        <div className="px-6 pb-6">
                                          <div className="p-6 bg-slate-50 rounded-[10px]">
                                            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium text-base md:text-lg">
                                              {faq.answer}
                                            </p>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-slate-500">
                            No FAQs available for this business.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* end min-h-[400px] */}
                </>
              );
            })()}
          </div>
          {/* end lg:col-span-2 */}

          {/* Sidebar Area */}
          <aside className="relative">
            <div className="lg:sticky lg:top-28 space-y-8">
              {/* Actions/Contact Card */}
              <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-premium relative overflow-hidden group">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <h4 className="text-2xl font-black mb-8 relative z-10 flex items-center gap-3 text-white">
                  Contact with Business
                </h4>

                <div className="space-y-4 mb-6 relative z-10">
                  {business.phone && (
                    <button
                      onClick={() => handleContactIntent("call")}
                      className="w-full py-5 bg-slate-800 text-white rounded-[20px] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-slate-700 transition-all duration-300 shadow-xl shadow-slate-900/20 active:scale-95"
                    >
                      <Phone className="w-5 h-5" /> Call Business
                    </button>
                  )}
                  {(business.whatsapp || business.phone) && (
                    <button
                      onClick={() => handleContactIntent("whatsapp")}
                      className="w-full py-5 bg-[#25D366] text-white rounded-[20px] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-[#128C7E] transition-all duration-300 shadow-xl shadow-green-500/20 active:scale-95"
                    >
                      <WhatsAppIcon className="w-6 h-6" /> WhatsApp
                    </button>
                  )}
                </div>

                {additionalPhoneNumbers.length > 0 && (
                  <div className="mb-6 relative z-10 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                      Additional contact numbers
                    </p>
                    {additionalPhoneNumbers.map((item, index) => (
                      <a
                        key={`${item.label}-${item.number}-${index}`}
                        href={`tel:${item.number}`}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition-colors"
                      >
                        <span className="text-sm font-bold text-white">
                          {item.label}
                        </span>
                        <span className="text-sm text-slate-300">
                          {item.number}
                        </span>
                      </a>
                    ))}
                  </div>
                )}

                {!isOwner && (
                  <div className="space-y-4 relative z-10">
                    <ChatTrigger
                      ref={chatRef}
                      businessId={business.id}
                      businessName={business.title}
                      className="w-full py-5 bg-emerald-600 text-white rounded-[20px] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all duration-300 shadow-xl shadow-emerald-500/20 active:scale-95 mb-4"
                    />

                    <button
                      id="send-enquiry-btn"
                      onClick={() => openEnquiryModal()}
                      className="w-full py-5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-[20px] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:from-violet-700 hover:to-indigo-700 transition-all duration-300 shadow-xl shadow-violet-500/30 active:scale-95"
                    >
                      <Send className="w-5 h-5" /> Send Enquiry
                    </button>
                  </div>
                )}

                {isOwner && (
                  <div className="w-full mt-6 py-4 bg-primary/10 border border-primary/20 text-primary rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Your Business
                  </div>
                )}

                <div className="pt-8 border-t border-white/10 space-y-4">
                  <div className="space-y-3">
                    {(() => {
                      if (
                        !business.businessHours ||
                        business.businessHours.length === 0
                      )
                        return null;
                      const today = new Date()
                        .toLocaleDateString("en-US", { weekday: "long" })
                        .toLowerCase();
                      const hour = business.businessHours.find(
                        (h) => h.dayOfWeek.toLowerCase() === today,
                      );

                      return (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3 text-slate-400">
                            <Clock className="w-4 h-4" />
                            Open Today
                          </div>
                          <span
                            className={`font-bold ${hour?.isOpen ? "text-white" : "text-rose-400"}`}
                          >
                            {hour
                              ? hour.isOpen
                                ? `${hour.openTime} - ${hour.closeTime}`
                                : "Closed"
                              : "N/A"}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {business.website && (
                    <div className="flex items-center justify-between text-sm pt-4 border-t border-white/5">
                      <div className="flex items-center gap-3 text-slate-400">
                        <Globe className="w-4 h-4" /> Website
                      </div>
                      <a
                        href={
                          business.website.startsWith("http")
                            ? business.website
                            : `https://${business.website}`
                        }
                        target="_blank"
                        className="font-bold border-b border-blue-400 text-blue-400"
                      >
                        Visit Site
                      </a>
                    </div>
                  )}
                  {/* Dynamic Social Links */}
                  {(() => {
                    const validLinks = (
                      business.vendor?.socialLinks || []
                    ).filter(
                      (link) =>
                        link &&
                        typeof link === "object" &&
                        !Array.isArray(link) &&
                        link.url,
                    );

                    if (validLinks.length === 0) return null;

                    return (
                      <div className="pt-4 border-t border-white/5">
                        <div className="flex items-center gap-3 text-slate-400 text-sm mb-3">
                          Social Media
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {validLinks.map((link, idx) => {
                            let platform = (link.platform || "").toLowerCase();

                            // Infer platform from URL if missing
                            if (!platform) {
                              const url = link.url.toLowerCase();
                              if (url.includes("facebook"))
                                platform = "facebook";
                              else if (
                                url.includes("twitter") ||
                                url.includes("x.com")
                              )
                                platform = "twitter";
                              else if (url.includes("instagram"))
                                platform = "instagram";
                              else if (url.includes("linkedin"))
                                platform = "linkedin";
                              else if (url.includes("youtube"))
                                platform = "youtube";
                              else if (
                                url.includes("wa.me") ||
                                url.includes("whatsapp")
                              )
                                platform = "whatsapp";
                              else platform = "website";
                            }

                            let Icon = LinkIcon;
                            let colorClass =
                              "bg-slate-800 hover:bg-slate-700 text-white";

                            if (platform.includes("facebook")) {
                              Icon = Facebook;
                              colorClass =
                                "bg-[#1877F2]/20 text-[#1877F2] hover:bg-[#1877F2]/30";
                            } else if (
                              platform.includes("twitter") ||
                              platform.includes("x")
                            ) {
                              Icon = Twitter;
                              colorClass =
                                "bg-slate-800 text-white hover:bg-slate-700";
                            } else if (platform.includes("instagram")) {
                              Icon = Instagram;
                              colorClass =
                                "bg-[#E4405F]/20 text-[#E4405F] hover:bg-[#E4405F]/30";
                            } else if (platform.includes("linkedin")) {
                              Icon = Linkedin;
                              colorClass =
                                "bg-[#0A66C2]/20 text-[#0A66C2] hover:bg-[#0A66C2]/30";
                            } else if (platform.includes("youtube")) {
                              Icon = Youtube;
                              colorClass =
                                "bg-[#FF0000]/20 text-[#FF0000] hover:bg-[#FF0000]/30";
                            } else if (platform.includes("whatsapp")) {
                              Icon = MessageSquare;
                              colorClass =
                                "bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30";
                            }

                            return (
                              <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`p-2.5 rounded-xl transition-all ${colorClass}`}
                                title={
                                  link.platform ||
                                  platform.charAt(0).toUpperCase() +
                                  platform.slice(1)
                                }
                              >
                                <Icon className="w-4 h-4" />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Business Profile / Vendor Profile Card */}
              <div className="bg-light rounded-[30px] p-10 border border-slate-100 transition-all   duration-500">
                <h4 className="text-xl font-black text-slate-900 mb-10 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  Business Profile
                </h4>

                <div className="flex flex-col items-center text-center">
                  <Link
                    href={businessProfileHref}
                    className={`flex flex-col items-center text-center group/vendor ${businessProfileHref === "#" ? "pointer-events-none" : "cursor-pointer"}`}
                  >
                    <div className="w-32 h-32 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-400 font-bold overflow-hidden shadow-inner mb-6 relative group border-4 border-white ring-1 ring-slate-100">
                      {(business.logoUrl || business.vendor?.user?.avatarUrl) ? (
                        <img
                          src={
                            getImageUrl(
                              business.logoUrl || business.vendor?.user?.avatarUrl,
                            ) as string
                          }
                          alt={business.title || business.vendor?.user?.fullName || "Business"}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                          }}
                        />
                      ) : (
                        <span className="text-4xl font-black text-slate-200">
                          {(
                            business.title?.[0] || business.vendor?.user?.fullName?.[0] || "B"
                          ).toUpperCase()}
                        </span>
                      )}
                      {business.vendor?.user?.isOnline && (
                        <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-lg shadow-emerald-500/20" />
                      )}
                    </div>

                    <h5 className="text-2xl font-black text-slate-900 leading-tight mb-2 group-hover/vendor:text-primary transition-colors">
                      {business.vendor?.user?.fullName ||
                        "Business Owner"}
                    </h5>
                   
                  </Link>



                  {/* Status & Followers Section */}
                  <div className="w-full grid grid-cols-2 gap-3 mb-6 mt-3">
                    <div className="">
                      <div className="text-[9px] font-black mb-2 text-slate-400 uppercase tracking-widest">
                        Availability
                      </div>
                      <VendorOnlineBadge
                        isOnline={business.vendor?.user?.isOnline}
                      />
                    </div>
                    <div className="">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Status
                      </div>
                      <BusinessOpenBadge business={business} />
                    </div>
                  </div>

                  <div className="w-full mb-6">
                    <FollowButton
                      businessId={business.id}
                      initialFollowersCount={business.followersCount}
                      className="w-full"
                    />
                  </div>

                  <div className="w-full pt-6 border-t border-slate-100 space-y-4 text-left">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">
                        Member since
                      </span>
                      <span className="font-black text-slate-900">
                        {business.vendor?.user?.createdAt
                          ? new Date(
                            business.vendor.user.createdAt,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })
                          : "Oct 2024"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">
                        Working Hours
                      </span>
                      <span className="font-black text-slate-900">
                        {(() => {
                          // Check if vendor logged in today
                          const lastLogin = business.vendor?.user?.lastLoginAt;
                          if (lastLogin) {
                            const loginDate = new Date(lastLogin);
                            const today = new Date();
                            if (
                              loginDate.toDateString() === today.toDateString()
                            ) {
                              return `Today at ${loginDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
                            }
                          }

                          // Fallback to business hours
                          const hoursData =
                            business.businessHours &&
                              business.businessHours.length > 0
                              ? business.businessHours
                              : business.vendor?.businessHours;
                          const { todayHours } =
                            getBusinessOpenStatus(hoursData);
                          return todayHours || "Closed";
                        })()}
                      </span>
                    </div>



                    {(business.vendorId || business.vendor?.id) && (
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = businessProfileHref;
                        }}
                        className="group/btn relative w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 overflow-hidden hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-slate-900/10 active:scale-[0.98] mt-6 cursor-pointer z-20"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                        <User className="relative z-10 w-4.5 h-4.5 group-hover/btn:scale-110 transition-transform" />
                        <span className="relative z-10 text-center uppercase tracking-wide">View Profile</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Special Offers & Events ─────────────────────────────────────────── */}
      {offers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-premium ring-4 ring-primary/10">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Special Offers & Events
              </h2>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">
                Exclusive updates from {business.title}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {offers.map((offer: any, idx: number) => (
              <div
                key={offer.id || `offer-${idx}`}
                className="group relative bg-white rounded-[32px] border border-slate-100 shadow-premium hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col"
              >
                {/* Offer Banner Image */}
                {offer.imageUrl && (
                  <div className="h-48 overflow-hidden bg-slate-100 relative">
                    <img
                      src={offer.imageUrl}
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                    {offer.offerBadge && (
                      <div className="absolute top-4 left-4 px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/30 border border-white/20">
                        {offer.offerBadge}
                      </div>
                    )}
                  </div>
                )}


                <div className="p-8 flex flex-col flex-1 gap-4">
                  {/* Type chip */}
                  <div
                    className={`self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${offer.type === "event"
                      ? "bg-blue-500/10 text-blue-600 border border-blue-500/10"
                      : "bg-primary/10 text-primary border border-primary/10"
                      }`}
                  >
                    {offer.type === "event" ? (
                      <Calendar className="w-3.5 h-3.5" />
                    ) : (
                      <Tag className="w-3.5 h-3.5" />
                    )}
                    {offer.type}
                  </div>

                  <h3 className="font-black text-slate-900 text-xl leading-tight group-hover:text-primary transition-colors">
                    {offer.title}
                  </h3>

                  {offer.description && (
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 font-medium">
                      {offer.description}
                    </p>
                  )}

                  <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                    {offer.expiryDate ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                        <Clock className="w-4 h-4 text-slate-300" />
                        Expires{" "}
                        {new Date(offer.expiryDate).toLocaleDateString(
                          "en-US",
                          { day: "2-digit", month: "short" },
                        )}
                      </div>
                    ) : (
                      <span />
                    )}

                    <button
                      onClick={openEnquiryModal}
                      className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all duration-300 shadow-xl shadow-slate-900/10 active:scale-95"
                    >
                      Enquire Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mobile Sticky Action Bar */}
      {!isOwner && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom duration-500">
          <div className="flex items-center gap-3">
            {business.phone && (
              <button
                onClick={() => handleContactIntent("call")}
                className="flex-1 h-12 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
              >
                <Phone className="w-4 h-4" /> Call
              </button>
            )}
            {(business.whatsapp || business.phone) && (
              <button
                onClick={() => handleContactIntent("whatsapp")}
                className="flex-1 h-12 bg-[#25D366] text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
              >
                <WhatsAppIcon className="w-5 h-5" /> WhatsApp
              </button>
            )}
            <button
              onClick={() => openEnquiryModal()}
              className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-blue-500/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <Footer />

      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[20px] md:rounded-[16px] p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 md:top-8 md:right-8 text-slate-400 hover:text-slate-900 transition-colors p-2"
            >
              <span className="sr-only">Close</span>
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6 md:mb-8">
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                Write a Review
              </h3>
              <p className="text-sm text-slate-500">
                Share your experience with {business.title}
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 md:space-y-6">
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
              </div>

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

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-3.5 md:py-4 bg-slate-900 text-white rounded-xl md:rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>
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
            className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
            onClick={() => setShowLightbox(false)}
          >
            <button
              className="absolute top-6 right-6 z-[110] w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/10"
              onClick={() => setShowLightbox(false)}
            >
              <X className="w-6 h-6" />
            </button>

            <div
              className="relative w-full max-w-5xl aspect-video md:aspect-[16/9] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute left-0 -translate-x-full md:-translate-x-20 z-[110] w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/10"
                onClick={prevImage}
              >
                <ChevronLeft className="w-8 h-8" />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 0.95, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: -20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="w-full h-full rounded-[20px] overflow-hidden border border-white/10 shadow-2xl"
                >
                  <img
                    src={galleryImages[currentImageIndex]}
                    className="w-full h-full object-contain bg-black/50"
                    alt="Gallery selection"
                  />
                </motion.div>
              </AnimatePresence>

              <button
                className="absolute right-0 translate-x-full md:translate-x-20 z-[110] w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/10"
                onClick={nextImage}
              >
                <ChevronRight className="w-8 h-8" />
              </button>

              {/* Thumbnails Indicator */}
              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex gap-3">
                {galleryImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === currentImageIndex ? "bg-blue-500 w-8" : "bg-white/20 hover:bg-white/40"}`}
                  />
                ))}
              </div>
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
    </div>
  );
}
