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
import ChatTrigger, {
  ChatTriggerHandle,
} from "../../../components/chat/ChatTrigger";
import { useChat } from "../../../hooks/useChat";
import { chatApi } from "../../../services/chat.service";
import DynamicIcon from "../../../components/DynamicIcon";
import PopularTimesChart from "@/components/business/PopularTimesChart";
import ReviewDistribution from "@/components/business/ReviewDistribution";

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

  // Review sort & report state
  const [reviewSort, setReviewSort] = useState<string>("relevant");
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

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    return categories.filter((cat: any) =>
      cat.name?.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  useEffect(() => {
    api.categories.getAll().then((data: any) => setCategories(data || [])).catch(() => {});
  }, []);


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

  const trackContactClick = (type: string) => {
    if (!business) return;
    api.leads.createLead({
      businessId: business.id,
      name: user?.fullName || "Guest",
      email: user?.email || "",
      phone: user?.phone || undefined,
      message: `User clicked ${type}`,
      type: type as any,
      source: `listing-${type}`,
    }).catch(() => {});
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
        images: reviewImages.length > 0 ? reviewImages : undefined,
      });
      // Refresh reviews
      const reviewsData = await api.reviews.getByBusiness(business.id);
      setComments(reviewsData.data || []);
      setShowReviewModal(false);
      setReviewComment("");
      setReviewRating(5);
      setReviewImages([]);
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
    [
      business.coverImageUrl, 
      ...(Array.isArray(business.images) ? business.images : []),
      ...(Array.isArray(business.vendor?.shopPhotos) ? business.vendor.shopPhotos : [])
    ].filter(Boolean)
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
        <div className="grid grid-cols-1 lg:grid-cols-[256px_1fr] xl:grid-cols-[256px_1fr_320px] gap-6">

          {/* LEFT COLUMN - Categories Sidebar (hidden on mobile) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900">Categories</h3>
                <Link href="/categories" className="text-sm text-blue-600 hover:underline">View all</Link>
              </div>
              <input
                type="text"
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm mb-3"
              />
              <div className="space-y-1">
                {filteredCategories.slice(0, 12).map((cat: any) => (
                  <Link
                    key={cat.id}
                    href={`/search?category=${cat.slug}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg">
                      {cat.icon || '📂'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-900 truncate">{cat.name}</div>
                      <div className="text-xs text-slate-400">{cat.businessCount || 0} businesses</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* CENTER COLUMN - Main Content */}
          <div className="min-w-0">
            {/* Hero Section */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4 mb-6">
              {/* Large hero image */}
              <div
                className="relative rounded-2xl overflow-hidden bg-slate-100 cursor-pointer group"
                style={{ aspectRatio: '16/10' }}
                onClick={() => galleryImages.length > 0 && openLightbox(0)}
              >
                {galleryImages.length > 0 ? (
                  <>
                    <img
                      src={galleryImages[0]}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      alt={business.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-lg text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      View photo
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                    <Images className="w-12 h-12 mb-2" />
                    <span className="text-xs font-medium">No photos</span>
                  </div>
                )}
              </div>

              {/* Right side: Map + thumbnails */}
              <div className="grid grid-rows-[1fr_auto] gap-4">
                {/* Map embed */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 min-h-[140px]">
                  {mapEmbedUrl && showMapEmbed ? (
                    <iframe
                      title="Business location map"
                      src={mapEmbedUrl}
                      className="w-full h-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-slate-200/50 transition-colors"
                      onClick={() => mapEmbedUrl && setShowMapEmbed(true)}
                    >
                      <MapPin className="w-6 h-6 text-slate-300 mb-1" />
                      <p className="text-xs font-medium text-slate-400">
                        {mapEmbedUrl ? 'Load map' : 'Map unavailable'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Thumbnail photos */}
                <div className="grid grid-cols-2 gap-4">
                  {galleryImages.length > 1 ? (
                    <div
                      className="relative rounded-xl overflow-hidden bg-slate-100 aspect-square cursor-pointer group"
                      onClick={() => openLightbox(1)}
                    >
                      <img
                        src={galleryImages[1]}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt="Gallery 2"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 aspect-square" />
                  )}
                  {galleryImages.length > 2 ? (
                    <div
                      className="relative rounded-xl overflow-hidden bg-slate-100 aspect-square cursor-pointer group"
                      onClick={() => openLightbox(2)}
                    >
                      <img
                        src={galleryImages[2]}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt="Gallery 3"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 aspect-square" />
                  )}
                </div>

                {galleryImages.length > 3 && (
                  <button
                    onClick={() => openLightbox(3)}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    See all {galleryImages.length} photos
                  </button>
                )}
                {galleryImages.length === 3 && (
                  <button
                    onClick={() => openLightbox(0)}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    See all {galleryImages.length} photos
                  </button>
                )}
              </div>
            </div>

            {/* Business Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {business.isVerified && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-bold">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </div>
                  )}
                  <VendorOnlineBadge isOnline={business.vendor?.isOnline} />
                  <BusinessOpenBadge business={business} />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                  {business.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-slate-900">{business.averageRating || 'New'}</span>
                    <span className="text-slate-400">({business.totalReviews || 0} reviews)</span>
                  </div>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500">{business.category?.name || 'Business'}</span>
                  {business.address && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500">{business.address}, {business.city}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleLike}
                  className={`p-3 rounded-full transition-all border ${isFavorite
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-blue-500' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 bg-white border border-slate-200 rounded-full text-slate-400 hover:border-slate-300 transition-all relative"
                >
                  <Share2 className="w-5 h-5" />
                  {copySuccess && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap shadow-lg animate-in fade-in">
                      Copied!
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                >
                  <Globe className="w-4 h-4" /> Website
                </a>
              )}
              <button
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
              >
                <Navigation className="w-4 h-4" /> Directions
              </button>
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                >
                  <Phone className="w-4 h-4" /> Call
                </a>
              )}
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 border rounded-full transition-colors text-sm font-medium ${isFavorite ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
              >
                <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-blue-500' : ''}`} /> Save
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex gap-0 border-b border-slate-200 mt-6 overflow-x-auto">
              {['Overview', 'Services', 'Reviews', 'Photos', 'About'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.toLowerCase()
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px] mt-6">
              {/* Overview Tab */}
              <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Business Info Card */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Business Information</h3>
                    <div className="space-y-4">
                      {business.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-slate-900">{business.address}</div>
                            {business.city && <div className="text-xs text-slate-500">{business.city}</div>}
                          </div>
                        </div>
                      )}
                      {business.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <a href={`tel:${business.phone}`} className="text-sm font-medium text-blue-600 hover:underline">{business.phone}</a>
                        </div>
                      )}
                      {business.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          <a href={`mailto:${business.email}`} className="text-sm font-medium text-blue-600 hover:underline">{business.email}</a>
                        </div>
                      )}
                      {business.website && (
                        <div className="flex items-center gap-3">
                          <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                          <a
                            href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                            target="_blank"
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            {business.website}
                          </a>
                        </div>
                      )}
                      {business.category && (
                        <div className="flex items-center gap-3">
                          <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-sm font-medium text-slate-900">{business.category.name}</span>
                        </div>
                      )}
                      {business.priceRange && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-900 ml-7">{business.priceRange}</span>
                        </div>
                      )}

                      {/* Business Hours */}
                      {business.businessHours && business.businessHours.length > 0 && (
                        <div className="pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-bold text-slate-900">Hours</span>
                          </div>
                          <div className="space-y-2 ml-6">
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                              const hour = business.businessHours?.find(
                                (h: any) => h.dayOfWeek.toLowerCase() === day
                              );
                              const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                              const isToday = day === today;
                              return (
                                <div key={day} className={`flex items-center justify-between text-xs ${isToday ? 'font-bold text-blue-600' : 'text-slate-600'}`}>
                                  <span className="capitalize">{day}</span>
                                  <span>{hour ? (hour.isOpen ? `${hour.openTime} - ${hour.closeTime}` : 'Closed') : 'N/A'}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Popular Times Chart */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Popular Times</h3>
                    <PopularTimesChart businessHours={business.businessHours} />
                  </div>
                </div>

                {/* Description */}
                {business.description && (
                  <div className="mt-6 bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="font-bold text-slate-900 mb-3">About</h3>
                    <p className={`text-sm text-slate-600 leading-relaxed ${!aboutExpanded ? 'line-clamp-4' : ''}`}>
                      {business.description}
                    </p>
                    {business.description.length > 200 && (
                      <button
                        onClick={() => setAboutExpanded(!aboutExpanded)}
                        className="text-sm font-medium text-blue-600 hover:underline mt-2"
                      >
                        {aboutExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                )}

                {/* Amenities / Highlights */}
                {business.businessAmenities && business.businessAmenities.length > 0 && (
                  <div className="mt-6 bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="font-bold text-slate-900 mb-3">Highlights</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {business.businessAmenities.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          <span>{item.amenity?.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Map */}
                {mapEmbedUrl && (
                  <div className="mt-6 bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-blue-600" /> Location
                    </h3>
                    <div className="relative h-[300px] rounded-xl overflow-hidden bg-slate-100">
                      {showMapEmbed ? (
                        <iframe
                          title="Business location map"
                          src={mapEmbedUrl}
                          className="w-full h-full border-0"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200/50 transition-colors"
                          onClick={() => setShowMapEmbed(true)}
                        >
                          <MapPin className="w-8 h-8 text-slate-300 mb-2" />
                          <p className="text-sm font-medium text-slate-400">Click to load map</p>
                        </div>
                      )}
                    </div>
                    {openInGoogleMapsUrl && (
                      <button
                        onClick={() => window.open(openInGoogleMapsUrl, '_blank')}
                        className="mt-3 text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5" /> Get directions
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Services Tab */}
              <div className={activeTab === 'services' ? 'block' : 'hidden'}>
                <div className="animate-in fade-in duration-500">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Services</h3>
                  {business.category && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                          <Store className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{business.category.name}</h4>
                          <p className="text-sm text-slate-500">Primary category</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {business.subcategories && business.subcategories.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {business.subcategories.map((sub: any, idx: number) => (
                        <div key={idx} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                          <span className="text-sm font-medium text-slate-900">{sub.name || sub}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {!business.subcategories?.length && (
                    <p className="text-sm text-slate-500 mt-4">No additional services listed.</p>
                  )}
                </div>
              </div>

              {/* Reviews Tab */}
              <div className={activeTab === 'reviews' ? 'block' : 'hidden'}>
                <div className="space-y-6 animate-in fade-in duration-500">
                  {/* Review Distribution */}
                  <ReviewDistribution reviews={comments} />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-slate-900">
                      Customer Reviews
                    </h3>
                    <div className="flex items-center gap-3">
                      {comments.length > 1 && (
                        <div className="relative">
                          <ArrowUpDown className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <select
                            value={reviewSort}
                            onChange={(e) => {
                              setReviewSort(e.target.value);
                              loadReviews(e.target.value);
                            }}
                            className="appearance-none pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 outline-none cursor-pointer"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
                          >
                            <option value="relevant">Most Relevant</option>
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="highest">Highest Rated</option>
                            <option value="lowest">Lowest Rated</option>
                            <option value="most_helpful">Most Helpful</option>
                            <option value="photos_first">Photos First</option>
                          </select>
                        </div>
                      )}
                      {isOwner ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                          <ShieldCheck className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-bold text-blue-600">Your Business</span>
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
                  </div>

                  {comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((comment: any, idx: number) => (
                        <div
                          key={comment.id || `comment-${idx}`}
                          className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold overflow-hidden">
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
                                  <h4 className="font-bold text-slate-900 text-sm">{comment.user?.fullName || 'Anonymous'}</h4>
                                  <TrustBadge badge={comment.user?.badge} score={comment.user?.trust_score} />
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${i < (comment.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                                    />
                                  ))}
                                  <span className="text-[10px] text-slate-400 ml-1">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {comment.comment && (
                            <p className="text-sm text-slate-600 leading-relaxed">{comment.comment}</p>
                          )}

                          {/* Review Photos */}
                          {comment.images && comment.images.length > 0 && (
                            <div className="mt-3 flex gap-2 flex-wrap">
                              {comment.images.map((img: string, imgIdx: number) => (
                                <a key={imgIdx} href={img} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={img}
                                    alt={`Review photo ${imgIdx + 1}`}
                                    className="w-16 h-16 rounded-lg object-cover border border-slate-100 hover:border-blue-300 transition-colors cursor-pointer"
                                  />
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Helpful & Report */}
                          {user && !isOwner && user.id !== comment.userId && (
                            <div className="mt-3 flex items-center gap-4">
                              <button
                                onClick={() => handleHelpful(comment.id)}
                                disabled={helpfulLoading === comment.id}
                                className={`inline-flex items-center gap-1.5 text-[10px] font-bold transition-colors uppercase tracking-wider ${
                                  comment.userHelpful ? 'text-blue-500' : 'text-slate-400 hover:text-blue-500'
                                }`}
                              >
                                {helpfulLoading === comment.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <ThumbsUp className={`w-3 h-3 ${comment.userHelpful ? 'fill-blue-500' : ''}`} />
                                )}
                                Helpful {comment.helpfulCount > 0 ? `(${comment.helpfulCount})` : ''}
                              </button>
                              <button
                                onClick={() => setShowReportModal(comment.id)}
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider"
                              >
                                <Flag className="w-3 h-3" /> Report
                              </button>
                            </div>
                          )}

                          {/* Business Response */}
                          {comment.vendorResponse && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                              <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Business Response</span>
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed">{comment.vendorResponse}</p>
                            </div>
                          )}

                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-4 ml-4 space-y-3 border-l-2 border-slate-100 pl-4">
                              {comment.replies.map((reply: any) => (
                                <div key={reply.id}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-slate-900">{reply.user?.fullName || 'Anonymous'}</span>
                                    <span className="text-[10px] text-slate-400">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-sm text-slate-600">{reply.content}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Owner Reply */}
                          {isOwner && (
                            <div className="mt-4 pt-3 border-t border-slate-50">
                              {replyingTo === comment.id ? (
                                <div>
                                  <textarea
                                    autoFocus
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Write your reply..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 outline-none resize-none"
                                    rows={3}
                                  />
                                  <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => setReplyingTo(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                                    <button
                                      onClick={() => handleReplySubmit(comment.id)}
                                      disabled={submittingReply || !replyContent.trim()}
                                      className="px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 disabled:opacity-50"
                                    >
                                      {submittingReply ? 'Posting...' : 'Post Reply'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setReplyingTo(comment.id)}
                                  className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-violet-600 transition-colors"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" /> Reply
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200">
                      <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <h4 className="font-bold text-slate-900 mb-1">No reviews yet</h4>
                      <p className="text-sm text-slate-500">Be the first to review {business.title}.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Photos Tab */}
              <div className={activeTab === 'photos' ? 'block' : 'hidden'}>
                <div className="animate-in fade-in duration-500">
                  <div className="flex flex-wrap gap-2 mb-6">
                    {['all', 'business', 'customer', 'exterior', 'interior'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedPhotoCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          selectedPhotoCategory === cat
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>
                  {galleryImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {galleryImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="aspect-square rounded-xl overflow-hidden cursor-pointer group"
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
                  ) : (
                    <div className="p-12 text-center text-slate-400">
                      <Images className="w-10 h-10 mx-auto mb-3" />
                      <p className="text-sm font-medium">No photos available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* About Tab */}
              <div className={activeTab === 'about' ? 'block' : 'hidden'}>
                <div className="animate-in fade-in duration-500 space-y-6">
                  {/* Description */}
                  {business.description && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-6">
                      <h3 className="font-bold text-slate-900 mb-3">About {business.title}</h3>
                      <p className={`text-sm text-slate-600 leading-relaxed whitespace-pre-wrap ${!aboutExpanded ? 'line-clamp-6' : ''}`}>
                        {business.description}
                      </p>
                      {business.description.length > 300 && (
                        <button
                          onClick={() => setAboutExpanded(!aboutExpanded)}
                          className="text-sm font-medium text-blue-600 hover:underline mt-3"
                        >
                          {aboutExpanded ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Highlights / Amenities */}
                  {business.businessAmenities && business.businessAmenities.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-6">
                      <h3 className="font-bold text-slate-900 mb-4">Highlights</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {business.businessAmenities.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                            <span className="text-sm font-medium text-slate-700">{item.amenity?.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Business Info</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {business.category && (
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</div>
                          <div className="text-sm font-medium text-slate-900">{business.category.name}</div>
                        </div>
                      )}
                      {business.priceRange && (
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Price Range</div>
                          <div className="text-sm font-medium text-slate-900">{business.priceRange}</div>
                        </div>
                      )}
                      {business.vendor?.user?.createdAt && (
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Member Since</div>
                          <div className="text-sm font-medium text-slate-900">
                            {new Date(business.vendor.user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* end center column */}

          {/* RIGHT COLUMN - Sidebar */}
          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-6">
              {/* Contact Card */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h4 className="font-bold text-slate-900 mb-4">Contact</h4>
                <div className="space-y-3">
                  {business.phone && (
                    <button
                      onClick={() => handleContactIntent('call')}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
                    >
                      <Phone className="w-4 h-4" /> Call Business
                    </button>
                  )}
                  {(business.whatsapp || business.phone) && (
                    <button
                      onClick={() => handleContactIntent('whatsapp')}
                      className="w-full py-3 bg-[#25D366] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#128C7E] transition-all active:scale-95"
                    >
                      <WhatsAppIcon className="w-4 h-4" /> WhatsApp
                    </button>
                  )}
                  {business.email && (
                    <a
                      href={`mailto:${business.email}`}
                      className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-all active:scale-95"
                    >
                      <Mail className="w-4 h-4" /> Email
                    </a>
                  )}
                </div>

                {/* Hours summary */}
                {business.businessHours && business.businessHours.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span>Today</span>
                      </div>
                      {(() => {
                        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                        const hour = business.businessHours.find((h: any) => h.dayOfWeek.toLowerCase() === today);
                        return (
                          <span className={`font-bold text-sm ${hour?.isOpen ? 'text-green-600' : 'text-slate-400'}`}>
                            {hour ? (hour.isOpen ? `${hour.openTime} - ${hour.closeTime}` : 'Closed') : 'N/A'}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {(() => {
                  const validLinks = (Array.isArray(business.vendor?.socialLinks) ? business.vendor.socialLinks : []).filter(
                    (link: any) => link && typeof link === 'object' && !Array.isArray(link) && link.url
                  );
                  if (validLinks.length === 0) return null;
                  return (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Social Media</div>
                      <div className="flex flex-wrap gap-2">
                        {validLinks.map((link: any, idx: number) => {
                          let platform = (link.platform || '').toLowerCase();
                          if (!platform) {
                            const url = link.url.toLowerCase();
                            if (url.includes('facebook')) platform = 'facebook';
                            else if (url.includes('twitter') || url.includes('x.com')) platform = 'twitter';
                            else if (url.includes('instagram')) platform = 'instagram';
                            else if (url.includes('linkedin')) platform = 'linkedin';
                            else if (url.includes('youtube')) platform = 'youtube';
                            else platform = 'website';
                          }
                          let Icon = LinkIcon;
                          if (platform.includes('facebook')) Icon = Facebook;
                          else if (platform.includes('twitter') || platform.includes('x')) Icon = Twitter;
                          else if (platform.includes('instagram')) Icon = Instagram;
                          else if (platform.includes('linkedin')) Icon = Linkedin;
                          else if (platform.includes('youtube')) Icon = Youtube;
                          return (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-slate-50 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
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

              {/* Vendor Profile Card */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" /> Business Profile
                </h4>
                <div className="flex flex-col items-center text-center">
                  <Link href={businessProfileHref} className={`group ${businessProfileHref === '#' ? 'pointer-events-none' : ''}`}>
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center overflow-hidden border-2 border-white ring-1 ring-slate-100 mb-3">
                      {(business.logoUrl || business.vendor?.user?.avatarUrl) ? (
                        <img
                          src={getImageUrl(business.logoUrl || business.vendor?.user?.avatarUrl) as string}
                          alt={business.title || 'Business'}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-avatar.png'; }}
                        />
                      ) : (
                        <span className="text-2xl font-bold text-slate-200">
                          {(business.title?.[0] || 'B').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <h5 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {business.vendor?.user?.fullName || 'Business Owner'}
                    </h5>
                  </Link>

                  <div className="w-full mt-3">
                    <FollowButton
                      businessId={business.id}
                      initialFollowersCount={business.followersCount}
                      className="w-full"
                    />
                  </div>

                  {vendorHasChat && !isOwner && (
                    <div className="w-full mt-3">
                      <ChatTrigger
                        ref={chatRef}
                        businessId={business.id}
                        businessName={business.title}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95"
                      />
                    </div>
                  )}

                  {!isOwner && (
                    <button
                      onClick={openEnquiryModal}
                      className="w-full mt-3 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-violet-700 transition-all active:scale-95"
                    >
                      <Send className="w-4 h-4" /> Send Enquiry
                    </button>
                  )}

                  {isOwner && (
                    <div className="w-full mt-3 py-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Your Business
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
          {/* end right sidebar */}
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
          <div className="flex items-center gap-2">
            {business.phone && (
              <button
                onClick={() => handleContactIntent("call")}
                className="flex-1 h-12 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-xs"
              >
                <Phone className="w-4 h-4" /> Call
              </button>
            )}
            {business.phone && (
              <a
                href={`sms:${business.phone}`}
                onClick={() => trackContactClick("sms")}
                className="flex-1 h-12 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-xs"
              >
                <MessageSquare className="w-4 h-4" /> SMS
              </a>
            )}
            {(business.whatsapp || business.phone) && (
              <button
                onClick={() => handleContactIntent("whatsapp")}
                className="flex-1 h-12 bg-[#25D366] text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-xs"
              >
                <WhatsAppIcon className="w-5 h-5" /> WhatsApp
              </button>
            )}
            {business.email && (
              <a
                href={`mailto:${business.email}`}
                onClick={() => trackContactClick("email")}
                className="flex-1 h-12 bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-xs"
              >
                <Mail className="w-4 h-4" /> Email
              </a>
            )}
            {!isOwner && vendorHasChat && (
              <button
                onClick={() => {
                  if (!user) {
                    router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                    return;
                  }
                  chatRef.current?.open();
                }}
                className="flex-1 h-12 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-xs"
              >
                <MessageSquare className="w-4 h-4" /> Chat
              </button>
            )}
            {!isOwner && !vendorHasChat && (
              <button
                disabled
                className="flex-1 h-12 bg-gray-300 text-gray-500 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed text-xs"
                title="Upgrade to Chat"
              >
                <MessageSquare className="w-4 h-4" /> Chat
              </button>
            )}
            <button
              onClick={() => openEnquiryModal()}
              className="w-12 h-12 bg-violet-600 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-violet-500/20"
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
    </div>
  );
}
