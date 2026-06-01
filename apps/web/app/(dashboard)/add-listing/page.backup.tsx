"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
    Loader2, Store, MapPin, Phone, TextQuote, Layers,
    ArrowLeft, CheckCircle, ImagePlus, Building2, Tag,
    FileText, Navigation, Sparkles, X, Images, Check, Plus,
    ChevronLeft, ChevronRight, Hash, Share2, Globe, Search, ChevronDown, HelpCircle, Trash2, Lock
} from 'lucide-react';
import { api, getImageUrl } from '../../../lib/api';
import { Category, City } from '../../../types/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { usePlanFeature } from '../../../hooks/usePlanFeature';
import Link from 'next/link';

import { tryDetectDeviceLocation, reverseGeocodeFromCoords, sortAndDedupeCities } from '../../../lib/location-detect';
import { DEFAULT_DIAL_CODES } from '../../../lib/phone-codes';
import AddressPlacesAutocomplete from '../../../components/AddressPlacesAutocomplete';

const DraggablePinMap = dynamic(() => import('../../../components/DraggablePinMap'), { ssr: false });

const DIAL_CODES = DEFAULT_DIAL_CODES;

const steps = [
    { id: 1, label: 'Business Info', icon: Building2 },
    { id: 2, label: 'Location', icon: Navigation },
    { id: 3, label: 'Details', icon: FileText },
    { id: 4, label: 'FAQs', icon: HelpCircle },
];

const inputClass =
    "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all placeholder:text-slate-400";

const selectClass =
    "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all appearance-none cursor-pointer pr-10";

const labelClass = "block text-xs font-black uppercase tracking-widest text-slate-400 mb-2";

const SOCIAL_PLATFORMS = [
    { key: 'facebook', label: 'Facebook', emoji: '📘', color: '#1877F2', placeholder: 'https://facebook.com/yourbusiness' },
    { key: 'instagram', label: 'Instagram', emoji: '📸', color: '#E1306C', placeholder: 'https://instagram.com/yourbusiness' },
    { key: 'twitter', label: 'Twitter / X', emoji: '🐦', color: '#1DA1F2', placeholder: 'https://twitter.com/yourbusiness' },
    { key: 'linkedin', label: 'LinkedIn', emoji: '💼', color: '#0A66C2', placeholder: 'https://linkedin.com/company/yourbusiness' },
    { key: 'youtube', label: 'YouTube', emoji: '▶️', color: '#FF0000', placeholder: 'https://youtube.com/@yourbusiness' },
];
const PremiumFeatureBanner = ({ title, description }: { title: string, description: string }) => (
    <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-white/60 flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-orange-100/50">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
            <Lock className="w-6 h-6 text-white" />
        </div>
        <h4 className="text-lg font-black text-slate-900 mb-2">{title}</h4>
        <p className="text-sm font-bold text-slate-600 mb-4 max-w-sm">{description}</p>
        <Link href="/subscription" className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-slate-900/20">
            Upgrade Plan
        </Link>
    </div>
);

