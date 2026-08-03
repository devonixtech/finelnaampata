"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Store, MapPin, Phone, TextQuote, Layers, Sparkles, Plus, Check, Hash, Share2, Globe, MessageSquare, Navigation, ChevronDown, Tag, ImagePlus, HelpCircle, Trash2, Facebook, Instagram, Twitter, Linkedin, Youtube, Music2, Image as ImageIcon, Clock, ArrowUp, ArrowDown } from 'lucide-react';

const getSocialIcon = (key: string, className = "w-5 h-5") => {
    switch(key) {
        case 'facebook': return <Facebook className={className} />;
        case 'instagram': return <Instagram className={className} />;
        case 'twitter': return <Twitter className={className} />;
        case 'linkedin': return <Linkedin className={className} />;
        case 'youtube': return <Youtube className={className} />;
        case 'tiktok': return <Music2 className={className} />;
        case 'pinterest': return <ImageIcon className={className} />;
        case 'snapchat': return <MessageSquare className={className} />;
        default: return null;
    }
};
import { api, getImageUrl } from '../../lib/api';
import { Business, Category, City } from "../../types/api";
import { SearchableSelect } from "../ui/SearchableSelect";
import { motion, AnimatePresence } from 'framer-motion';
import CategorySearchSelect from '../CategorySearchSelect';
import { useAuth } from '../../context/AuthContext';
import { usePlanFeature } from '../../hooks/usePlanFeature';
import { useAddressConfig, fetchCountries } from '../../hooks/useAddressConfig';
import { detectLocationForUi, sortAndDedupeCities, sortAndDedupeCountries } from '../../lib/location-detect';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const DraggablePinMap = dynamic(() => import('../DraggablePinMap'), { ssr: false });

const SOCIAL_PLATFORMS = [
    { key: 'facebook', label: 'Facebook', emoji: '📘', color: '#1877F2', placeholder: 'https://facebook.com/yourbusiness' },
    { key: 'instagram', label: 'Instagram', emoji: '📸', color: '#E1306C', placeholder: 'https://instagram.com/yourbusiness' },
    { key: 'twitter', label: 'Twitter / X', emoji: '🐦', color: '#1DA1F2', placeholder: 'https://twitter.com/yourbusiness' },
    { key: 'linkedin', label: 'LinkedIn', emoji: '💼', color: '#0A66C2', placeholder: 'https://linkedin.com/company/yourbusiness' },
    { key: 'youtube', label: 'YouTube', emoji: '▶️', color: '#FF0000', placeholder: 'https://youtube.com/@yourbusiness' },
];

interface AddBusinessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    business?: Business | null;
}

const TABS = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'hours', label: 'Hours', icon: Clock },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'media', label: 'Media & Amenities', icon: ImagePlus },
    { id: 'albums', label: 'Albums', icon: ImageIcon },
    { id: 'social', label: 'Contact & Social', icon: Share2 },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle },
];

