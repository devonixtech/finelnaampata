"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Loader2, CheckCircle, ArrowLeft, ArrowRight, Lock
} from 'lucide-react';
import { api } from '../../../lib/api';
import { Category, City } from '../../../types/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { usePlanFeature } from '../../../hooks/usePlanFeature';
import Link from 'next/link';

import { DEFAULT_DIAL_CODES } from '../../../lib/phone-codes';

// New Architecture Imports
import { ListingFormData } from './types';
import { STEPS } from '../../../lib/constants/listing-options';
import { 
    Step1NameTagline, 
    Step2BusinessType, 
    Step3BusinessNature, 
    Step4OperationalStructure,
    Step6TargetMarket,
    Step11Description,
    Step12Experience
} from './steps/StepComponents';

import {
    Step5Category,
    Step9Contact,
    Step13Online,
    Step14Amenities
} from './steps/StepComplexComponents';

import {
    Step7Address,
    Step8Map,
    Step16Keywords,
    Step17FAQs
} from './steps/StepLocationMedia';

import {
    Step10Hours,
    Step15Industry,
    Step18Expansion,
    Step19Media
} from './steps/StepFinalComponents';

// Use same DraggablePinMap
const DraggablePinMap = dynamic(() => import('../../../components/DraggablePinMap'), { ssr: false });

const DIAL_CODES = DEFAULT_DIAL_CODES;
const inputClass = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all placeholder:text-slate-400";
const labelClass = "block text-xs font-black uppercase tracking-widest text-slate-400 mb-2";

const normalizeOptionalUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
};

const toE164 = (phoneCode: string, phoneNumber: string) => {
    const code = (phoneCode || '').trim();
    const local = (phoneNumber || '').replace(/[^\d]/g, '');
    if (!code || !local) return '';
    return `${code}${local}`.replace(/\s+/g, '');
};

const buildBusinessHoursPayload = (businessHours: any[]) => {
    if (!Array.isArray(businessHours)) return undefined;

    const hours = businessHours
        .filter((entry) => entry && typeof entry === 'object')
        .map((entry) => ({
            dayOfWeek: String(entry.dayOfWeek || entry.day || '').toLowerCase(),
            isOpen: entry.isOpen !== false,
            openTime: entry.openTime || entry.open || undefined,
            closeTime: entry.closeTime || entry.close || undefined,
        }))
        .filter((entry) => entry.dayOfWeek);

    return hours.length ? hours : undefined;
};

function AddListingContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [catsLoading, setCatsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    
    // Core Wizard State
    const [activeStep, setActiveStep] = useState(1);

    useEffect(() => {
        const stepParam = searchParams.get('step');
        if (stepParam) {
            const stepNum = parseInt(stepParam, 10);
            if (stepNum >= 1 && stepNum <= STEPS.length) {
                setActiveStep(stepNum);
            }
        }
    }, [searchParams]);
    
    // Data States
    const [categories, setCategories] = useState<Category[]>([]);
    const [countryOptions, setCountryOptions] = useState<{ code: string; name: string }[]>([]);
    const [myListingsCount, setMyListingsCount] = useState<number | null>(null);

    // V2 Form Data
    const [formData, setFormData] = useState<ListingFormData>({
        title: '',
        shortDescription: '',
        description: '',
        businessType: [],
        coreBusinessNature: [],
        operationalStructure: [],
        targetMarket: [],
        categoryId: '',
        subCategoryIds: [],
        address: '',
        addressLine2: '',
        city: '',
        state: '',
        country: 'Pakistan',
        pincode: '',
        latitude: 30.3753,
        longitude: 69.3451,
        phoneCode: '+92',
        phoneNumber: '',
        whatsapp: '',
        contactPersonName: '',
        namedPhoneNumbers: [],
        businessHours: [],
        yearEstablished: '',
        employeeCount: '',
        website: '',
        socialLinks: [],
        locationAccess: [],
        facilities: [],
        staffFeatures: [],
        paymentMethods: [],
        industrySubType: [],
        searchKeywords: [],
        metaKeywords: '',
        faqs: [],
        franchiseOpportunities: false,
        franchiseAvailableIn: [],
        franchiseInvestmentRange: '',
        franchiseSupport: [],
        franchiseMinSpace: '',
        lookingForDealers: false,
        isImporterExporter: false,
        areasServed: [],
        businessLanguages: [],
        chainOrMultipleBranches: false,
        logoUrl: '',
        coverImageUrl: '',
        images: [],
        imageCaptions: {},
        agreed: false,
    });

    const formDataRef = useRef(formData);
    useEffect(() => { formDataRef.current = formData; }, [formData]);

    const { getFeatureValue, planName, isFree } = usePlanFeature();
    const maxListings = Math.max(1, Number(getFeatureValue('maxListings') || 1));
    const maxImages = isFree ? 3 : 999;
    const isVendor = user?.role === 'vendor';
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const canAddListing = isAdmin || (myListingsCount !== null && myListingsCount < maxListings);

    useEffect(() => {
        const fetchInitialData = async () => {
            setCatsLoading(true);
            try {
                const [cats, myListings] = await Promise.all([
                    api.categories.getAll({ includeSubcategories: true }),
                    api.listings.getMyListings({ limit: 1 }).catch(() => ({ meta: { total: 0 } }))
                ]);
                const catArray = Array.isArray(cats) ? cats : (cats as any)?.data ?? [];
                setCategories(catArray);
                setMyListingsCount((myListings as any)?.meta?.total ?? (myListings as any)?.length ?? 0);
            } catch (err: any) {
                console.error('Failed to fetch initial data:', err);
                setError(err.message || 'Failed to load initial data');
            } finally {
                setCatsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Pre-fill owner contact details from authenticated user profile
    useEffect(() => {
        if (!user) return;
        setFormData(prev => {
            if (prev.phoneNumber || prev.contactPersonName) return prev;
            const fullPhone = user.phone || '';
            let phoneCode = prev.phoneCode;
            let phoneNumber = '';
            if (fullPhone) {
                const dial = DEFAULT_DIAL_CODES.find(d => fullPhone.startsWith(d.dialCode));
                if (dial) {
                    phoneCode = dial.dialCode;
                    phoneNumber = fullPhone.slice(dial.dialCode.length);
                } else if (fullPhone.startsWith('+')) {
                    phoneCode = fullPhone.slice(0, fullPhone.length - 10) || prev.phoneCode;
                    phoneNumber = fullPhone.slice(phoneCode.length);
                } else {
                    phoneNumber = fullPhone;
                }
            }
            return {
                ...prev,
                contactPersonName: prev.contactPersonName || user.fullName || '',
                phoneCode,
                phoneNumber: prev.phoneNumber || phoneNumber.replace(/\D/g, ''),
            };
        });
    }, [user]);

    const validateStep = (step: number): boolean => {
        setError(null);
        
        switch (step) {
            case 1:
                if (!formData.title || formData.title.trim().length < 2) {
                    setError('Business Name is required and must be at least 2 characters.');
                    return false;
                }
                break;
            case 5:
                if (!formData.categoryId) {
                    setError('Please select a primary Business Category.');
                    return false;
                }
                break;
            case 7:
                if (!formData.address || formData.address.trim().length < 5) {
                    setError('Business Address is required and must be at least 5 characters.');
                    return false;
                }
                if (!formData.city || formData.city.trim().length < 2) {
                    setError('City is required and must be at least 2 characters.');
                    return false;
                }
                if (!formData.state || formData.state.trim().length < 2) {
                    setError('State / Province is required and must be at least 2 characters.');
                    return false;
                }
                break;
            case 9:
                const phone = toE164(formData.phoneCode, formData.phoneNumber);
                if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
                    setError('A valid Phone Number with country code is required (e.g., +923001234567).');
                    return false;
                }
                break;
            case 11:
                if (!formData.description || formData.description.trim().length < 10) {
                    setError('Description is required and must be at least 10 characters.');
                    return false;
                }
                break;
            default:
                break;
        }
        return true;
    };

    const handleNext = () => {
        if (!validateStep(activeStep)) {
            if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            return;
        }
        setActiveStep(prev => Math.min(prev + 1, STEPS.length));
    };

    const handlePrev = () => {
        setError(null);
        setActiveStep(prev => Math.max(prev - 1, 1));
    };

    useEffect(() => {
        setError(null);
    }, [activeStep]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (activeStep !== STEPS.length) return;

        if (!formData.agreed) {
            setError('You must agree to the Terms & Conditions and Privacy Policy.');
            return;
        }

        setLoading(true);
        setError(null);
        const rawData = formDataRef.current;
        const phone = toE164(rawData.phoneCode, rawData.phoneNumber);
        const whatsapp = rawData.whatsapp ? toE164(rawData.phoneCode, rawData.whatsapp) : undefined;
        const yearEstablished = rawData.yearEstablished.trim()
            ? Number.parseInt(rawData.yearEstablished, 10)
            : undefined;
        const businessHours = buildBusinessHoursPayload(rawData.businessHours);
        const website = normalizeOptionalUrl(rawData.website);
        const logoUrl = normalizeOptionalUrl(rawData.logoUrl);
        const coverImageUrl = normalizeOptionalUrl(rawData.coverImageUrl);
        const images = Array.isArray(rawData.images) && rawData.images.length ? rawData.images : undefined;
        const faqs = Array.isArray(rawData.faqs) && rawData.faqs.length ? rawData.faqs : undefined;
        const subCategoryIds = Array.isArray(rawData.subCategoryIds) && rawData.subCategoryIds.length
            ? rawData.subCategoryIds
            : undefined;

        const submissionData = {
            title: rawData.title.trim(),
            categoryId: rawData.categoryId || undefined,
            subCategoryIds,
            description: rawData.description.trim(),
            shortDescription: rawData.shortDescription.trim() || undefined,
            phone,
            whatsapp,
            namedPhoneNumbers: Array.isArray(rawData.namedPhoneNumbers) && rawData.namedPhoneNumbers.length
                ? rawData.namedPhoneNumbers.filter((item) => item.label?.trim() && item.number?.trim())
                : undefined,
            website,
            address: rawData.address.trim(),
            addressLine2: rawData.addressLine2.trim() || undefined,
            city: rawData.city.trim(),
            state: rawData.state.trim(),
            country: rawData.country.trim() || undefined,
            pincode: rawData.pincode.trim() || undefined,
            latitude: Number.isFinite(rawData.latitude) ? rawData.latitude : undefined,
            longitude: Number.isFinite(rawData.longitude) ? rawData.longitude : undefined,
            logoUrl,
            coverImageUrl,
            images,
            imageCaptions: rawData.imageCaptions && Object.keys(rawData.imageCaptions).length
                ? rawData.imageCaptions
                : undefined,
            yearEstablished: Number.isInteger(yearEstablished as number) ? yearEstablished : undefined,
            employeeCount: rawData.employeeCount || undefined,
            businessHours,
            metaKeywords: Array.isArray(rawData.searchKeywords) && rawData.searchKeywords.length
                ? rawData.searchKeywords.join(', ')
                : undefined,
            faqs,
            businessType: Array.isArray(rawData.businessType) && rawData.businessType.length ? rawData.businessType : undefined,
            coreBusinessNature: Array.isArray(rawData.coreBusinessNature) && rawData.coreBusinessNature.length ? rawData.coreBusinessNature : undefined,
            operationalStructure: Array.isArray(rawData.operationalStructure) && rawData.operationalStructure.length ? rawData.operationalStructure : undefined,
            targetMarket: Array.isArray(rawData.targetMarket) && rawData.targetMarket.length ? rawData.targetMarket : undefined,
            industrySubType: Array.isArray(rawData.industrySubType) && rawData.industrySubType.length ? rawData.industrySubType : undefined,
            socialLinks: Array.isArray(rawData.socialLinks) && rawData.socialLinks.length
                ? rawData.socialLinks.filter((s: any) => s.url?.trim())
                : undefined,
            contactPersonName: rawData.contactPersonName?.trim() || undefined,
            locationAccess: Array.isArray(rawData.locationAccess) && rawData.locationAccess.length ? rawData.locationAccess : undefined,
            facilities: Array.isArray(rawData.facilities) && rawData.facilities.length ? rawData.facilities : undefined,
            staffFeatures: Array.isArray(rawData.staffFeatures) && rawData.staffFeatures.length ? rawData.staffFeatures : undefined,
            paymentMethods: Array.isArray(rawData.paymentMethods) && rawData.paymentMethods.length ? rawData.paymentMethods : undefined,
            areasServed: Array.isArray(rawData.areasServed) && rawData.areasServed.length ? rawData.areasServed : undefined,
            businessLanguages: Array.isArray(rawData.businessLanguages) && rawData.businessLanguages.length ? rawData.businessLanguages : undefined,
            franchiseOpportunities: rawData.franchiseOpportunities || undefined,
            franchiseAvailableIn: Array.isArray(rawData.franchiseAvailableIn) && rawData.franchiseAvailableIn.length ? rawData.franchiseAvailableIn : undefined,
            franchiseInvestmentRange: rawData.franchiseInvestmentRange?.trim() || undefined,
            franchiseSupport: Array.isArray(rawData.franchiseSupport) && rawData.franchiseSupport.length ? rawData.franchiseSupport : undefined,
            franchiseMinSpace: rawData.franchiseMinSpace?.trim() || undefined,
            lookingForDealers: rawData.lookingForDealers || undefined,
            isImporterExporter: rawData.isImporterExporter || undefined,
            chainOrMultipleBranches: rawData.chainOrMultipleBranches || undefined,
            legalConsentAccepted: true,
            legalConsentAcceptedAt: new Date().toISOString(),
            legalConsentSessionId: typeof window !== 'undefined'
                ? (sessionStorage.getItem('listingConsentSessionId') || (() => {
                    const value = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
                    sessionStorage.setItem('listingConsentSessionId', value);
                    return value;
                })())
                : undefined,
            legalConsentDeviceId: typeof window !== 'undefined'
                ? (localStorage.getItem('listingConsentDeviceId') || (() => {
                    const value = `dev-${Math.random().toString(36).slice(2, 14)}`;
                    localStorage.setItem('listingConsentDeviceId', value);
                    return value;
                })())
                : undefined,
            termsVersion: 'v1',
            privacyVersion: 'v1',
        };

        try {
            await api.listings.create(submissionData);
            setSuccess(true);
            setTimeout(() => router.push('/listings'), 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to create listing');
        } finally {
            setLoading(false);
        }
    };

    // Render Logic Mapper
    const renderStepContent = () => {
        const props = { formData, setFormData, onNext: handleNext, onPrev: handlePrev, categories, categoriesLoading: catsLoading };
        switch (activeStep) {
            case 1: return <Step1NameTagline {...props} />;
            case 2: return <Step2BusinessType {...props} />;
            case 3: return <Step3BusinessNature {...props} />;
            case 4: return <Step4OperationalStructure {...props} />;
            case 5: return <Step5Category {...props} />;
            case 6: return <Step6TargetMarket {...props} />;
            case 7: return <Step7Address {...props} />;
            case 8: return <Step8Map {...props} />;
            case 9: return <Step9Contact {...props} />;
            case 10: return <Step10Hours {...props} />;
            case 11: return <Step11Description {...props} />;
            case 12: return <Step12Experience {...props} />;
            case 13: return <Step13Online {...props} />;
            case 14: return <Step14Amenities {...props} />;
            case 15: return <Step15Industry {...props} />;
            case 16: return <Step16Keywords {...props} />;
            case 17: return <Step17FAQs {...props} />;
            case 18: return <Step18Expansion {...props} />;
            case 19: return <Step19Media {...props} />;
            case 20: return (
                <div className="space-y-6">
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                        <label className="flex items-start cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 mt-0.5 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
                                checked={formData.agreed}
                                onChange={e => setFormData(p => ({ ...p, agreed: e.target.checked }))}
                            />
                            <div className="ml-4">
                                <span className="text-sm font-black text-slate-900 block">I agree to the Terms of Service and Privacy Policy</span>
                                <span className="text-xs font-medium text-slate-500 block mt-1">
                                    By submitting this listing, I confirm that I am an authorized representative of this business and the information provided is accurate.
                                </span>
                            </div>
                        </label>
                    </div>
                </div>
            );
            default:
                return (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-2">Step {activeStep}</h3>
                        <p className="text-sm text-slate-500">This step is currently under construction in the V2 migration.</p>
                    </div>
                );
        }
    };

    if (success) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="w-24 h-24 rounded-full bg-green-50 border-4 border-green-200 flex items-center justify-center"
                >
                    <CheckCircle className="w-12 h-12 text-green-500" />
                </motion.div>
                <div className="text-center">
                    <h2 className="text-3xl font-black text-slate-900 mb-2">Listing Submitted! 🎉</h2>
                    <p className="text-slate-500 font-medium">Your business is being processed. Redirecting...</p>
                </div>
            </div>
        );
    }

    if (!canAddListing && !loading && myListingsCount !== null) {
        return (
            <div className="max-w-4xl mx-auto pb-16">
                <div className="mb-10 p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-20 h-20 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                            <Lock className="w-10 h-10 text-orange-500" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-black text-white mb-2">Listing Limit Reached</h2>
                            <p className="text-slate-400 font-bold mb-4">
                                Your <span className="text-orange-400">{planName}</span> plan allows for {maxListings} listing(s). You have reached the limit.
                            </p>
                            <Link href="/subscription" className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-sm">
                                Upgrade Plan
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentStepConfig = STEPS.find(s => s.id === activeStep);
    const progress = (activeStep / STEPS.length) * 100;

    return (
        <div className="max-w-3xl mx-auto pb-16">
            {/* Header & Progress */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900">Add Your Business</h1>
                    <span className="px-4 py-1.5 bg-orange-50 text-orange-600 font-black text-sm rounded-full border border-orange-200">
                        Step {activeStep} of {STEPS.length}
                    </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3">
                    ⚠ {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-xl font-black text-slate-900">{currentStepConfig?.label}</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">{currentStepConfig?.description}</p>
                </div>
                
                <div className="p-8 min-h-[300px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderStepContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={handlePrev}
                        disabled={activeStep === 1 || loading}
                        className="px-6 py-3 rounded-xl font-black text-sm text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    
                    {activeStep < STEPS.length ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="px-6 py-3 rounded-xl font-black text-sm text-white bg-slate-900 hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20"
                        >
                            Continue <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={loading || !formData.agreed}
                            className="px-8 py-3 rounded-xl font-black text-sm text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                            Submit Listing
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default function AddListingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <div className="w-12 h-12 border-t-2 border-orange-500 rounded-full animate-spin mb-6" />
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Loading</p>
            </div>
        }>
            <AddListingContent />
        </Suspense>
    );
}