export default function AddListingPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [catsLoading, setCatsLoading] = useState(true);
    const [catsError, setCatsError] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [activeStep, setActiveStep] = useState(1);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [imageCaptions, setImageCaptions] = useState<Record<string, string>>({});
    const [galleryUploading, setGalleryUploading] = useState(false);
    const [amenities, setAmenities] = useState<any[]>([]);
    const [amenitiesLoading, setAmenitiesLoading] = useState(true);
    const [showAddAmenity, setShowAddAmenity] = useState(false);
    const [newAmenityName, setNewAmenityName] = useState('');
    const [creatingAmenity, setCreatingAmenity] = useState(false);
    const [addressConfig, setAddressConfig] = useState<any>(null);
    const [suggestions, setSuggestions] = useState<Category[]>([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [myListingsCount, setMyListingsCount] = useState<number | null>(null);
    const [agreed, setAgreed] = useState(false);
    const [countryOptions, setCountryOptions] = useState<{ code: string; name: string }[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        categoryId: '',
        subCategoryIds: [] as string[],
        description: '',
        phoneCode: '+92',
        phoneNumber: '',
        address: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        latitude: 30.3753,
        longitude: 69.3451,
        coverImageUrl: '',
        images: [] as string[],
        hasOffer: false,
        offerTitle: '',
        offerDescription: '',
        offerBadge: '',
        offerExpiresAt: '',
        offerBannerUrl: '',
        country: 'Pakistan',
        amenityIds: [] as string[],
        metaKeywords: '',
        whatsapp: '',
        website: '',
        suggestedCategoryName: '',
        faqs: [] as { question: string; answer: string }[],
    });

    const formDataRef = useRef(formData);
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    // Use centralized feature gating
    const { getFeatureValue, planName, isFree } = usePlanFeature();
    const maxListings = getFeatureValue('maxListings') || 1;
    const maxImages = isFree ? 3 : 999;
    const isVendor = user?.role === 'vendor';
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

    // Explicitly check listing count against plan limit
    const canAddListing = isAdmin || (myListingsCount !== null && myListingsCount < maxListings);

    
    useEffect(() => {
        api.addressConfig.getCountries({ silent: true })
            .then((list) => {
                const arr = Array.isArray(list) ? list : [];
                setCountryOptions(arr.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })));
            })
            .catch(() => setCountryOptions([]));
    }, []);

    useEffect(() => {
        async function fetchAddressConfig() {
            try {
                const selected = countryOptions.find((c) => c.name === formData.country);
                const code = selected?.code || formData.country || 'PK';
                const config = await api.addressConfig.get(code);
                setAddressConfig(config);
            } catch (err) {
                console.error('Failed to fetch address config', err);
            }
        }
        fetchAddressConfig();
    }, [formData.country, countryOptions]);

    const updateLocationFromCoords = async (lat: number, lng: number) => {
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
        const geo = await reverseGeocodeFromCoords(lat, lng);
        setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            ...(geo.country && { country: geo.country }),
            ...(geo.city && { city: geo.city }),
            ...(geo.state && { state: geo.state }),
            ...(geo.postalCode && { pincode: geo.postalCode }),
        }));
    };

    const handleGetCurrentLocation = async () => {
        const result = await tryDetectDeviceLocation();
        if (!result.ok) {
            alert(result.message);
            return;
        }
        await updateLocationFromCoords(result.coords.latitude, result.coords.longitude);
    };

    // ── Social Links ─────────────────────────────────────────────────
    const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);

    const addSocialLink = (platform: string) => {
        if (!socialLinks.find(s => s.platform === platform)) {
            setSocialLinks(prev => [...prev, { platform, url: '' }]);
        }
    };

    const removeSocialLink = (platform: string) => {
        setSocialLinks(prev => prev.filter(s => s.platform !== platform));
    };

    const updateSocialUrl = (platform: string, url: string) => {
        setSocialLinks(prev => prev.map(s => s.platform === platform ? { ...s, url } : s));
    };

    // ── Keywords ────────────────────────────────────────────────────
    const [keywords, setKeywords] = useState<string[]>([]);
    const [keywordInput, setKeywordInput] = useState('');
    const keywordInputRef = useRef<HTMLInputElement>(null);

    const addKeyword = (raw: string) => {
        const tag = raw.trim().toLowerCase().replace(/[,]+$/, '');
        if (tag && !keywords.includes(tag) && keywords.length < 20) {
            const updated = [...keywords, tag];
            setKeywords(updated);
            setFormData(prev => ({ ...prev, metaKeywords: updated.join(',') }));
        }
        setKeywordInput('');
    };

    const removeKeyword = (kw: string) => {
        const updated = keywords.filter(k => k !== kw);
        setKeywords(updated);
        setFormData(prev => ({ ...prev, metaKeywords: updated.join(',') }));
    };

    const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addKeyword(keywordInput);
        } else if (e.key === 'Backspace' && !keywordInput && keywords.length > 0) {
            removeKeyword(keywords[keywords.length - 1]);
        }
    };

    // Lightbox state
    const [showLightbox, setShowLightbox] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

    const addFaq = () => {
        if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
        setFormData(prev => ({
            ...prev,
            faqs: [...prev.faqs, { ...newFaq }]
        }));
        setNewFaq({ question: '', answer: '' });
    };

    const removeFaq = (index: number) => {
        setFormData(prev => ({
            ...prev,
            faqs: prev.faqs.filter((_, i) => i !== index)
        }));
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            setCatsLoading(true);
            setCatsError(null);
            try {
                const [cats, cityList, amenityList, myListings] = await Promise.all([
                    api.categories.getAll(),
                    api.cities.getAll(),
                    api.listings.getAmenities(),
                    api.listings.getMyListings({ limit: 1 }).catch(() => ({ meta: { total: 0 } }))
                ]);
                // Normalise in case API wraps response
                const catArray = Array.isArray(cats) ? cats : (cats as any)?.data ?? [];
                const cityArray = Array.isArray(cityList) ? cityList : (cityList as any)?.data ?? [];
                const sortedCities = sortAndDedupeCities(cityArray);
                setCategories(catArray);
                setCities(sortedCities);
                setAmenities(amenityList || []);
                // Track how many listings the vendor already has (for free plan limit)
                setMyListingsCount((myListings as any)?.meta?.total ?? (myListings as any)?.length ?? 0);
                setFormData(prev => ({
                    ...prev,
                    categoryId: catArray[0]?.id || '',
                    city: sortedCities[0]?.name || ''
                }));
            } catch (err: any) {
                console.error('Failed to fetch initial data:', err);
                setCatsError(err.message || 'Failed to load categories from server');
            } finally {
                setCatsLoading(false);
                setAmenitiesLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const getAISuggestion = async () => {
        if (!formData.title.trim()) {
            setError("Please enter a business title first for AI suggestion");
            return;
        }
        setSuggestionsLoading(true);
        try {
            const res = await api.categories.suggest(formData.title, formData.description);
            setSuggestions(res);
            if (res.length === 0) {
                setError("No specific categories found. Try adding more details to the description.");
            }
        } catch (err: any) {
            console.error('AI Suggestion failed:', err);
        } finally {
            setSuggestionsLoading(false);
        }
    };

    const validateStep1 = () => {
        if (!formData.title.trim() || formData.title.length < 2) return 'Business Title requires at least 2 characters';
        if (!formData.categoryId && !formData.suggestedCategoryName) return 'Please select a Business Category';
        if (formData.categoryId === 'other' && !formData.suggestedCategoryName.trim()) return 'Please enter the suggested category name';
        if (!formData.phoneNumber?.trim()) {
            return 'Phone number is required';
        }
        const fullPhone = `${formData.phoneCode}${formData.phoneNumber}`.replace(/\s+/g, '');
        if (!/^\+[1-9]\d{7,14}$/.test(fullPhone)) {
            return 'A valid global phone number is required (8-15 digits)';
        }
        return null;
    };

    const validateStep2 = () => {
        if (!formData.state || formData.state === 'Other') return 'Please select a valid State';
        if (!formData.city || formData.city === 'Other') return 'Please select a valid City';
        if (!formData.address.trim() || formData.address.length < 5) return 'A detailed Area/Street address is required';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!agreed) {
            setError('You must agree to the Terms & Conditions and Privacy Policy.');
            return;
        }

        setLoading(true);

        // Use the latest ref value to avoid stale closures
        const rawData = formDataRef.current;
        const submissionData: any = {
            ...rawData,
            phone: `${rawData.phoneCode}${rawData.phoneNumber}`.replace(/\s+/g, ''),
            legalConsentAccepted: agreed,
            legalConsentAcceptedAt: new Date().toISOString(),
            imageCaptions: Object.keys(imageCaptions).length > 0 ? imageCaptions : undefined,
        };

        // Handle category suggestion
        if (submissionData.categoryId === 'other') {
            submissionData.categoryId = undefined;
        } else {
            submissionData.suggestedCategoryName = undefined;
        }

        // Filter out empty FAQs
        submissionData.faqs = (submissionData.faqs || []).filter((f: any) => f.question.trim() && f.answer.trim());

        // Clean up empty strings for optional URL/Email fields that might fail validation
        // class-validator @IsUrl() fails on empty strings even if @IsOptional()
        const fieldsToPrune = ['coverImageUrl', 'logoUrl', 'website', 'email', 'offerBannerUrl', 'whatsapp'];
        fieldsToPrune.forEach(field => {
            if (submissionData[field] === '') {
                delete submissionData[field];
            }
        });

        // Omit offer fields if no offer is enabled
        if (!submissionData.hasOffer) {
            delete submissionData.offerTitle;
            delete submissionData.offerDescription;
            delete submissionData.offerBadge;
            delete submissionData.offerExpiresAt;
            delete submissionData.offerBannerUrl;
        }

        console.log('[AddListing] Submitting listing data:', submissionData);

        try {
            await api.listings.create(submissionData);
            // Save social links to vendor profile
            const linksToSave = socialLinks.filter(s => s.url.trim());
            await api.businessProfiles.updateProfile({ socialLinks: linksToSave });
            setSuccess(true);
            setTimeout(() => router.push('/listings'), 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to create listing');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'latitude' || name === 'longitude' ? parseFloat(value) : value
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImagePreview(URL.createObjectURL(file));
        setLoading(true);
        setError(null);
        try {
            const response = await api.listings.uploadImage(file);
            setFormData(prev => ({ ...prev, coverImageUrl: response.url }));
        } catch (err: any) {
            setError(err.message || 'Failed to upload image');
        } finally {
            setLoading(false);
        }
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const remaining = maxImages - galleryPreviews.length;
        const toUpload = files.slice(0, remaining);

        if (toUpload.length === 0) return;

        setGalleryUploading(true);
        setError(null);

        try {
            // Create local previews with temporary IDs to track them
            const newUploads = toUpload.map(file => ({
                id: Math.random().toString(36).substring(7),
                file,
                preview: URL.createObjectURL(file)
            }));

            // Add previews immediately
            setGalleryPreviews(prev => [...prev, ...newUploads.map(u => u.preview)]);

            // Sequential upload but parallelized using Promise.all for the batch
            const uploadPromises = newUploads.map(async (upload) => {
                const res = await api.listings.uploadImage(upload.file);
                return { preview: upload.preview, url: res.url };
            });

            const results = await Promise.all(uploadPromises);
            const uploadedUrls = results.map(r => r.url);

            setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));

            // Replace local previews with real URLs safely
            setGalleryPreviews(prev => {
                const updated = [...prev];
                results.forEach(res => {
                    const idx = updated.indexOf(res.preview);
                    if (idx !== -1) {
                        updated[idx] = res.url;
                    }
                });
                return updated;
            });
        } catch (err: any) {
            setError(err.message || 'Failed to upload gallery images');
        } finally {
            setGalleryUploading(false);
        }
    };

    const removeGalleryImage = (index: number) => {
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
        setFormData(prev => ({ ...prev, images: prev.images.filter((_: string, i: number) => i !== index) }));
    };

    const openLightbox = (index: number) => {
        setCurrentImageIndex(index);
        setShowLightbox(true);
    };

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % galleryPreviews.length);
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + galleryPreviews.length) % galleryPreviews.length);
    };

    const toggleAmenity = (id: string) => {
        setFormData(prev => {
            const exists = prev.amenityIds.includes(id);
            if (exists) {
                return { ...prev, amenityIds: prev.amenityIds.filter(a => a !== id) };
            }
            return { ...prev, amenityIds: [...prev.amenityIds, id] };
        });
    };

    const handleAddAmenity = async () => {
        if (!newAmenityName.trim()) return;
        setCreatingAmenity(true);
        try {
            const res = await api.listings.createAmenity({ name: newAmenityName });
            setAmenities(prev => [...prev, res]);
            toggleAmenity(res.id);
            setNewAmenityName('');
            setShowAddAmenity(false);
        } catch (err: any) {
            setError(err.message || 'Failed to create amenity');
        } finally {
            setCreatingAmenity(false);
        }
    };


    if (success) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-24 h-24 rounded-full bg-green-50 border-4 border-green-200 flex items-center justify-center"
                >
                    <CheckCircle className="w-12 h-12 text-green-500" />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                >
                    <h2 className="text-3xl font-black text-slate-900 mb-2">Listing Published! 🎉</h2>
                    <p className="text-slate-500 font-medium">Your business is now live. Redirecting...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-16">
            {!canAddListing && !loading && myListingsCount !== null && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-10 p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-20 h-20 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                            <Lock className="w-10 h-10 text-orange-500" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Listing Limit Reached</h2>
                            <p className="text-slate-400 font-bold mb-4">
                                Your current <span className="text-orange-400">{planName}</span> plan allows for a maximum of <span className="text-white">{maxListings}</span> business listing{maxListings > 1 ? 's' : ''}.
                                You have already used all of them.
                            </p>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <Link
                                    href="/subscription"
                                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-orange-500/20"
                                >
                                    Upgrade Plan
                                </Link>
                                <Link
                                    href="/listings"
                                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-black text-sm transition-all"
                                >
                                    Manage Existing Listings
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Hero Header */}
            <div className="relative mb-10 rounded-3xl overflow-hidden bg-gradient-to-br from-[#0B2244] via-[#0D2E61] to-[#1a3a70] p-8 md:p-10 shadow-2xl">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

                <div className="relative flex items-center gap-4 mb-6">
                    {/* <button
                        onClick={() => router.back()}
                        className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button> */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {/* <Sparkles className="w-4 h-4 text-orange-400" /> */}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Add Your Business</h1>
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="relative flex items-center gap-0">
                    {steps.map((step, idx) => {
                        const Icon = step.icon;
                        const isActive = activeStep === step.id;
                        const isDone = activeStep > step.id;
                        return (
                            <React.Fragment key={step.id}>
                                <button
                                    type="button"
                                    onClick={() => setActiveStep(step.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-bold text-sm ${isActive
                                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                        : isDone
                                            ? 'bg-white/20 text-white'
                                            : 'bg-white/5 text-white/40'
                                        }`}
                                >
                                    {isDone
                                        ? <CheckCircle className="w-4 h-4" />
                                        : <Icon className="w-4 h-4" />
                                    }
                                    <span className="hidden md:inline">{step.label}</span>
                                </button>
                                {idx < steps.length - 1 && (
                                    <div className={`h-[2px] flex-1 mx-1 rounded-full transition-all ${isDone ? 'bg-orange-400' : 'bg-white/10'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3"
                >
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-500 font-black">!</div>
                    {error}
                </motion.div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off">
                {/* ── STEP 1: Business Info ── */}
                {activeStep === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        {/* Cover Image Upload */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <ImagePlus className="w-4 h-4 text-orange-500" />
                                </div>
                                <h3 className="font-black text-slate-900">Cover Image</h3>
                            </div>
                            <div className="p-6">
                                <label className="block cursor-pointer group">
                                    <div className={`relative rounded-2xl border-2 border-dashed transition-all overflow-hidden ${imagePreview ? 'border-orange-300' : 'border-slate-200 hover:border-orange-300 bg-slate-50 hover:bg-orange-50/30'}`}>
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-56 object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-14 gap-3 text-slate-400 group-hover:text-orange-400 transition-colors">
                                                <ImagePlus className="w-10 h-10" />
                                                <div className="text-center">
                                                    <p className="font-black text-sm">Click to upload cover image</p>

                                                    {/* YAHI REPLACE KARNA HAI */}
                                                    <p className="text-xs mt-0.5">
                                                        Recommended: 1200 × 675px (16:9) • PNG, JPG up to 5MB
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {imagePreview && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white font-black text-sm bg-orange-500 px-4 py-2 rounded-xl">Change Image</span>
                                            </div>
                                        )}
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                            </div>
                        </div>

                        {/* Business Details */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <Store className="w-4 h-4 text-blue-500" />
                                </div>
                                <h3 className="font-black text-slate-900">Business Details</h3>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className={labelClass}>
                                        Business Title <span className="text-orange-500">*</span>
                                    </label>
                                    <input
                                        required
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="e.g. The Artisanal Coffee"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        <Tag className="w-3 h-3 inline mr-1.5 text-orange-500" />
                                        Category <span className="text-orange-500">*</span>
                                    </label>
                                    <div className="relative">
                                        {catsLoading ? (
                                            <div className="flex items-center gap-2 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-sm">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Loading categories...
                                            </div>
                                        ) : catsError ? (
                                            <div className="px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl text-red-500 text-sm font-semibold">
                                                ⚠ {catsError}
                                            </div>
                                        ) : (
                                            <>
                                                <select
                                                    required
                                                    name="categoryId"
                                                    value={formData.categoryId}
                                                    onChange={handleChange}
                                                    className={selectClass}
                                                >
                                                    <option value="" disabled>-- Select Category --</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                    ))}
                                                    <option value="other">Other</option>
                                                </select>
                                                <Layers className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </>
                                        )}
                                    </div>

                                    {/* AI Suggestions Display */}
                                    <AnimatePresence>
                                        {(suggestions.length > 0 || suggestionsLoading) && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-3"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Suggested Categories</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {suggestionsLoading ? (
                                                        [1, 2, 3].map(i => (
                                                            <div key={i} className="h-8 w-24 bg-slate-100 animate-pulse rounded-full" />
                                                        ))
                                                    ) : (
                                                        suggestions.map(cat => (
                                                            <button
                                                                key={cat.id}
                                                                type="button"
                                                                onClick={() => setFormData(prev => ({ ...prev, categoryId: cat.id }))}
                                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${formData.categoryId === cat.id
                                                                    ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20'
                                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-500'
                                                                    }`}
                                                            >
                                                                {cat.name}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button
                                        type="button"
                                        onClick={getAISuggestion}
                                        disabled={suggestionsLoading || !formData.title.trim()}
                                        className="mt-3 flex items-center gap-2 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                                            {suggestionsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        </div>
                                        {suggestionsLoading ? 'Finding matches...' : 'Get Category Suggestions'}
                                    </button>
                                </div>

                                {formData.categoryId === 'other' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <label className={labelClass}>
                                            <Sparkles className="w-3 h-3 inline mr-1.5 text-orange-500" />
                                            Suggested Category Name <span className="text-orange-500">*</span>
                                        </label>
                                        <input
                                            name="suggestedCategoryName"
                                            value={formData.suggestedCategoryName}
                                            onChange={handleChange}
                                            placeholder="e.g. Pet Grooming, Yoga Studio"
                                            className={inputClass}
                                        />
                                        <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                            Admin will review and create this category if appropriate.
                                        </p>
                                    </motion.div>
                                )}

                                {/* Subcategories */}
                                {(() => {
                                    const maxSubCategories = getFeatureValue('maxSubCategories') || 0;
                                    const allowedMax = Math.min(3, maxSubCategories);
                                    
                                    if (allowedMax > 0 && formData.categoryId && formData.categoryId !== 'other') {
                                        const relatedSubcategories = categories.filter(c => c.parentId === formData.categoryId);
                                        if (relatedSubcategories.length > 0) {
                                            return (
                                                <div className="mt-4 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Layers className="w-4 h-4 text-purple-600" />
                                                        <h4 className="text-sm font-black text-slate-900">Subcategories (Select up to {allowedMax})</h4>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {Array.from({ length: allowedMax }).map((_, i) => (
                                                            <div key={`sub-${i}`}>
                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Subcategory {i + 1}</label>
                                                                <div className="relative">
                                                                    <select
                                                                        value={formData.subCategoryIds[i] || ''}
                                                                        onChange={e => {
                                                                            const newSubs = [...formData.subCategoryIds];
                                                                            if (e.target.value) {
                                                                                newSubs[i] = e.target.value;
                                                                            } else {
                                                                                newSubs.splice(i, 1);
                                                                            }
                                                                            setFormData(prev => ({ ...prev, subCategoryIds: newSubs.filter(Boolean) }));
                                                                        }}
                                                                        className={selectClass + " bg-white"}
                                                                    >
                                                                        <option value="">-- Optional --</option>
                                                                        {relatedSubcategories.map(sub => (
                                                                            <option 
                                                                                key={sub.id} 
                                                                                value={sub.id}
                                                                                disabled={formData.subCategoryIds.includes(sub.id) && formData.subCategoryIds[i] !== sub.id}
                                                                            >
                                                                                {sub.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    } else if (allowedMax === 0 && formData.categoryId) {
                                        return (
                                            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 opacity-60">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Premium Feature</h4>
                                                </div>
                                                <p className="text-[10px] font-medium text-slate-400">Upgrade to select multiple subcategories.</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                <div>
                                    <label className={labelClass}>
                                        <Phone className="w-3 h-3 inline mr-1.5 text-orange-500" />
                                        Contact Number <span className="text-orange-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={formData.phoneCode}
                                            onChange={e => setFormData(prev => ({ ...prev, phoneCode: e.target.value }))}
                                            className={`${selectClass} w-36 flex-shrink-0`}
                                        >
                                            {DIAL_CODES.map(d => (
                                                <option key={`${d.code}-${d.dialCode}`} value={d.dialCode}>
                                                    {d.dialCode} {d.country}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            required
                                            type="tel"
                                            value={formData.phoneNumber}
                                            onChange={e => setFormData(prev => ({ ...prev, phoneNumber: e.target.value.replace(/\D/g, '') }))}
                                            placeholder="300 1234567"
                                            className={`${inputClass} flex-1`}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1.5 font-medium">
                                        Select country code and enter your local number
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className={labelClass}>
                                            <Globe className="w-3 h-3 inline mr-1.5 text-orange-500" />
                                            WhatsApp Number
                                        </label>
                                        <input
                                            type="tel"
                                            name="whatsapp"
                                            value={formData.whatsapp}
                                            onChange={handleChange}
                                            placeholder="e.g. 03001234567"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            <Globe className="w-3 h-3 inline mr-1.5 text-orange-500" />
                                            Business Website
                                        </label>
                                        <input
                                            type="url"
                                            name="website"
                                            value={formData.website}
                                            onChange={handleChange}
                                            placeholder="https://..."
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Media Gallery */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                                        <Images className="w-4 h-4 text-purple-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900">Media Gallery</h3>
                                        <p className="text-[11px] text-slate-400 font-medium">{isFree ? 'Up to 3 photos' : 'Unlimited photos'} · PNG, JPG</p>
                                    </div>
                                </div>
                                <span className="text-xs font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{galleryPreviews.length}/{isFree ? '3' : '∞'}</span>
                            </div>
                            <div className="p-6">
                                {/* Preview Grid */}
                                {galleryPreviews.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                        {galleryPreviews.map((src, i) => (
                                            <div
                                                key={i}
                                                className="relative group rounded-xl overflow-hidden aspect-square bg-slate-100 flex flex-col"
                                            >
                                                <div className="relative flex-1 overflow-hidden cursor-pointer" onClick={() => openLightbox(i)}>
                                                    <img src={src} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeGalleryImage(i);
                                                            }}
                                                            className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    {src.startsWith('blob:') && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                                                        </div>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Add caption..."
                                                    value={imageCaptions[src] || ''}
                                                    onChange={e => setImageCaptions(prev => ({...prev, [src]: e.target.value}))}
                                                    className="w-full px-2 py-1.5 text-[10px] bg-white border-t border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-slate-50"
                                                />
                                            </div>
                                        ))}
                                        {/* Add More slot */}
                                        {galleryPreviews.length < maxImages && (
                                            <label className="cursor-pointer rounded-xl border-2 border-dashed border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 transition-all flex flex-col items-center justify-center aspect-square gap-1">
                                                <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                                                <ImagePlus className="w-5 h-5 text-slate-300" />
                                                <span className="text-[10px] font-bold text-slate-400">Add More</span>
                                            </label>
                                        )}
                                    </div>
                                )}

                                {/* Empty Upload Zone */}
                                {galleryPreviews.length === 0 && (
                                    <label className="block cursor-pointer group">
                                        <div className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-purple-300 bg-slate-50 hover:bg-purple-50/20 transition-all p-10">
                                            <div className="flex flex-col items-center gap-4 text-slate-400 group-hover:text-purple-500 transition-colors">
                                                <div className="flex -space-x-3">
                                                    {[0, 1, 2].map(i => (
                                                        <div key={i} className={`w-12 h-12 rounded-2xl border-2 border-white flex items-center justify-center transition-colors shadow-sm ${i === 0 ? 'bg-purple-100' : i === 1 ? 'bg-purple-50' : 'bg-slate-200 group-hover:bg-purple-50'}`}>
                                                            <ImagePlus className="w-5 h-5" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-black text-sm">Click to upload gallery photos</p>
                                                    <p className="text-xs mt-1 text-slate-400">Select multiple images at once {isFree ? '· Max 3' : ''}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                                    </label>
                                )}

                                {galleryUploading && (
                                    <div className="flex items-center gap-2 mt-3 text-purple-500 text-sm font-bold">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading photos to cloud...
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                const err = validateStep1();
                                if (err) {
                                    setError(err);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                    return;
                                }
                                setError(null);
                                setActiveStep(2);
                            }}
                            className="w-full py-4 bg-gradient-to-r from-[#0B2244] to-[#0D2E61] text-white rounded-2xl font-black text-base  hover:shadow-blue-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            Continue to Location
                            <Navigation className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}

                {/* ── STEP 2: Location ── */}
                {activeStep === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        {/* Location Details */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                                        <MapPin className="w-4 h-4 text-orange-500" />
                                    </div>
                                    <h3 className="font-black text-slate-900">Location Details</h3>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-5">
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={handleGetCurrentLocation}
                                                className="flex items-center gap-1.5 text-[10px] font-black text-orange-600 uppercase tracking-widest hover:text-orange-700 transition-colors"
                                            >
                                                <MapPin className="w-3 h-3" /> Use Device GPS
                                            </button>
                                        </div>

                                        <div>
                                            <label className={labelClass}>Country <span className="text-orange-500">*</span></label>
                                            <select
                                                required
                                                name="country"
                                                value={formData.country}
                                                onChange={e => setFormData(prev => ({ ...prev, country: e.target.value, state: '', city: '', address: '' }))}
                                                className={selectClass}
                                            >
                                                {(countryOptions.length > 0 ? countryOptions : [{ code: 'PK', name: 'Pakistan' }]).map((c) => (
                                                    <option key={c.code} value={c.name}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {addressConfig?.fields?.map((field: any) => {
                                            if (field.key === 'state') {
                                                return (
                                                    <div key={field.key}>
                                                        <label className={labelClass}>{field.label} {field.required && <span className="text-orange-500">*</span>}</label>
                                                        <div className="relative">
                                                            <input
                                                                required={field.required}
                                                                list="state-list"
                                                                name="state"
                                                                value={formData.state}
                                                                onChange={e => setFormData(prev => ({ ...prev, state: e.target.value, city: '', address: '' }))}
                                                                placeholder={`Type or select a ${field.label.toLowerCase()}`}
                                                                className={selectClass}
                                                            />
                                                            <datalist id="state-list">
                                                                {cities.length > 0 ? (
                                                                    Array.from(new Set(cities.filter(c => c.state).map(c => c.state)))
                                                                        .sort()
                                                                        .map(s => <option key={s} value={s!} />)
                                                                ) : (
                                                                    <>
                                                                        <option value="Punjab" />
                                                                        <option value="Sindh" />
                                                                        <option value="KPK" />
                                                                        <option value="Balochistan" />
                                                                        <option value="Islamabad" />
                                                                    </>
                                                                )}
                                                            </datalist>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            if (field.key === 'city') {
                                                return (
                                                    <div key={field.key}>
                                                        <label className={labelClass}>{field.label} {field.required && <span className="text-orange-500">*</span>}</label>
                                                        <div className="relative">
                                                            <input
                                                                required={field.required}
                                                                list="city-list"
                                                                name="city"
                                                                value={formData.city}
                                                                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value, address: '' }))}
                                                                placeholder={`Type or select a ${field.label.toLowerCase()}`}
                                                                className={selectClass}
                                                            />
                                                            <datalist id="city-list">
                                                                {cities
                                                                    .filter(c => !formData.state || c.state === formData.state)
                                                                    .sort((a, b) => a.name.localeCompare(b.name))
                                                                    .map(c => <option key={c.id} value={c.name} />)
                                                                }
                                                            </datalist>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            if (field.key === 'address') {
                                                return (
                                                    <div key={field.key}>
                                                        <label className={labelClass}>{field.label} {field.required && <span className="text-orange-500">*</span>}</label>
                                                        <AddressPlacesAutocomplete
                                                            value={formData.address}
                                                            onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                                                            countryCode={countryOptions.find((c) => c.name === formData.country)?.code}
                                                            onPlaceSelected={(place) => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    address: place.streetAddress || place.formattedAddress || prev.address,
                                                                    ...(place.city && { city: place.city }),
                                                                    ...(place.state && { state: place.state }),
                                                                    ...(place.postalCode && { pincode: place.postalCode }),
                                                                    latitude: place.latitude,
                                                                    longitude: place.longitude,
                                                                }));
                                                            }}
                                                            placeholder="Start typing street address (min 3 characters)..."
                                                            className={inputClass}
                                                        />
                                                    </div>
                                                );
                                            }

                                            if (field.key === 'addressLine2') {
                                                return (
                                                    <div key={field.key}>
                                                        <label className={labelClass}>{field.label}</label>
                                                        <input
                                                            name="addressLine2"
                                                            value={formData.addressLine2 || ''}
                                                            onChange={handleChange}
                                                            placeholder="Apt, Suite, Floor (Optional)"
                                                            className={inputClass}
                                                        />
                                                    </div>
                                                );
                                            }

                                            return null;
                                        })}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                {addressConfig?.postalCode ? <label className={labelClass}>{addressConfig.postalCode.label}</label> : <label className={labelClass}>Postal Code / Pincode</label>}
                                                <input
                                                    required={false}
                                                    name="pincode"
                                                    value={formData.pincode}
                                                    onChange={handleChange}
                                                    placeholder="e.g. 54000"
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Coordinates</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        name="latitude"
                                                        type="number"
                                                        step="any"
                                                        value={formData.latitude}
                                                        onChange={handleChange}
                                                        placeholder="Lat"
                                                        className={`${inputClass} text-[10px] px-2`}
                                                    />
                                                    <input
                                                        name="longitude"
                                                        type="number"
                                                        step="any"
                                                        value={formData.longitude}
                                                        onChange={handleChange}
                                                        placeholder="Long"
                                                        className={`${inputClass} text-[10px] px-2`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative min-h-[350px] lg:min-h-full rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                                        <DraggablePinMap
                                            latitude={formData.latitude}
                                            longitude={formData.longitude}
                                            onChange={(lat, lng) => {
                                                setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                                            }}
                                        />
                                        <div className="absolute top-4 left-4 z-[500] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm pointer-events-none">
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter flex items-center gap-1.5">
                                                <Navigation className="w-3 h-3 text-orange-500" />
                                                Drag pin or click map
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setActiveStep(1)}
                                className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-base hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const err = validateStep2();
                                    if (err) {
                                        setError(err);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                        return;
                                    }
                                    setError(null);
                                    setActiveStep(3);
                                }}
                                className="flex-[2] py-4 bg-gradient-to-r from-[#0B2244] to-[#0D2E61] text-white rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2"
                            >
                                Continue to Details <FileText className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── STEP 3: Description + Publish ── */}
                {activeStep === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                                    <TextQuote className="w-4 h-4 text-purple-500" />
                                </div>
                                <h3 className="font-black text-slate-900">About Your Business</h3>
                            </div>
                            <div className="p-6">
                                <label className={labelClass}>
                                    Short Description <span className="text-orange-500">*</span>
                                </label>
                                <textarea
                                    required
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={6}
                                    placeholder="Briefly describe what makes your business unique, your services, working hours..."
                                    className={`${inputClass} resize-none leading-relaxed`}
                                />
                                <p className="text-xs text-slate-400 font-medium mt-2">{formData.description.length} characters</p>
                            </div>
                        </div>

                        {/* Business Amenities Section */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <h3 className="font-black text-slate-900">Business Amenities</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAddAmenity(!showAddAmenity)}
                                    className="text-xs font-black uppercase tracking-widest text-[#FF7A30] hover:text-[#E86920] transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Add Option
                                </button>
                            </div>
                            <div className="p-6">
                                {showAddAmenity && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-6 p-4 bg-orange-50/50 rounded-xl border border-orange-100 flex gap-2"
                                    >
                                        <input
                                            type="text"
                                            placeholder="Enter new amenity name..."
                                            value={newAmenityName}
                                            onChange={(e) => setNewAmenityName(e.target.value)}
                                            className="flex-1 px-4 py-2 bg-white border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddAmenity}
                                            disabled={creatingAmenity || !newAmenityName.trim()}
                                            className="px-4 py-2 bg-[#FF7A30] text-white rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {creatingAmenity ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                                        </button>
                                    </motion.div>
                                )}

                                {amenitiesLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {amenities.map((amenity) => {
                                            const isSelected = formData.amenityIds.includes(amenity.id);
                                            return (
                                                <button
                                                    key={amenity.id}
                                                    type="button"
                                                    onClick={() => toggleAmenity(amenity.id)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${isSelected
                                                        ? 'bg-orange-50 border-orange-200 text-orange-700 ring-1 ring-orange-200'
                                                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200'
                                                        }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-orange-500 text-white' : 'bg-white text-slate-400'
                                                        }`}>
                                                        {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                    </div>
                                                    <span className="text-sm font-bold truncate">{amenity.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {amenities.length === 0 && !amenitiesLoading && !showAddAmenity && (
                                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-sm text-slate-400 font-medium">No amenities found. Click "Add Option" to create one.</p>
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* ── Social Media Links ───────────────────────────── */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
                                    <Share2 className="w-4 h-4 text-pink-500" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900">Social Media Links</h3>
                                    <p className="text-[11px] text-slate-400 font-medium">Connect your social profiles · optional</p>
                                </div>
                            </div>
                            <div className="p-6">
                                {/* Platform picker */}
                                <p className={labelClass}>Select platforms</p>
                                <div className="flex flex-wrap gap-2 mb-5">
                                    {SOCIAL_PLATFORMS.map(p => {
                                        const isSelected = !!socialLinks.find(s => s.platform === p.key);
                                        return (
                                            <button
                                                key={p.key}
                                                type="button"
                                                onClick={() => isSelected ? removeSocialLink(p.key) : addSocialLink(p.key)}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-all ${isSelected
                                                    ? 'text-white border-transparent shadow-sm'
                                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                                                    }`}
                                                style={isSelected ? { backgroundColor: p.color, borderColor: p.color } : {}}
                                            >
                                                <span className="text-sm">{p.emoji}</span>
                                                {p.label}
                                                {isSelected && <X className="w-3 h-3 ml-0.5 opacity-80" />}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* URL inputs for selected platforms */}
                                {socialLinks.length > 0 && (
                                    <div className="space-y-3">
                                        <p className={labelClass}>Enter your profile URLs</p>
                                        {socialLinks.map(link => {
                                            const platform = SOCIAL_PLATFORMS.find(p => p.key === link.platform)!;
                                            return (
                                                <div key={link.platform} className="flex items-center gap-3">
                                                    <div
                                                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base shadow-sm"
                                                        style={{ backgroundColor: platform.color + '18', border: `1.5px solid ${platform.color}30` }}
                                                    >
                                                        {platform.emoji}
                                                    </div>
                                                    <input
                                                        type="url"
                                                        value={link.url}
                                                        onChange={e => updateSocialUrl(link.platform, e.target.value)}
                                                        placeholder={platform.placeholder}
                                                        className={`${inputClass} flex-1`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSocialLink(link.platform)}
                                                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center transition-colors flex-shrink-0"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {socialLinks.length === 0 && (
                                    <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                                        <Globe className="w-8 h-8 opacity-20" />
                                        <p className="text-xs font-bold">Click a platform above to add your social links</p>
                                    </div>
                                )}
                                {isFree && (
                                    <PremiumFeatureBanner
                                        title="Premium Feature"
                                        description="Upgrade your plan to add social media links to your listing."
                                    />
                                )}
                            </div>
                        </div>

                        {/* ── Search Keywords ──────────────────────────────── */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <Hash className="w-4 h-4 text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900">Search Keywords</h3>
                                    <p className="text-[11px] text-slate-400 font-medium">Help customers find you · max 20 keywords</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-3 relative">
                                {isFree && (
                                    <PremiumFeatureBanner
                                        title="Search Keywords"
                                        description="Upgrade your plan to add search keywords to your listing."
                                    />
                                )}
                                {/* Tag input box */}
                                <div
                                    onClick={() => keywordInputRef.current?.focus()}
                                    className="min-h-[56px] flex flex-wrap gap-2 cursor-text p-3 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-transparent transition-all"
                                >
                                    {keywords.map(kw => (
                                        <span
                                            key={kw}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs font-black"
                                        >
                                            #{kw}
                                            <button
                                                type="button"
                                                onClick={e => { e.stopPropagation(); removeKeyword(kw); }}
                                                className="w-3.5 h-3.5 rounded-full bg-orange-200 hover:bg-orange-400 flex items-center justify-center transition-colors"
                                            >
                                                <X className="w-2 h-2" />
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        ref={keywordInputRef}
                                        type="text"
                                        value={keywordInput}
                                        onChange={e => setKeywordInput(e.target.value)}
                                        onKeyDown={handleKeywordKeyDown}
                                        onBlur={() => { if (keywordInput.trim()) addKeyword(keywordInput); }}
                                        placeholder={keywords.length === 0 ? 'Type keyword, press Enter or comma to add…' : ''}
                                        className="flex-1 min-w-[160px] bg-transparent outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-300"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium">
                                    Keywords boost your listing to the <strong>top of search results</strong> when customers search for those terms.
                                </p>
                                <p className="text-[11px] text-slate-400">
                                    e.g. <span className="italic">home delivery · open 24 hours · best biryani · bridal makeup · free wifi</span>
                                </p>
                            </div>
                        </div>

                        {/* Summary Preview */}
                        <div className="bg-gradient-to-br from-slate-50 to-orange-50/30 rounded-2xl border border-orange-100 p-6">
                            <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-orange-500" /> Listing Summary
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {[
                                    { label: 'Title', value: formData.title || '—' },
                                    { label: 'Phone', value: formData.phoneNumber ? `${formData.phoneCode}${formData.phoneNumber}` : '—' },
                                    { label: 'City', value: formData.city || '—' },
                                    { label: 'Pincode', value: formData.pincode || '—' },
                                ].map(item => (
                                    <div key={item.label} className="bg-white rounded-xl px-4 py-3 border border-slate-100">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-0.5">{item.label}</p>
                                        <p className="font-bold text-slate-800 truncate">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setActiveStep(2)}
                                className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-base hover:bg-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!formData.description.trim() || formData.description.length < 10) {
                                        setError('Please provide a description with at least 10 characters');
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                        return;
                                    }
                                    setError(null);
                                    setActiveStep(4);
                                }}
                                className="flex-[2] py-4 bg-gradient-to-r from-[#0B2244] to-[#0D2E61] text-white rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2"
                            >
                                Continue to FAQs <HelpCircle className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── STEP 4: FAQs & Publish ── */}
                {activeStep === 4 && (
                    <motion.div
                        key="step4"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <HelpCircle className="w-4 h-4 text-orange-500" />
                                </div>
                                <h3 className="font-black text-slate-900">Frequently Asked Questions</h3>
                            </div>
                            <div className="p-6 space-y-6 relative">
                                {isFree && (
                                    <PremiumFeatureBanner
                                        title="Custom FAQs"
                                        description="Upgrade your plan to add custom FAQs to your listing."
                                    />
                                )}
                                {/* FAQ Form */}
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                    <div className="space-y-2">
                                        <label className={labelClass}>Question</label>
                                        <input
                                            type="text"
                                            value={newFaq.question}
                                            onChange={(e) => setNewFaq(prev => ({ ...prev, question: e.target.value }))}
                                            placeholder="e.g. Do you offer home delivery?"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelClass}>Answer</label>
                                        <textarea
                                            value={newFaq.answer}
                                            onChange={(e) => setNewFaq(prev => ({ ...prev, answer: e.target.value }))}
                                            placeholder="e.g. Yes, we offer free home delivery within 5km radius."
                                            rows={3}
                                            className={`${inputClass} resize-none`}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addFaq}
                                        disabled={!newFaq.question.trim() || !newFaq.answer.trim()}
                                        className="w-full py-3 bg-white border-2 border-orange-500 text-orange-600 rounded-xl font-black text-sm hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="w-4 h-4" /> Add FAQ Item
                                    </button>
                                </div>

                                {/* FAQ List */}
                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {formData.faqs.map((faq, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-slate-200 transition-all group"
                                            >
                                                <div className="flex justify-between gap-4">
                                                    <div className="flex-1 space-y-1">
                                                        <h4 className="text-sm font-black text-slate-900 flex items-start gap-2">
                                                            <span className="text-orange-500">Q.</span> {faq.question}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                            <span className="text-blue-500 font-black">A.</span> {faq.answer}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFaq(idx)}
                                                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {formData.faqs.length === 0 && (
                                        <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                                <HelpCircle className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No FAQs added yet</p>
                                            <p className="text-[10px] text-slate-400 mt-1">Help your customers by answering common questions.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
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

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setActiveStep(3)}
                                className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-base hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !canAddListing || !agreed}
                                className="flex-[2] py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-black text-base hover:shadow-orange-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Publishing Listing...
                                    </>
                                ) : (
                                    <>
                                        <Store className="w-5 h-5" /> Publish Listing
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </form>

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

                        <div className="relative w-full max-w-5xl aspect-video md:aspect-[16/9] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                className="absolute left-0 -translate-x-full md:-translate-x-20 z-[110] w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/10"
                                onClick={prevImage}
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>

                            <motion.div
                                key={currentImageIndex}
                                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="w-full h-full rounded-[20px] overflow-hidden border border-white/10 shadow-2xl"
                            >
                                <img
                                    src={galleryPreviews[currentImageIndex]}
                                    className="w-full h-full object-contain bg-black/50"
                                    alt="Gallery selection"
                                />
                            </motion.div>

                            <button
                                type="button"
                                className="absolute right-0 translate-x-full md:translate-x-20 z-[110] w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/10"
                                onClick={nextImage}
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>

                            {/* Thumbnails Indicator */}
                            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex gap-3">
                                {galleryPreviews.map((_, i) => (
                                    <button
                                        type="button"
                                        key={i}
                                        onClick={() => setCurrentImageIndex(i)}
                                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === currentImageIndex ? 'bg-orange-500 w-8' : 'bg-white/20 hover:bg-white/40'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