export default function AddBusinessModal({ isOpen, onClose, onSuccess, business }: AddBusinessModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('general');
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        categoryId: '',
        subCategoryIds: [] as string[],
        description: '',
        phone: '',
        whatsapp: '',
        website: '',
        namedPhoneNumbers: [] as { label: string; number: string }[],
        country: '',
        address: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        latitude: 40.7128,
        longitude: -74.0060,
        coverImageUrl: '',
        logoUrl: '',
        images: [] as string[],
        imageCaptions: {} as Record<string, string>,
        albums: [] as { name: string; description: string; images: string[] }[],
        amenityIds: [] as string[],
        metaKeywords: '',
        hasOffer: false,
        offerTitle: '',
        offerDescription: '',
        offerBadge: '',
        offerExpiresAt: '',
        offerBannerUrl: '',
        faqs: [] as { question: string; answer: string }[],
        contactPersonPrefix: 'Mr.',
        contactPersonName: '',
        tagline: '',
        yearEstablished: '',
        businessHours: [
            { dayOfWeek: 'Monday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { dayOfWeek: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { dayOfWeek: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { dayOfWeek: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { dayOfWeek: 'Friday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { dayOfWeek: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { dayOfWeek: 'Sunday', isOpen: false, openTime: '09:00', closeTime: '18:00' },
        ] as { dayOfWeek: string; isOpen: boolean; openTime: string; closeTime: string }[],
    });

    const { config: addressConfig, validatePostalCode } = useAddressConfig(formData.country || null);

    const activeSub = user?.vendor?.subscriptions?.find((sub: any) => sub.status === 'active');
    const { getFeatureValue, planName, isFree } = usePlanFeature();
    const maxListings = Math.max(1, Number(getFeatureValue('maxListings') || 1));
    const maxKeywords = Number(getFeatureValue('maxKeywords') || 0);
    const maxFaqs = Number(getFeatureValue('maxFaqs') || 0);
    const maxNamedPhoneNumbers = getFeatureValue('maxNamedPhoneNumbers') || 0;
    const maxImages = isFree ? 3 : 999;
    
    const [myListingsCount, setMyListingsCount] = useState<number | null>(null);
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const canUseKeywords = maxKeywords > 0 || isAdmin;
    const canUseFaqs = maxFaqs > 0 || isAdmin;
    const canAddListing = isAdmin || (myListingsCount !== null && myListingsCount < maxListings);

    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [galleryUploading, setGalleryUploading] = useState(false);
    const [existingAddresses, setExistingAddresses] = useState<string[]>([]);
    const [addressSuggestions, setAddressSuggestions] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
    const [addressSuggestionsLoading, setAddressSuggestionsLoading] = useState(false);
    const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [locationSearchQuery, setLocationSearchQuery] = useState('');
    const [locationSearchResults, setLocationSearchResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
    const [locationSearchLoading, setLocationSearchLoading] = useState(false);
    const [reverseGeocodedAddress, setReverseGeocodedAddress] = useState('');
    const locationSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [logoUploading, setLogoUploading] = useState(false);
    const [albumImageUploading, setAlbumImageUploading] = useState<number | null>(null);

    // Keywords tag state
    const [keywords, setKeywords] = useState<string[]>([]);
    const [keywordInput, setKeywordInput] = useState('');
    const keywordInputRef = useRef<HTMLInputElement>(null);

    const addKeyword = (raw: string) => {
        const tag = raw.trim().toLowerCase().replace(/[,]+$/, '');
        if (tag && !keywords.includes(tag)) {
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

    const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);
    const canManageNamedPhones = (maxNamedPhoneNumbers || 0) > 0 || isAdmin;

    const addNamedPhone = () => {
        if (!canManageNamedPhones) return;
        setFormData(prev => {
            if (prev.namedPhoneNumbers.length >= maxNamedPhoneNumbers) return prev;
            return { ...prev, namedPhoneNumbers: [...prev.namedPhoneNumbers, { label: '', number: '' }] };
        });
    };

    const updateNamedPhone = (index: number, key: 'label' | 'number', value: string) => {
        setFormData(prev => {
            const next = [...prev.namedPhoneNumbers];
            if (!next[index]) return prev;
            next[index] = { ...next[index], [key]: key === 'label' ? value.slice(0, 50) : value };
            return { ...prev, namedPhoneNumbers: next };
        });
    };

    const removeNamedPhone = (index: number) => {
        setFormData(prev => ({
            ...prev,
            namedPhoneNumbers: prev.namedPhoneNumbers.filter((_, i) => i !== index),
        }));
    };

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

    const [amenities, setAmenities] = useState<any[]>([]);
    const [amenitiesLoading, setAmenitiesLoading] = useState(false);
    const [showAddAmenity, setShowAddAmenity] = useState(false);
    const [newAmenityName, setNewAmenityName] = useState('');
    const [creatingAmenity, setCreatingAmenity] = useState(false);

    const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

    const addFaq = () => {
        if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
        setFormData(prev => ({
            ...prev,
            faqs: [...(prev.faqs || []), newFaq]
        }));
        setNewFaq({ question: '', answer: '' });
    };

    const removeFaq = (index: number) => {
        setFormData(prev => ({
            ...prev,
            faqs: (prev.faqs || []).filter((_, i) => i !== index)
        }));
    };

    const formDataRef = useRef(formData);

    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    const updateLocationFromCoords = async (lat: number, lng: number) => {
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    };

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                { headers: { 'User-Agent': 'BusinessDirectory/1.0' } }
            );
            const data = await res.json();
            if (data?.display_name) {
                setReverseGeocodedAddress(data.display_name);
            }
        } catch {
            setReverseGeocodedAddress('');
        }
    };

    const fetchLocationSearchResults = (query: string) => {
        if (locationSearchDebounceRef.current) clearTimeout(locationSearchDebounceRef.current);
        if (!query || query.length < 3) {
            setLocationSearchResults([]);
            setLocationSearchLoading(false);
            return;
        }
        setLocationSearchLoading(true);
        locationSearchDebounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
                    { headers: { 'User-Agent': 'BusinessDirectory/1.0' } }
                );
                const data = await res.json();
                setLocationSearchResults(data);
            } catch {
                setLocationSearchResults([]);
            } finally {
                setLocationSearchLoading(false);
            }
        }, 400);
    };

    const selectLocationSearchResult = (result: { display_name: string; lat: string; lon: string }) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setFormData(prev => ({
            ...prev,
            address: result.display_name,
            latitude: lat,
            longitude: lng,
        }));
        setLocationSearchResults([]);
        setLocationSearchQuery('');
        reverseGeocode(lat, lng);
    };

    const handleGetCurrentLocation = async () => {
        try {
            const coords = await detectLocationForUi();
            if (!coords) return;
            await updateLocationFromCoords(coords.latitude, coords.longitude);
            reverseGeocode(coords.latitude, coords.longitude);
        } catch (error) {
            console.error("Error getting location:", error);
        }
    };

    useEffect(() => {
        return () => {
            if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
            if (locationSearchDebounceRef.current) clearTimeout(locationSearchDebounceRef.current);
        };
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [cats, cityList, countryList, amenityList, vendorProfile, businessesRes] = await Promise.all([
                    api.categories.getAll({ includeSubcategories: true }),
                    api.cities.getAll(),
                    api.cities.getCountries().catch(() => []),
                    api.listings.getAmenities(),
                    api.businessProfiles.getProfile().catch(() => null),
                    api.listings.getMyListings()
                ]);
                setCategories(cats);
                const uniqueCities = sortAndDedupeCities(Array.isArray(cityList) ? cityList : []);
                setCities(uniqueCities);
                const countriesFromApi = await fetchCountries();
                const fallbackCountries = sortAndDedupeCountries(
                    (countryList || []).filter(Boolean).map((c: string) => ({ code: c, name: c })),
                );
                const normalizedCountries = sortAndDedupeCountries(
                    countriesFromApi.length > 0 ? countriesFromApi : fallbackCountries,
                );
                setCountries(normalizedCountries);
                setAmenities(amenityList || []);
                setMyListingsCount(businessesRes?.data?.length || 0);

                const allBusinesses = businessesRes?.data || [];
                const addrSet = new Set<string>();
                allBusinesses.forEach((b: any) => {
                    if (b.address) addrSet.add(b.address);
                });
                setExistingAddresses(Array.from(addrSet).slice(0, 20));

                if (vendorProfile?.socialLinks) {
                    setSocialLinks(Array.isArray(vendorProfile.socialLinks) ? vendorProfile.socialLinks : []);
                }

                if (!business) {
                    setFormData(prev => ({
                        ...prev,
                        categoryId: cats[0]?.id || '',
                        city: uniqueCities[0]?.name || ''
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch initial data:', err);
            }
        };
        if (isOpen) fetchInitialData();
    }, [isOpen, business]);

    useEffect(() => {
        if (business && isOpen) {
            const initialAmenityIds = ((business as any).businessAmenities || []).map((ba: any) => {
                const id = ba.amenityId || ba.amenity?.id;
                return id ? String(id) : '';
            }).filter((id: string) => id !== '');

            console.log("[AddBusinessModal] Initial Mapping Amenities:", {
                businessAmenities: (business as any).businessAmenities,
                mappedIds: initialAmenityIds
            });

                setFormData({
                title: business.title || '',
                categoryId: business.category?.id || '',
                subCategoryIds: business.subcategories?.map((sc: any) => sc.id) || [],
                description: business.description || '',
                phone: business.phone || '',
                whatsapp: business.whatsapp || '',
                    website: business.website || '',
                    country: (business as any).country || '',
                    address: business.address || '',
                    addressLine2: (business as any).addressLine2 || '',
                    city: business.city || '',
                state: business.state || '',
                pincode: business.pincode || '',
                latitude: Number(business.latitude) || 40.7128,
                longitude: Number(business.longitude) || -74.0060,
                coverImageUrl: business.coverImageUrl || '',
                logoUrl: business.logoUrl || '',
                images: business.images || [],
                imageCaptions: business.imageCaptions || {},
                albums: (business.albums || []).map((a: any) => ({
                    name: a.name || '',
                    description: a.description || '',
                    images: (a.images || []).map((i: any) => i.url || i),
                })),
                amenityIds: initialAmenityIds,
                metaKeywords: business.metaKeywords || '',
                hasOffer: business.hasOffer || false,
                offerTitle: business.offerTitle || '',
                offerDescription: business.offerDescription || '',
                offerBadge: business.offerBadge || '',
                offerExpiresAt: (() => {
                    try {
                        return business.offerExpiresAt ? new Date(business.offerExpiresAt).toISOString().split('T')[0] : '';
                    } catch (e) {
                        console.error("Invalid date for offerExpiresAt:", business.offerExpiresAt);
                        return '';
                    }
                })(),
                offerBannerUrl: business.offerBannerUrl || '',
                faqs: (business.faqs || []).filter(f => f && f.question && f.answer)
                ,
                namedPhoneNumbers: (business as any).namedPhoneNumbers || [],
                contactPersonPrefix: (business as any).contactPersonPrefix || 'Mr.',
                contactPersonName: (business as any).contactPersonName || '',
                tagline: (business as any).tagline || '',
                yearEstablished: (business as any).yearEstablished ? String((business as any).yearEstablished) : '',
                businessHours: (business.businessHours && business.businessHours.length > 0)
                    ? business.businessHours.map((h: any) => ({
                        dayOfWeek: h.dayOfWeek || '',
                        isOpen: h.isOpen ?? true,
                        openTime: h.openTime || '09:00',
                        closeTime: h.closeTime || '18:00',
                    }))
                    : [
                        { dayOfWeek: 'Monday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
                        { dayOfWeek: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
                        { dayOfWeek: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
                        { dayOfWeek: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
                        { dayOfWeek: 'Friday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
                        { dayOfWeek: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
                        { dayOfWeek: 'Sunday', isOpen: false, openTime: '09:00', closeTime: '18:00' },
                    ],
            });
            // Pre-fill gallery previews
            setGalleryPreviews(business.images || []);
            // Pre-fill keyword pills from saved metaKeywords
            const saved = ((business as any).metaKeywords || '').split(',').map((k: string) => k.trim()).filter(Boolean);
            setKeywords(saved);

            // Pre-fill social links from vendor profile if available (fallback, usually fetchInitialData handles it)
            if (business.vendor?.socialLinks) {
                setSocialLinks(Array.isArray(business.vendor.socialLinks) ? business.vendor.socialLinks : []);
            }
        } else if (!business && isOpen && cities.length > 0 && categories.length > 0) {
            setFormData(prev => ({
                ...prev,
                categoryId: categories[0]?.id || '',
                city: cities[0]?.name || ''
            }));
            setKeywords([]);
        }
    }, [business, isOpen, categories, cities]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreedToTerms) {
            setError('Please confirm that the business details are accurate and you agree to the Terms & Privacy Policy.');
            setActiveTab('general');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Handle empty strings for optional URL/Email fields (send null to clear them in backend)
            const submissionData = { ...formData };
            const fieldsToPrune: string[] = ['coverImageUrl', 'website', 'metaKeywords', 'whatsapp', 'offerExpiresAt', 'description', 'shortDescription'];
            fieldsToPrune.forEach(field => {
                const val = (submissionData as any)[field];
                if (val === '' || (typeof val === 'string' && val.includes('NaN'))) {
                    (submissionData as any)[field] = null;
                }
            });

            // Filter out empty FAQs
            submissionData.faqs = (submissionData.faqs || []).filter(f => f.question.trim() && f.answer.trim());
            submissionData.namedPhoneNumbers = (submissionData.namedPhoneNumbers || [])
                .map((p: any) => ({ label: String(p.label || '').trim(), number: String(p.number || '').trim() }))
                .filter((p: any) => p.label && p.number);
            (submissionData as any).contactPersonPrefix = submissionData.contactPersonPrefix || 'Mr.';
            (submissionData as any).contactPersonName = submissionData.contactPersonName || '';
            (submissionData as any).logoUrl = submissionData.logoUrl || null;
            (submissionData as any).imageCaptions = submissionData.imageCaptions || {};
            (submissionData as any).albums = (submissionData.albums || []).map((a: any) => ({
                name: a.name,
                description: a.description,
                images: a.images || [],
            }));
            (submissionData as any).businessHours = (submissionData.businessHours || []).map((h: any) => ({
                dayOfWeek: h.dayOfWeek,
                isOpen: h.isOpen,
                openTime: h.openTime,
                closeTime: h.closeTime,
            }));
            console.log("[AddBusinessModal] Submitting data:", submissionData);
        
            try {
                if (business) {
                    await api.listings.update(business.id, submissionData);
                    console.log("[AddBusinessModal] Update success");
                } else {
                    await api.listings.create(submissionData);
                }
            } catch (err) {
                console.error("[AddBusinessModal] Submission error:", err);
                throw err;
            }

            // Save social links to vendor profile
            const linksToSave = (Array.isArray(socialLinks) ? socialLinks : []).filter(s => s.url?.trim());
            try {
                await api.businessProfiles.updateProfile({ socialLinks: linksToSave });
            } catch (socialErr) {
                console.error('Failed to update social links:', socialErr);
                // Don't block the main flow if social links fail
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || `Failed to ${business ? 'update' : 'create'} listing`);
        } finally {
            setLoading(false);
        }
    };

    const fetchAddressSuggestions = (query: string) => {
        if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
        if (!query || query.length < 3) {
            setAddressSuggestions([]);
            setAddressSuggestionsLoading(false);
            return;
        }
        setAddressSuggestionsLoading(true);
        addressDebounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
                    { headers: { 'User-Agent': 'BusinessDirectory/1.0' } }
                );
                const data = await res.json();
                setAddressSuggestions(data);
            } catch {
                setAddressSuggestions([]);
            } finally {
                setAddressSuggestionsLoading(false);
            }
        }, 400);
    };

    const selectAddressSuggestion = (suggestion: { display_name: string; lat: string; lon: string }) => {
        setFormData(prev => ({
            ...prev,
            address: suggestion.display_name,
            latitude: parseFloat(suggestion.lat),
            longitude: parseFloat(suggestion.lon),
        }));
        setAddressSuggestions([]);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'latitude' || name === 'longitude' ? parseFloat(value) : value
        }));
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

            // Parallelized upload using Promise.all
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
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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

    const toggleAmenity = (id: string) => {
        setFormData(prev => {
            const targetId = String(id);
            const exists = prev.amenityIds.some(aid => String(aid) === targetId);
            if (exists) {
                return { ...prev, amenityIds: prev.amenityIds.filter(a => String(a) !== targetId) };
            }
            return { ...prev, amenityIds: [...prev.amenityIds, targetId] };
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

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoUploading(true);
        setError(null);
        try {
            const response = await api.listings.uploadImage(file);
            setFormData(prev => ({ ...prev, logoUrl: response.url }));
        } catch (err: any) {
            setError(err.message || 'Failed to upload logo');
        } finally {
            setLogoUploading(false);
        }
    };

    const updateBusinessHours = (index: number, field: string, value: any) => {
        setFormData(prev => {
            const next = [...prev.businessHours];
            next[index] = { ...next[index], [field]: value };
            return { ...prev, businessHours: next };
        });
    };

    const updateImageCaption = (imageUrl: string, caption: string) => {
        setFormData(prev => ({
            ...prev,
            imageCaptions: { ...prev.imageCaptions, [imageUrl]: caption },
        }));
    };

    const addAlbum = () => {
        setFormData(prev => ({
            ...prev,
            albums: [...prev.albums, { name: '', description: '', images: [] }],
        }));
    };

    const updateAlbum = (index: number, field: string, value: string) => {
        setFormData(prev => {
            const next = [...prev.albums];
            next[index] = { ...next[index], [field]: value };
            return { ...prev, albums: next };
        });
    };

    const removeAlbum = (index: number) => {
        setFormData(prev => ({
            ...prev,
            albums: prev.albums.filter((_, i) => i !== index),
        }));
    };

    const addAlbumImage = async (albumIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAlbumImageUploading(albumIndex);
        try {
            const response = await api.listings.uploadImage(file);
            setFormData(prev => {
                const next = [...prev.albums];
                next[albumIndex] = { ...next[albumIndex], images: [...next[albumIndex].images, response.url] };
                return { ...prev, albums: next };
            });
        } catch (err: any) {
            setError(err.message || 'Failed to upload album image');
        } finally {
            setAlbumImageUploading(null);
        }
    };

    const removeAlbumImage = (albumIndex: number, imageIndex: number) => {
        setFormData(prev => {
            const next = [...prev.albums];
            next[albumIndex] = { ...next[albumIndex], images: next[albumIndex].images.filter((_, i) => i !== imageIndex) };
            return { ...prev, albums: next };
        });
    };

    const moveAlbumImage = (albumIndex: number, imageIndex: number, direction: -1 | 1) => {
        setFormData(prev => {
            const next = [...prev.albums];
            const imgs = [...next[albumIndex].images];
            const targetIdx = imageIndex + direction;
            if (targetIdx < 0 || targetIdx >= imgs.length) return prev;
            [imgs[imageIndex], imgs[targetIdx]] = [imgs[targetIdx], imgs[imageIndex]];
            next[albumIndex] = { ...next[albumIndex], images: imgs };
            return { ...prev, albums: next };
        });
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div key="add-business-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-white rounded-[16px] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-premium relative flex flex-col border border-white/20"
                        >
                            {/* Header */}
                            <div className="p-8 pb-4 border-b border-slate-100 flex items-center justify-between relative overflow-hidden bg-slate-50/50">
                                <div className="relative z-10">
                                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                                            <Store className="w-5 h-5" />
                                        </div>
                                        {business ? 'Edit Business' : 'Add New Listing'}
                                    </h2>
                                    {business && <p className="text-slate-500 font-bold text-xs mt-1 ml-13 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        {business.title}
                                    </p>}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="relative z-10 p-2 hover:bg-white rounded-xl transition-all group active:scale-95 shadow-sm border border-transparent hover:border-slate-200"
                                >
                                    <X className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                </button>
                            </div>

                            {/* Tabs Navigation */}
                            <div className="flex items-center gap-1 px-8 py-3 bg-white border-b border-slate-100 overflow-x-auto no-scrollbar">
                                {TABS.map(tab => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${isActive
                                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 active:scale-95'
                                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Form Body */}
                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                                <div className="p-8 space-y-8 flex-1">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-black flex items-center gap-3 shadow-sm"
                                        >
                                            <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                                                <X className="w-3.5 h-3.5" />
                                            </div>
                                            {error}
                                        </motion.div>
                                    )}

                                    {/* Limit Gate for NEW listings */}
                                    {!business && !canAddListing && myListingsCount !== null && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden mb-8"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                            <div className="relative z-10 flex flex-col items-center text-center">
                                                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
                                                    <Lock className="w-8 h-8 text-orange-500" />
                                                </div>
                                                <h3 className="text-xl font-black text-white mb-2">Limit Reached</h3>
                                                <p className="text-slate-400 text-sm font-bold mb-6 italic leading-relaxed">
                                                    Your <span className="text-orange-400 font-black">{planName}</span> plan allows for <span className="text-white">{maxListings}</span> business listing{maxListings > 1 ? 's' : ''}. 
                                                    Please upgrade your plan to increase this limit.
                                                </p>
                                                <Link
                                                    href="/subscription"
                                                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
                                                >
                                                    Upgrade Plan Now
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}

                                    <AnimatePresence mode="wait">
                                        {activeTab === 'general' && (
                                            <motion.div
                                                key="general"
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="space-y-6"
                                            >
                                                <div className="space-y-4">
                                                    <div className="space-y-2.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Business Title</label>
                                                        <div className="relative group">
                                                            <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                                            <input
                                                                required
                                                                name="title"
                                                                value={formData.title}
                                                                onChange={handleChange}
                                                                placeholder="Enter business name..."
                                                                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all shadow-sm"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tagline</label>
                                                        <div className="relative group">
                                                            <TextQuote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                                            <input
                                                                name="tagline"
                                                                value={formData.tagline}
                                                                onChange={handleChange}
                                                                placeholder="A short catchy tagline..."
                                                                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all shadow-sm"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2.5">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contact Person</label>
                                                            <div className="flex gap-2">
                                                                <select
                                                                    value={formData.contactPersonPrefix}
                                                                    onChange={(e) => setFormData(prev => ({ ...prev, contactPersonPrefix: e.target.value }))}
                                                                    className="w-24 px-2 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all shadow-sm"
                                                                >
                                                                    <option value="Mr.">Mr.</option>
                                                                    <option value="Ms.">Ms.</option>
                                                                    <option value="Mrs.">Mrs.</option>
                                                                    <option value="Dr.">Dr.</option>
                                                                </select>
                                                                <input
                                                                    name="contactPersonName"
                                                                    value={formData.contactPersonName}
                                                                    onChange={handleChange}
                                                                    placeholder="Contact person name..."
                                                                    className="flex-1 px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all shadow-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2.5">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Year Established</label>
                                                            <div className="relative group">
                                                                <input
                                                                    name="yearEstablished"
                                                                    type="number"
                                                                    min="1800"
                                                                    max={new Date().getFullYear()}
                                                                    value={formData.yearEstablished}
                                                                    onChange={handleChange}
                                                                    placeholder="e.g. 2015"
                                                                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all shadow-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                                                        <CategorySearchSelect
                                                            categories={categories}
                                                            value={formData.categoryId}
                                                            onChange={(val) => setFormData(prev => ({ ...prev, categoryId: val }))}
                                                            loading={false}
                                                        />
                                                    </div>

                                                    {/* Subcategories */}
                                                    {(() => {
                                                        const maxSubCategories = Number(getFeatureValue('maxSubCategories') || 0);
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
                                                                                    <div className="relative z-50">
                                                                                        <SearchableSelect
                                                                                            value={formData.subCategoryIds[i] || ''}
                                                                                            onChange={val => {
                                                                                                const newSubs = [...formData.subCategoryIds];
                                                                                                if (val) {
                                                                                                    newSubs[i] = val as string;
                                                                                                } else {
                                                                                                    newSubs.splice(i, 1);
                                                                                                }
                                                                                                setFormData(prev => ({ ...prev, subCategoryIds: newSubs.filter(Boolean) }));
                                                                                            }}
                                                                                            options={[
                                                                                                { label: '-- Optional --', value: '' },
                                                                                                ...relatedSubcategories
                                                                                                    .filter(sub => !(formData.subCategoryIds.includes(sub.id) && formData.subCategoryIds[i] !== sub.id))
                                                                                                    .map(sub => ({
                                                                                                        label: sub.name,
                                                                                                        value: sub.id
                                                                                                    }))
                                                                                            ]}
                                                                                        />
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

                                                    <div className="space-y-2.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Short Description</label>
                                                        <div className="relative group">
                                                            <TextQuote className="absolute left-4 top-5 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                                            <textarea
                                                                required
                                                                name="description"
                                                                value={formData.description}
                                                                onChange={handleChange}
                                                                rows={6}
                                                                placeholder="Tell us about your business..."
                                                                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all shadow-sm resize-none leading-relaxed"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center justify-between">
                                                            Logo
                                                            <span className="text-[9px] text-slate-300 normal-case tracking-normal">Square image recommended</span>
                                                        </label>
                                                        <div className="flex gap-4 items-start">
                                                            {formData.logoUrl && (
                                                                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-100 flex-shrink-0 group">
                                                                    <img src={getImageUrl(formData.logoUrl) || ""} className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))} className="p-1 bg-red-500 rounded-full text-white"><X className="w-3 h-3" /></button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <label className={`flex-1 flex flex-col items-center justify-center h-20 border-2 border-dashed rounded-2xl transition-all ${logoUploading ? 'cursor-not-allowed bg-slate-50 opacity-70 border-slate-200' : 'cursor-pointer'} ${formData.logoUrl && !logoUploading ? 'bg-slate-50/50 border-slate-200' : 'bg-orange-50/30 border-orange-200 hover:bg-orange-50/50'}`}>
                                                                <input type="file" accept="image/*" disabled={logoUploading} onChange={handleLogoUpload} className="hidden" />
                                                                {logoUploading ? (
                                                                    <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                                                                ) : (
                                                                    <div className="flex items-center gap-2 text-slate-400">
                                                                        <ImagePlus className="w-4 h-4 text-orange-500" />
                                                                        <span className="text-[10px] font-black uppercase text-slate-500">{formData.logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                                                                    </div>
                                                                )}
                                                            </label>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center justify-between">
                                                            Cover Image
                                                            <span className="text-[9px] text-slate-300 normal-case tracking-normal">Best for first impressions</span>
                                                        </label>
                                                        <div className="flex gap-4 items-start">
                                                            {formData.coverImageUrl && (
                                                                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-100 flex-shrink-0 group">
                                                                    <img src={getImageUrl(formData.coverImageUrl) || ""} className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <label className="cursor-pointer">
                                                                            <ImagePlus className="w-5 h-5 text-white" />
                                                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <label className={`flex-1 flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-2xl transition-all ${loading ? 'cursor-not-allowed bg-slate-50 opacity-70 border-slate-200' : 'cursor-pointer'} ${formData.coverImageUrl && !loading ? 'bg-slate-50/50 border-slate-200' : 'bg-orange-50/30 border-orange-200 hover:bg-orange-50/50'}`}>
                                                                <input type="file" accept="image/*" disabled={loading} onChange={handleImageUpload} className="hidden" />
                                                                <div className="flex flex-col items-center gap-2 text-slate-400 group">
                                                                    {loading ? (
                                                                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                                                                    ) : (
                                                                        <>
                                                                            <div className="p-3 rounded-xl bg-white border border-slate-100 text-orange-500 shadow-sm group-hover:scale-110 transition-transform">
                                                                                <ImagePlus className="w-4 h-4" />
                                                                            </div>
                                                                            <p className="text-[10px] font-black uppercase text-slate-500 mt-1">
                                                                                {formData.coverImageUrl ? 'Change Cover' : 'Upload Cover Photo'}
                                                                            </p>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </label>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-500 ml-1">
                                                            Recommended size: 1200 x 675 px (16:9), PNG/JPG, max 5 MB.
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                        {activeTab === 'hours' && (
                                            <motion.div key="hours" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Business Hours</label>
                                                    <p className="text-[9px] text-slate-400 font-bold ml-1 uppercase tracking-wider">Set your operating hours for each day of the week.</p>
                                                </div>
                                                <div className="space-y-3">
                                                    {formData.businessHours.map((day, idx) => (
                                                        <div key={day.dayOfWeek} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${day.isOpen ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                                            <label className="flex items-center gap-2 cursor-pointer min-w-[120px]">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={day.isOpen}
                                                                    onChange={(e) => updateBusinessHours(idx, 'isOpen', e.target.checked)}
                                                                    className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                                                                />
                                                                <span className="text-sm font-bold text-slate-700">{day.dayOfWeek}</span>
                                                            </label>
                                                            {day.isOpen ? (
                                                                <div className="flex items-center gap-2 flex-1">
                                                                    <input
                                                                        type="time"
                                                                        value={day.openTime}
                                                                        onChange={(e) => updateBusinessHours(idx, 'openTime', e.target.value)}
                                                                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                                    />
                                                                    <span className="text-xs font-bold text-slate-400">to</span>
                                                                    <input
                                                                        type="time"
                                                                        value={day.closeTime}
                                                                        onChange={(e) => updateBusinessHours(idx, 'closeTime', e.target.value)}
                                                                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs font-bold text-slate-400 italic">Closed</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const allOpen = formData.businessHours.every(d => d.isOpen);
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                businessHours: prev.businessHours.map(d => ({ ...d, isOpen: !allOpen })),
                                                            }));
                                                        }}
                                                        className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors"
                                                    >
                                                        {formData.businessHours.every(d => d.isOpen) ? 'Close All Days' : 'Open All Days'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                businessHours: prev.businessHours.map(d => ({ ...d, openTime: '09:00', closeTime: '18:00' })),
                                                            }));
                                                        }}
                                                        className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors"
                                                    >
                                                        Reset to 9:00–18:00
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                        {activeTab === 'location' && (
                                            <motion.div key="location" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Country <span className="text-red-500">*</span></label>
                                                        <div className="relative z-40">
                                                            <SearchableSelect
                                                                value={formData.country}
                                                                onChange={val => setFormData(prev => ({ ...prev, country: val as string, city: '', state: '' }))}
                                                                options={[
                                                                    ...countries.map(c => ({ label: c.name, value: c.code }))
                                                                ]}
                                                                placeholder="Select a country..."
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                                            {addressConfig.locality.label} {addressConfig.locality.required && <span className="text-red-500">*</span>}
                                                        </label>
                                                        <input
                                                            required={addressConfig.locality.required}
                                                            list="city-list"
                                                            name="city"
                                                            value={formData.city}
                                                            onChange={handleChange}
                                                            placeholder={`Enter ${addressConfig.locality.label.toLowerCase()}`}
                                                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all shadow-sm"
                                                        />
                                                        <datalist id="city-list">
                                                            {cities
                                                                .filter(c => !formData.country || (c.country || '').toLowerCase() === formData.country.toLowerCase())
                                                                .sort((a, b) => a.name.localeCompare(b.name))
                                                                .map(city => (<option key={city.id} value={city.name} />))}
                                                        </datalist>
                                                    </div>
                                                    {addressConfig.administrativeArea.used && (
                                                        <div className="space-y-2.5">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                                                {addressConfig.administrativeArea.label} {addressConfig.administrativeArea.required && <span className="text-red-500">*</span>}
                                                            </label>
                                                            {addressConfig.administrativeArea.options && addressConfig.administrativeArea.options.length > 0 ? (
                                                                <div className="relative z-30">
                                                                    <SearchableSelect
                                                                        value={formData.state}
                                                                        onChange={val => handleChange({ target: { name: 'state', value: val } } as any)}
                                                                        options={[
                                                                            ...addressConfig.administrativeArea.options.map(opt => ({ label: opt.name, value: opt.code }))
                                                                        ]}
                                                                        placeholder={`Select ${addressConfig.administrativeArea.label}...`}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <input
                                                                    required={addressConfig.administrativeArea.required}
                                                                    name="state"
                                                                    value={formData.state}
                                                                    onChange={handleChange}
                                                                    placeholder={addressConfig.administrativeArea.label}
                                                                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all shadow-sm"
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Street Address <span className="text-red-500">*</span></label>
                                                        <button
                                                            type="button"
                                                            onClick={handleGetCurrentLocation}
                                                            className="flex items-center gap-1.5 text-[9px] font-black text-orange-600 uppercase tracking-widest hover:text-orange-700 transition-colors"
                                                        >
                                                            <MapPin className="w-3 h-3" /> Get Current Location
                                                        </button>
                                                    </div>
                                                    <div className="relative group">
                                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                                        <input
                                                            required
                                                            name="address"
                                                            value={formData.address}
                                                            onChange={(e) => {
                                                                handleChange(e);
                                                                fetchAddressSuggestions(e.target.value);
                                                            }}
                                                            onBlur={() => setTimeout(() => setAddressSuggestions([]), 200)}
                                                            placeholder="Street address..."
                                                            className="w-full pl-11 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all shadow-sm"
                                                        />
                                                        {(addressSuggestions.length > 0 || addressSuggestionsLoading) && (
                                                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                                                                {addressSuggestionsLoading ? (
                                                                    <div className="px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                                                                        <Loader2 className="w-3 h-3 animate-spin" /> Searching...
                                                                    </div>
                                                                ) : (
                                                                    addressSuggestions.map((s, i) => (
                                                                        <button
                                                                            key={i}
                                                                            type="button"
                                                                            onMouseDown={(e) => {
                                                                                e.preventDefault();
                                                                                selectAddressSuggestion(s);
                                                                            }}
                                                                            className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-orange-50 transition-colors border-b border-slate-50 last:border-0"
                                                                        >
                                                                            {s.display_name}
                                                                        </button>
                                                                    ))
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-2.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Street Address Line 2 (Optional)</label>
                                                    <input
                                                        name="addressLine2"
                                                        value={(formData as any).addressLine2 || ''}
                                                        onChange={handleChange}
                                                        placeholder="Apartment, suite, unit, building, floor, etc."
                                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all shadow-sm"
                                                    />
                                                </div>

                                                {addressConfig.postalCode.used && (
                                                    <div className="space-y-2.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                                            {addressConfig.postalCode.label} {addressConfig.postalCode.required ? <span className="text-red-500">*</span> : '(Optional)'}
                                                        </label>
                                                        <input
                                                            name="pincode"
                                                            required={addressConfig.postalCode.required}
                                                            value={formData.pincode}
                                                            onChange={handleChange}
                                                            placeholder={addressConfig.postalCode.label}
                                                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all shadow-sm"
                                                        />
                                                        {formData.pincode && !validatePostalCode(formData.pincode) && (
                                                            <p className="text-xs text-red-500 font-bold ml-1">Invalid {addressConfig.postalCode.label} format for this country.</p>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="space-y-2.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Search Location</label>
                                                    <div className="relative group">
                                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                                        <input
                                                            type="text"
                                                            value={locationSearchQuery}
                                                            onChange={(e) => {
                                                                setLocationSearchQuery(e.target.value);
                                                                fetchLocationSearchResults(e.target.value);
                                                            }}
                                                            onBlur={() => setTimeout(() => setLocationSearchResults([]), 200)}
                                                            placeholder="Search for a place (e.g. Eiffel Tower, New York)..."
                                                            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all shadow-sm"
                                                        />
                                                        {(locationSearchResults.length > 0 || locationSearchLoading) && (
                                                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                                                                {locationSearchLoading ? (
                                                                    <div className="px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                                                                        <Loader2 className="w-3 h-3 animate-spin" /> Searching...
                                                                    </div>
                                                                ) : (
                                                                    locationSearchResults.map((s, i) => (
                                                                        <button
                                                                            key={i}
                                                                            type="button"
                                                                            onMouseDown={(e) => {
                                                                                e.preventDefault();
                                                                                selectLocationSearchResult(s);
                                                                            }}
                                                                            className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-orange-50 transition-colors border-b border-slate-50 last:border-0"
                                                                        >
                                                                            {s.display_name}
                                                                        </button>
                                                                    ))
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Latitude</label>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            name="latitude"
                                                            value={formData.latitude}
                                                            onChange={handleChange}
                                                            className="w-full px-3 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all shadow-sm"
                                                        />
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Longitude</label>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            name="longitude"
                                                            value={formData.longitude}
                                                            onChange={handleChange}
                                                            className="w-full px-3 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all shadow-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[11px] font-semibold text-slate-500">
                                                    Drag the pin on the map or click anywhere to set coordinates. You can also search for a location above.
                                                </div>

                                                <div className="rounded-2xl border border-slate-200 overflow-hidden h-[280px] bg-slate-100 relative">
                                                    <DraggablePinMap
                                                        latitude={formData.latitude}
                                                        longitude={formData.longitude}
                                                        onChange={(lat, lng) => {
                                                            setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                                                            reverseGeocode(lat, lng);
                                                        }}
                                                        className="h-full"
                                                    />
                                                    <div className="absolute bottom-2 right-2 flex gap-1 z-[1000]">
                                                        <button
                                                            type="button"
                                                            onClick={handleGetCurrentLocation}
                                                            className="px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-orange-600 hover:bg-orange-50 transition-colors flex items-center gap-1"
                                                        >
                                                            <Navigation className="w-3 h-3" /> Use Current Location
                                                        </button>
                                                    </div>
                                                </div>

                                                {reverseGeocodedAddress && (
                                                    <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-[11px] text-green-700 font-semibold flex items-start gap-2">
                                                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-500" />
                                                        <span>{reverseGeocodedAddress}</span>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        {activeTab === 'media' && (
                                            <motion.div key="media" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center justify-between">
                                                        Gallery Images ({galleryPreviews.length}/{isFree ? '3' : '∞'})
                                                        <span className="text-[9px] text-slate-300 normal-case tracking-normal">{isFree ? 'Up to 3 photos' : 'Unlimited photos'}</span>
                                                    </label>
                                                    <p className="text-[9px] text-slate-400 font-bold ml-1 uppercase tracking-wider">Recommended: 800×800px or larger, PNG/JPG/WebP. Max 5MB each.</p>
                                                    <div className="grid grid-cols-4 gap-3">
                                                        {galleryPreviews.map((url, idx) => (
                                                            <div key={idx} className="relative group rounded-2xl overflow-hidden border-2 border-slate-100">
                                                                <div className="aspect-square relative">
                                                                    <img src={getImageUrl(url) || ""} className={`w-full h-full object-cover ${url.startsWith('blob:') ? 'opacity-50 grayscale' : ''}`} />
                                                                    <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110"><X className="w-3.5 h-3.5" /></button>
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={formData.imageCaptions[url] || ''}
                                                                    onChange={(e) => updateImageCaption(url, e.target.value)}
                                                                    placeholder="Add caption..."
                                                                    className="w-full px-2 py-1.5 text-[10px] font-semibold text-slate-600 bg-slate-50 border-t border-slate-100 focus:outline-none focus:bg-white placeholder:text-slate-300"
                                                                />
                                                            </div>
                                                        ))}
                                                        {galleryPreviews.length < maxImages && (
                                                            <label className={`aspect-square border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center gap-2 text-slate-400 group ${galleryUploading ? 'cursor-not-allowed bg-slate-50 border-slate-200 opacity-70' : 'cursor-pointer bg-orange-50/30 border-orange-200 hover:bg-orange-50/50'}`}>
                                                                <input type="file" multiple accept="image/*" disabled={galleryUploading} onChange={handleGalleryUpload} className="hidden" />
                                                                {galleryUploading ? (
                                                                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                                                                ) : (
                                                                    <>
                                                                        <div className="p-2 rounded-xl bg-white border border-slate-100 text-orange-500 shadow-sm group-hover:scale-110 transition-transform"><Plus className="w-4 h-4" /></div>
                                                                        <span className="text-[9px] font-black uppercase text-slate-500">Add Photos</span>
                                                                    </>
                                                                )}
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Business Amenities</label>
                                                        <button type="button" onClick={() => setShowAddAmenity(!showAddAmenity)} className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 transition-colors flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg"><Plus className="w-3 h-3" /> Add New</button>
                                                    </div>
                                                    {showAddAmenity && (
                                                        <div className="flex gap-2">
                                                            <input type="text" placeholder="e.g. Free WiFi" value={newAmenityName} onChange={(e) => setNewAmenityName(e.target.value)} className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())} />
                                                            <button type="button" onClick={handleAddAmenity} disabled={creatingAmenity || !newAmenityName.trim()} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold">{creatingAmenity ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}</button>
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                        {amenities.map((amenity) => {
                                                            const isSelected = formData.amenityIds.includes(String(amenity.id));
                                                            return (
                                                                <button key={amenity.id} type="button" onClick={() => toggleAmenity(amenity.id)} className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${isSelected ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                                                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-orange-500 text-white' : 'bg-white border'}`}>{isSelected && <Check className="w-3.5 h-3.5" />}</div>
                                                                    <span className="text-xs font-bold truncate">{amenity.name}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="space-y-3 relative">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center justify-between">
                                                        Search Keywords
                                                        {!canUseKeywords ? (
                                                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                                <Lock className="w-2.5 h-2.5" /> Premium Only
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9px] text-slate-300 normal-case tracking-normal">Press Enter after each keyword</span>
                                                        )}
                                                    </label>
                                                    {!canUseKeywords ? (
                                                        <div className="p-6 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/40 flex flex-col items-center gap-3 text-center">
                                                            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
                                                                <Lock className="w-5 h-5 text-amber-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-slate-800">Search Keywords are a Premium Feature</p>
                                                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Upgrade to add up to 10 keywords that boost your listing in search results.</p>
                                                            </div>
                                                            <Link href="/subscription" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition-colors">
                                                                Upgrade Plan
                                                            </Link>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            onClick={() => keywordInputRef.current?.focus()}
                                                            className="min-h-[52px] flex flex-wrap gap-2 cursor-text p-3 bg-slate-50 border border-slate-200 rounded-2xl transition-all focus-within:ring-2 focus-within:ring-orange-400 focus-within:bg-white"
                                                        >
                                                            {keywords.map(kw => (
                                                                <span
                                                                    key={kw}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-slate-700 border border-slate-200 shadow-sm rounded-lg text-xs font-bold transition-all hover:pr-1 group"
                                                                >
                                                                    #{kw}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => { e.stopPropagation(); removeKeyword(kw); }}
                                                                        className="w-0 overflow-hidden group-hover:w-4 transition-all flex items-center justify-center text-slate-400 hover:text-red-500"
                                                                    >
                                                                        <X className="w-3 h-3" />
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
                                                                placeholder={keywords.length === 0 ? 'Type a keyword, press Enter…' : ''}
                                                                className="flex-1 min-w-[140px] bg-transparent outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-400"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                            </motion.div>
                                        )}

                                        {activeTab === 'albums' && (
                                            <motion.div key="albums" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Photo Albums</label>
                                                    <p className="text-[9px] text-slate-400 font-bold ml-1 uppercase tracking-wider">Organize your photos into albums (e.g. Interior, Food, Events).</p>
                                                </div>
                                                {formData.albums.map((album, albumIdx) => (
                                                    <div key={albumIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={album.name}
                                                                onChange={(e) => updateAlbum(albumIdx, 'name', e.target.value)}
                                                                placeholder="Album name..."
                                                                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={album.description}
                                                                onChange={(e) => updateAlbum(albumIdx, 'description', e.target.value)}
                                                                placeholder="Description (optional)..."
                                                                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                            />
                                                            <button type="button" onClick={() => removeAlbum(albumIdx)} className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {album.images.map((imgUrl, imgIdx) => (
                                                                <div key={imgIdx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200">
                                                                    <img src={getImageUrl(imgUrl) || ""} className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                                        <button type="button" onClick={() => moveAlbumImage(albumIdx, imgIdx, -1)} disabled={imgIdx === 0} className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center disabled:opacity-30"><ArrowUp className="w-3 h-3 text-slate-700" /></button>
                                                                        <button type="button" onClick={() => moveAlbumImage(albumIdx, imgIdx, 1)} disabled={imgIdx === album.images.length - 1} className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center disabled:opacity-30"><ArrowDown className="w-3 h-3 text-slate-700" /></button>
                                                                        <button type="button" onClick={() => removeAlbumImage(albumIdx, imgIdx)} className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"><X className="w-3 h-3 text-white" /></button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <label className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-orange-50/50 hover:border-orange-200 transition-all">
                                                                <input type="file" accept="image/*" disabled={albumImageUploading === albumIdx} onChange={(e) => addAlbumImage(albumIdx, e)} className="hidden" />
                                                                {albumImageUploading === albumIdx ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                                                                ) : (
                                                                    <>
                                                                        <Plus className="w-4 h-4 text-slate-400" />
                                                                        <span className="text-[8px] font-bold text-slate-400 uppercase">Add</span>
                                                                    </>
                                                                )}
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={addAlbum}
                                                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-500 hover:bg-orange-50/50 hover:border-orange-200 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Plus className="w-4 h-4" /> Create New Album
                                                </button>
                                            </motion.div>
                                        )}

                                        {activeTab === 'social' && (
                                            <motion.div key="social" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number (*)</label>
                                                        <div className="relative group">
                                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                                            <input required name="phone" value={formData.phone} onChange={handleChange} placeholder="+60..." className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all shadow-sm" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">WhatsApp Number</label>
                                                        <div className="relative group">
                                                            <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#25D366] transition-colors" />
                                                            <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="+60..." className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:bg-white transition-all shadow-sm" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2.5 col-span-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Business Website</label>
                                                        <div className="relative group">
                                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                            <input name="website" value={formData.website} onChange={handleChange} placeholder="https://..." className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all shadow-sm" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 pt-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Additional Named Numbers (Paid)</label>
                                                        {canManageNamedPhones ? (
                                                            <span className="text-[10px] font-black text-slate-500">{formData.namedPhoneNumbers.length}/{maxNamedPhoneNumbers}</span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600"><Lock className="w-3 h-3" /> Upgrade required</span>
                                                        )}
                                                    </div>

                                                    {formData.namedPhoneNumbers.map((item, idx) => (
                                                        <div key={idx} className="grid grid-cols-12 gap-2">
                                                            <input
                                                                type="text"
                                                                value={item.label}
                                                                onChange={(e) => updateNamedPhone(idx, 'label', e.target.value)}
                                                                placeholder="Label (Sales, Support)"
                                                                className="col-span-4 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                                                                disabled={!canManageNamedPhones}
                                                            />
                                                            <input
                                                                type="text"
                                                                value={item.number}
                                                                onChange={(e) => updateNamedPhone(idx, 'number', e.target.value)}
                                                                placeholder="+923001234567"
                                                                className="col-span-7 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                                                                disabled={!canManageNamedPhones}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeNamedPhone(idx)}
                                                                className="col-span-1 h-10 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center"
                                                                disabled={!canManageNamedPhones}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    <button
                                                        type="button"
                                                        onClick={addNamedPhone}
                                                        disabled={!canManageNamedPhones || formData.namedPhoneNumbers.length >= maxNamedPhoneNumbers}
                                                        className="w-full py-2.5 border border-dashed border-slate-300 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                                    >
                                                        + Add Named Number
                                                    </button>
                                                </div>

                                                <div className="space-y-4 pt-4 border-t border-slate-100 relative">
                                                    {isFree && (
                                                        <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-white/80 flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-slate-100">
                                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                                                                <Lock className="w-5 h-5 text-slate-400" />
                                                            </div>
                                                            <h4 className="text-sm font-black text-slate-900 mb-1">Premium Feature</h4>
                                                            <p className="text-[11px] font-bold text-slate-500 mb-4 max-w-[200px]">Upgrade to add your social media profiles.</p>
                                                            <Link href="/subscription" className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all">
                                                                Upgrade Plan
                                                            </Link>
                                                        </div>
                                                    )}
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Social Media Profiles</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {SOCIAL_PLATFORMS.map(p => {
                                                            const isSelected = !!(Array.isArray(socialLinks) ? socialLinks : []).find(s => s.platform === p.key);
                                                            return (
                                                                <button key={p.key} type="button" onClick={() => isSelected ? removeSocialLink(p.key) : addSocialLink(p.key)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${isSelected ? 'text-white' : 'bg-slate-50 text-slate-500'}`} style={isSelected ? { backgroundColor: p.color } : {}}>
                                                                    <span className="text-[10px]">{isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}</span> {p.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="space-y-3 pt-2">
                                                        {(Array.isArray(socialLinks) ? socialLinks : []).map(link => {
                                                            const platform = SOCIAL_PLATFORMS.find(p => p.key === link.platform);
                                                            if (!platform) return null;
                                                            return (
                                                                <div key={link.platform} className="flex items-center gap-2 group/link">
                                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: platform.color }}>{getSocialIcon(platform.key, "w-5 h-5 text-white") || platform.emoji}</div>
                                                                    <input type="url" value={link.url || ''} onChange={e => updateSocialUrl(link.platform, e.target.value)} placeholder={platform.placeholder} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                                                                    <button type="button" onClick={() => removeSocialLink(link.platform)} className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 flex items-center justify-center"><X className="w-4 h-4" /></button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeTab === 'faqs' && (
                                            <motion.div key="faqs" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                                                {!canUseFaqs ? (
                                                    <div className="p-8 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/40 flex flex-col items-center gap-4 text-center">
                                                        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                                                            <Lock className="w-6 h-6 text-amber-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-800">FAQs are a Premium Feature</p>
                                                            <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">Upgrade your plan to add up to 10 Frequently Asked Questions to your business profile. FAQs help customers quickly understand your services and reduce direct enquiries.</p>
                                                        </div>
                                                        <Link href="/subscription" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition-colors shadow-lg shadow-amber-500/25">
                                                            View Upgrade Plans
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Question</label>
                                                                <input
                                                                    type="text"
                                                                    value={newFaq.question}
                                                                    onChange={(e) => setNewFaq(prev => ({ ...prev, question: e.target.value }))}
                                                                    placeholder="e.g. Do you offer home delivery?"
                                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-orange-400 outline-none"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Answer</label>
                                                                <textarea
                                                                    value={newFaq.answer}
                                                                    onChange={(e) => setNewFaq(prev => ({ ...prev, answer: e.target.value }))}
                                                                    placeholder="e.g. Yes, we offer free home delivery..."
                                                                    rows={3}
                                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-orange-400 outline-none resize-none"
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={addFaq}
                                                                disabled={!newFaq.question.trim() || !newFaq.answer.trim()}
                                                                className="w-full py-3 bg-white border-2 border-orange-500 text-orange-600 rounded-xl font-black text-sm hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                            >
                                                                <Plus className="w-4 h-4" /> Add FAQ Item
                                                            </button>
                                                        </div>

                                                        <div className="space-y-3">
                                                            {(formData.faqs || []).map((faq, idx) => (
                                                                <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group">
                                                                    <div className="flex justify-between gap-4">
                                                                        <div className="flex-1 space-y-1">
                                                                            <h4 className="text-sm font-black text-slate-900 flex items-start gap-2">
                                                                                <span className="text-orange-500">Q.</span> {faq.question}
                                                                            </h4>
                                                                            <p className="text-xs text-slate-500 font-medium">
                                                                                <span className="text-blue-500 font-black">A.</span> {faq.answer}
                                                                            </p>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeFaq(idx)}
                                                                            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {(!formData.faqs || formData.faqs.length === 0) && (
                                                                <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
                                                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No FAQs added yet</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="p-6 border-t border-slate-100 bg-white/80 backdrop-blur-md space-y-4">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative flex items-center justify-center mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={agreedToTerms}
                                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                className="w-5 h-5 appearance-none border-2 border-slate-300 rounded-lg checked:border-orange-500 checked:bg-orange-500 transition-colors cursor-pointer peer"
                                            />
                                            <svg className="w-3 h-3 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                        <span className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                            I confirm that the business details submitted are accurate and I agree to the{' '}
                                            <Link href="/terms" className="text-orange-600 font-bold hover:underline">Terms of Service</Link>
                                            {' '}and{' '}
                                            <Link href="/privacy" className="text-orange-600 font-bold hover:underline">Privacy Policy</Link>. *
                                        </span>
                                    </label>
                                    <button
                                        disabled={loading || galleryUploading || (!business && !canAddListing) || !agreedToTerms}
                                        type="submit"
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-orange-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                                    >
                                        {loading || galleryUploading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Store className="w-4 h-4" />
                                                {business ? 'Save Changes' : 'Publish Listing'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

