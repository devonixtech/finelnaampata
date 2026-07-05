"use client";

import React, { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    Check, 
    ChevronRight, 
    ChevronLeft, 
    ShieldCheck, 
    Loader2, 
    Building2,
    Phone,
    MapPin,
    TextQuote,
    Mail,
    Map,
    Globe,
    Lock,
    Sparkles,
    Trash2,
    Plus,
    Upload,
    X,
    Clock,
    DollarSign,
    Layers,
    Smile,
    MessageSquare,
    Laptop,
    Instagram,
    Facebook,
    Youtube,
    Linkedin,
    Twitter
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { usePlanFeature } from '../../hooks/usePlanFeature';
import { City, Category } from '../../types/api';
import CategorySearchSelect from '../../components/CategorySearchSelect';
import { COUNTRIES_STATES } from '../../lib/data/countries-states';

import { DEFAULT_DIAL_CODES } from '../../lib/phone-codes';
import {
    sortAndDedupeCities,
    sortAndDedupeCountries,
    cityMatchesCountry,
    tryDetectDeviceLocation,
    inferLocationFromCoords,
    getBrowserTimezone,
    cleanAndDedupeStates,
} from '../../lib/location-detect';
import { validatePostalCode } from '../../lib/validatePostalCode';
import AddressPlacesAutocomplete from '../../components/AddressPlacesAutocomplete';
import { PhoneNumberUtil } from 'google-libphonenumber';
import { parsePhoneWithLib, cleanPastedPhone } from '../../lib/phone-parser';

const DraggablePinMap = dynamic(() => import('../../components/DraggablePinMap'), { ssr: false });

const DIAL_CODES = DEFAULT_DIAL_CODES;



const EMPLOYEE_SIZE_OPTIONS = [
    'Just Me (Solo)', '2 – 5', '6 – 10', '11 – 25', '26 – 50', '51 – 100', '101 – 250', '251 – 500', '501 – 1,000', '1,000+', 'Prefer not to say'
];

const AMENITIES_SECTIONS = {
    locationAccess: {
        title: 'Location & Access',
        options: ['Physical Location', 'Online Business', 'Mobile / Home Service', 'Delivery Available', 'Online Consultation', 'Emergency Service', '24/7 Open', 'Appointment Only']
    },
    facilities: {
        title: 'Facilities at Location',
        options: ['Free Wi-Fi', 'Parking Available', 'Air Conditioned', 'Waiting Area', 'Wheelchair Accessible', 'Elevator / Lift', 'Kids Area', 'Pet Friendly', 'Washroom / Toilet', 'Prayer Area', 'CCTV / Security', 'Generator / Backup Power', 'Family Seating', 'EV Charging', 'Locker / Storage']
    },
    staff: {
        title: 'Staff Available',
        options: ['Female Staff Available', 'Male Staff Available', 'Bilingual Staff', 'Sign Language Support', 'Trained / Certified Staff', 'Uniformed Staff', 'Dedicated Customer Support']
    },
    payments: {
        title: 'Payment Methods Accepted',
        options: ['Cash Accepted', 'Card Accepted', 'Bank Transfer', 'Mobile Wallet', 'Advance Payment Required', 'Cryptocurrency', 'Instalment / Buy Now Pay Later', 'Online Payment']
    }
};

const SPECIALISED_SECTORS = {
    industrial: {
        title: 'Industrial, Manufacturing & B2B',
        options: ['Factory', 'Manufacturing Unit', 'Industrial Supplier', 'Packaging Company', 'Printing Press', 'Textile Mill', 'Garment Factory', 'Warehouse', 'Cold Storage', 'Wholesale Market / Mandi', 'Export House', 'Import Clearance Agent']
    },
    agriculture: {
        title: 'Agriculture, Farming & Rural',
        options: ['Seed Store', 'Fertilizer Store', 'Pesticide Shop', 'Dairy Farm', 'Poultry Farm', 'Cattle Farm', 'Tractor Dealer', 'Agricultural Equipment', 'Grain Market', 'Livestock Market', 'Irrigation Supplies', 'Organic Farm']
    }
};

const PremiumFeatureBanner = () => (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 p-3 rounded-xl flex items-start gap-3 mb-4">
        <Lock className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
        <div>
            <p className="text-sm font-bold text-orange-900">Premium Feature</p>
            <p className="text-xs text-orange-700 font-medium mt-0.5">This section is available on Paid Plans. You can fill it out now, and it will be unlocked when you upgrade.</p>
        </div>
    </div>
);

const OPERATIONAL_STRUCTURE_SECTIONS = {
    producer: {
        title: 'Producer',
        options: ['Manufacturer', 'Assembler', 'Fabricator', 'Farmer / Agricultural Producer', 'Extractor / Mining', 'OEM (Original Equipment Manufacturer)', 'Private Label Producer', 'Garment / Textile Factory']
    },
    sales: {
        title: 'Sales & Distribution',
        options: ['Retailer', 'Wholesaler', 'Distributor', 'Importer', 'Exporter', 'Dealer / Authorised Seller', 'Reseller', 'Franchise']
    },
    intermediary: {
        title: 'Intermediary',
        options: ['Broker', 'Agent / Representative', 'Auctioneer', 'Commission-Based Facilitator', 'Marketplace Operator', 'Franchisee']
    },
    service: {
        title: 'Service Function',
        options: ['Consulting / Advisory', 'Installation', 'Repair & Maintenance', 'Design', 'Training / Education', 'Technical Support', 'Operations Management', 'Cleaning / Hygiene', 'Security Services', 'Logistics / Transport', 'Healthcare / Medical', 'Legal / Compliance']
    },
    org: {
        title: 'Organisational Structure',
        options: ['Individual / Freelancer', 'Partnership', 'Private Company', 'Public Company', 'Government Entity', 'Nonprofit / NGO', 'Cooperative', 'Other']
    }
};

function BusinessSetupWizardContent() {
    const { user, syncProfile } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isFree, hasFeature, getFeatureValue } = usePlanFeature();
    const maxSubCategories = Math.max(0, Number(getFeatureValue('maxSubCategories') || 0));
    const totalSubCategorySlots = Math.max(3, maxSubCategories || 0);
    const maxNamedPhoneNumbers = Math.max(0, Number(getFeatureValue('maxNamedPhoneNumbers') || 0));
    const maxFaqs = Math.max(0, Number(getFeatureValue('maxFaqs') || 0));
    const hasWhatsappIntegration = hasFeature('showChat');

    const [categories, setCategories] = useState<Category[]>([]);
    const [allCities, setAllCities] = useState<City[]>([]);
    const [filteredCities, setFilteredCities] = useState<City[]>([]);
    const [countries, setCountries] = useState<string[]>([]);
    const [countryOptions, setCountryOptions] = useState<{ code: string; name: string }[]>([]);
    const [setupQuestions, setSetupQuestions] = useState<Array<{ id: string; category: string; question: string; options: string[] }>>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activatingBusiness, setActivatingBusiness] = useState(false);
    const [activationError, setActivationError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [completed, setCompleted] = useState(false);
    
    // Auto-detect and duplicates states
    const [geoDetecting, setGeoDetecting] = useState(false);
    const [geoError, setGeoError] = useState('');
    const [mapSearchQuery, setMapSearchQuery] = useState('');
    const [mapSearchResults, setMapSearchResults] = useState<Array<{ placeId: string; description: string }>>([]);
    const [mapSearchLoading, setMapSearchLoading] = useState(false);
    const [mapSearchError, setMapSearchError] = useState('');

    useEffect(() => {
        const stepParam = searchParams.get('step');
        if (!stepParam) return;

        const parsed = Number.parseInt(stepParam, 10);
        if (!Number.isFinite(parsed)) return;

        const zeroBasedStep = parsed - 1;
        if (zeroBasedStep >= 0 && zeroBasedStep <= 20) {
            setCurrentStep(zeroBasedStep);
        }
    }, [searchParams]);

    // Dynamic states for 21 steps
    const [stepData, setStepData] = useState({
        // Step 1: Business Name & Tagline
        businessName: '',
        businessTagline: '',
        contactPersonTitle: '',
        contactPersonName: '',

        // Step 2: Business Type (Presence)
        businessType: [] as string[],

        // Step 3: Core Business Nature
        coreNature: [] as string[],

        // Step 4: Operational Structure
        operationalStructure: [] as string[],

        // Step 5: Business Category
        primaryCategory: '',
        subcategory1: '',
        subcategory2: '',
        subcategory3: '',
        customCategoryTag: '',

        // Step 6: Target Market
        targetMarket: [] as string[],

        // Step 7: What Your Business Offers
        offers: [] as string[],

        // Step 8: Business Address
        country: '',
        city: '',
        state: '',
        address: '',
        addressLine2: '',
        zipCode: '',

        // Step 9: Map Pin
        latitude: '',
        longitude: '',
        mapConfirmed: false,

        // Step 10: Contact Details
        phoneCode: '+92',
        phoneNumber: '',
        whatsappCode: '+92',
        whatsappNumber: '',
        whatsappSameAsPhone: false,
        businessEmail: '',
        namedPhoneNumbers: [] as Array<{ label: string; personName: string; title: string; number: string }>,

        // Step 11: Business Hours
        open247: false,
        timezone: getBrowserTimezone(),
        hours: {} as Record<string, { isOpen: boolean; openTime: string; closeTime: string }>,

        // Step 12: Business Description
        bio: '',
        languages: [] as string[],
        languagesText: '',

        // Step 13: Year Established & Team
        yearEstablished: '',
        employeeSize: '',
        hasMultipleBranches: false,

        // Step 14: Website & Social Media
        website: '',
        socialLinks: {
            facebook: '',
            instagram: '',
            youtube: '',
            linkedin: '',
            tiktok: '',
            twitter: '',
            pinterest: '',
            snapchat: '',
            customLinks: [] as Array<{ label: string; url: string }>
        },

        // Step 15: Amenities & Facilities
        amenities: [] as string[],

        // Step 16: Specialised Sectors
        specialisedSectors: [] as string[],

        // Step 17: Keywords
        keywords: [] as string[],

        // Step 18: FAQs
        faqs: [] as Array<{ question: string; answer: string }>,

        // Step 19: Business Opportunities
        franchiseOpportunity: 'No',
        franchiseAreas: [] as string[],
        franchiseInvestment: '',
        franchiseSupport: [] as string[],
        franchiseMinSpace: '',
        dealersResellers: 'No',
        importerExporter: 'No',
        areasServed: [] as string[],

        // Step 20: Logo & Cover Image
        logoUrl: '',
        coverImageUrl: '',
        galleryUrls: [] as string[],
        imageCaptions: {} as Record<string, string>,

        // Step 21: Legal Consent
        termsAccepted: false,
        privacyAccepted: false,
        moderationAccepted: false,
        accuracyConfirmed: false,
        publicLocationConsent: false,
        marketingUpdatesConsent: false
    });
    const [addressConfig, setAddressConfig] = useState<any>(null);

    const [consentMeta, setConsentMeta] = useState({
        sessionId: '',
        deviceId: '',
        ipAddress: ''
    });

    // Load initial configuration
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                if (!user) {
                    router.push('/login');
                    return;
                }
                if (!user.isEmailVerified && user.provider !== 'google') {
                    router.push('/verify-email');
                    return;
                }
                const [cats, citiesData, countriesData, questionsData] = await Promise.all([
                    api.categories.getAll({ includeSubcategories: true }),
                    api.cities.getAll(),
                    api.addressConfig.getCountries({ silent: true }).catch(() => []),
                    api.businessSetup.getQuestions().catch(() => []),
                ]);

                setSetupQuestions(Array.isArray(questionsData) ? questionsData : []);

                const options = sortAndDedupeCountries((countriesData || []) as { code: string; name: string }[]);
                setCountryOptions(options);
                setCountries(options.map((c) => c.name).filter(Boolean));
                setAllCities(sortAndDedupeCities(citiesData || []));
                setCategories(cats || []);

                if (user.role !== 'vendor') {
                    const parsed = parsePhoneWithLib(user.phone || '', '+92');
                    const parsedCode = parsed.dialCode;
                    const parsedNum = parsed.phoneNumber;
                    setStepData((prev) => ({
                        ...prev,
                        businessName: prev.businessName || user.vendor?.businessName || user.fullName || '',
                        businessEmail: prev.businessEmail || user.email || '',
                        phoneCode: prev.phoneCode || parsedCode,
                        phoneNumber: prev.phoneNumber || parsedNum.replace(/\D/g, ''),
                        address: prev.address || user.vendor?.businessAddress || '',
                        country: prev.country || user.country || options[0]?.name || '',
                        city: prev.city || user.city || '',
                        state: prev.state || user.state || '',
                    }));
                    return;
                }

                const [status, profile] = await Promise.all([
                    api.businessSetup.getStatus(),
                    api.businessProfiles.getProfile(),
                ]);

                // Load existing vendor attributes if they exist
                if (status && status.answers) {
                    const ans = status.answers;

                    // Parse phone codes
                    const parsedPhone = parsePhoneWithLib(profile?.businessPhone || '', '+92');
                    const phCode = parsedPhone.dialCode;
                    const phNum = parsedPhone.phoneNumber;

                    const parsedWa = parsePhoneWithLib(ans['whatsapp']?.[0] || '', '+92');
                    const waCode = parsedWa.dialCode;
                    const waNum = parsedWa.phoneNumber;

                    setStepData(prev => ({
                        ...prev,
                        businessName: profile?.businessName || '',
                        businessTagline: ans['businessTagline']?.[0] || '',
                        contactPersonTitle: ans['contactPersonTitle']?.[0] || '',
                        contactPersonName: ans['contactPersonName']?.[0] || '',

                        businessType: ans['type-1'] || [],
                        coreNature: ans['nature-1'] || [],
                        operationalStructure: ans['ops-1'] || [],

                        primaryCategory: ans['primaryCategory']?.[0] || '',
                        subcategory1: ans['subcategory1']?.[0] || '',
                        subcategory2: ans['subcategory2']?.[0] || '',
                        subcategory3: ans['subcategory3']?.[0] || '',
                        customCategoryTag: ans['customCategoryTag']?.[0] || '',

                        targetMarket: ans['serve-1'] || [],
                        offers: ans['businessOffers'] || [],

                        country: ans['country']?.[0] || profile?.country || 'Pakistan',
                        city: ans['city']?.[0] || profile?.city || '',
                        state: ans['state']?.[0] || profile?.state || '',
                        address: profile?.businessAddress || ans['address']?.[0] || '',
                        addressLine2: ans['businessAddressLine2']?.[0] || '',
                        zipCode: ans['zipCode']?.[0] || '',

                        latitude: ans['latitude']?.[0] || '',
                        longitude: ans['longitude']?.[0] || '',
                        mapConfirmed: ans['manualPinConfirmed']?.[0] === 'true',

                        phoneCode: phCode,
                        phoneNumber: phNum,
                        whatsappCode: waCode,
                        whatsappNumber: waNum,
                        whatsappSameAsPhone: ans['whatsappSameAsPhone']?.[0] === 'true',
                        businessEmail: profile?.businessEmail || user?.email || '',
                        namedPhoneNumbers: ans['namedPhoneNumbers']?.[0]
                            ? JSON.parse(ans['namedPhoneNumbers'][0]).map((p: { label?: string; personName?: string; title?: string; number?: string }) => ({
                                label: p.label || '',
                                personName: p.personName || '',
                                title: p.title || '',
                                number: p.number || '',
                            }))
                            : [],
                        timezone: ans['businessTimezone']?.[0] || getBrowserTimezone(),

                        open247: ans['open247']?.[0] === 'true',
                        hours: ans['businessHours']?.[0] ? JSON.parse(ans['businessHours'][0]) : {},

                        bio: profile?.bio || ans['bio']?.[0] || '',
                        languages: ans['businessLanguages'] || [],
                        languagesText: (ans['businessLanguages'] || []).join(', '),

                        yearEstablished: ans['yearEstablished']?.[0] || '',
                        employeeSize: ans['employeeSize']?.[0] || '',
                        hasMultipleBranches: ans['hasMultipleBranches']?.[0] === 'true',

                        website: ans['website']?.[0] || '',
                        socialLinks: ans['socialLinks']?.[0] ? JSON.parse(ans['socialLinks'][0]) : prev.socialLinks,

                        amenities: ans['amenities-1'] || [],
                        specialisedSectors: ans['industrySubtypes'] || [],
                        keywords: ans['metaKeywords'] || [],
                        faqs: ans['faqs']?.[0] ? JSON.parse(ans['faqs'][0]) : [],

                        franchiseOpportunity: ans['franchiseOpportunity']?.[0] || 'No',
                        franchiseAreas: ans['franchiseAreas'] || [],
                        franchiseInvestment: ans['franchiseInvestment']?.[0] || '',
                        franchiseSupport: ans['franchiseSupport'] || [],
                        franchiseMinSpace: ans['franchiseMinSpace']?.[0] || '',
                        dealersResellers: ans['dealersResellers']?.[0] || 'No',
                        importerExporter: ans['importerExporter']?.[0] || 'No',
                        areasServed: ans['areasServed'] || [],

                        logoUrl: ans['logoUrl']?.[0] || '',
                        coverImageUrl: ans['coverImageUrl']?.[0] || '',
                        galleryUrls: ans['galleryUrls'] || [],
                        imageCaptions: ans['imageCaptions'] ? JSON.parse(ans['imageCaptions'][0] || '{}') : {},
                    }));
                }
            } catch (err) {
                console.error('Error fetching initial data for wizard:', err);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [user, router]);

    // Setup session & device keys
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const sessionId = sessionStorage.getItem('listingConsentSessionId') || (() => {
            const value = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
            sessionStorage.setItem('listingConsentSessionId', value);
            return value;
        })();

        const deviceId = localStorage.getItem('listingConsentDeviceId') || (() => {
            const value = `dev-${Math.random().toString(36).slice(2, 14)}`;
            localStorage.setItem('listingConsentDeviceId', value);
            return value;
        })();

        setConsentMeta(prev => ({
            ...prev,
            sessionId,
            deviceId
        }));
    }, []);

    // Filter cities based on country, de-duplicate, and sort alphabetically
    useEffect(() => {
        const countryName = stepData.country;
        const filtered = allCities.filter((city) =>
            cityMatchesCountry(city, countryName) &&
            (!stepData.state || !city.state || city.state.toLowerCase() === stepData.state.toLowerCase()),
        );
        const uniqueCities = sortAndDedupeCities(filtered);
        setFilteredCities(uniqueCities);

        const getCountryCode = (cName: string) => {
            if (!cName) return '';
            const match = countryOptions.find(
                (o) => o.name.toLowerCase() === cName.trim().toLowerCase(),
            );
            return match?.code || 'US';
        };

        const fetchAddressConfig = async () => {
            if (!countryName) return;
            try {
                const res = await api.addressConfig.get(getCountryCode(countryName));
                if (res) setAddressConfig(res);
            } catch (err) {
                console.error("Failed to fetch address config", err);
            }
        };
        fetchAddressConfig();
    }, [stepData.country, stepData.state, allCities, countryOptions]);

    const stateOptions = React.useMemo(() => {
        const countryName = stepData.country;
        if (!countryName) return [];
        const matchedCountry = COUNTRIES_STATES.find(c => c.name.toLowerCase() === countryName.trim().toLowerCase());
        if (matchedCountry && matchedCountry.states && matchedCountry.states.length > 0) {
            return cleanAndDedupeStates(matchedCountry.states, countryName);
        }
        return cleanAndDedupeStates(Array.from(
            new Set(
                allCities
                    .filter((city) => cityMatchesCountry(city, countryName))
                    .map((city) => city.state)
                    .filter(Boolean) as string[],
            ),
        ), countryName);
    }, [allCities, stepData.country]);

    const applySelectedCity = (cityName: string) => {
        const normalized = cityName.trim().toLowerCase();
        if (!normalized) return;

        const matchedCity =
            allCities.find(
                (city) =>
                    cityMatchesCountry(city, stepData.country) &&
                    city.name.toLowerCase() === normalized &&
                    (!stepData.state || city.state?.toLowerCase() === stepData.state.toLowerCase()),
            ) ||
            allCities.find(
                (city) => cityMatchesCountry(city, stepData.country) && city.name.toLowerCase() === normalized,
            );

        if (!matchedCity) return;

        setStepData((prev) => ({
            ...prev,
            city: matchedCity.name,
            state: matchedCity.state || prev.state,
            zipCode: matchedCity.postalCode || prev.zipCode,
            latitude: matchedCity.latitude ? String(matchedCity.latitude) : prev.latitude,
            longitude: matchedCity.longitude ? String(matchedCity.longitude) : prev.longitude,
        }));
    };

    const handleActivateBusiness = async () => {
        setActivationError(null);

        const businessName = stepData.businessName.trim();
        const normalizedPhone = stepData.phoneNumber.replace(/^0+/, '');
        const businessPhone = `${stepData.phoneCode}${normalizedPhone}`;
        const businessAddress = stepData.address.trim();

        if (businessName.length < 2) {
            setActivationError('Please enter your business name first.');
            return;
        }
        if (!/^\+[1-9]\d{7,14}$/.test(businessPhone)) {
            setActivationError('Please enter a valid business phone number.');
            return;
        }
        if (businessAddress.length < 5) {
            setActivationError('Please enter your business address before continuing.');
            return;
        }

        setActivatingBusiness(true);
        try {
            await api.businessProfiles.register({
                businessName,
                businessPhone,
                businessAddress,
            });
            await syncProfile();
            router.replace('/business-setup');
        } catch (err: any) {
            setActivationError(err.message || 'Unable to activate your business account right now.');
        } finally {
            setActivatingBusiness(false);
        }
    };

    // GPS-only location detect (consistent with all other screens)
    const detectMyLocation = async () => {
        setGeoDetecting(true);
        setGeoError('');
        try {
            const result = await tryDetectDeviceLocation();
            if (!result.ok) {
                setGeoError(result.message);
                return;
            }
            const coords = result.coords;
            const geo = inferLocationFromCoords(allCities, coords.latitude, coords.longitude);
            setStepData((prev) => ({
                ...prev,
                latitude: String(coords.latitude),
                longitude: String(coords.longitude),
                mapConfirmed: true,
                ...(geo.country && { country: geo.country }),
                ...(geo.city && { city: geo.city }),
                ...(geo.state && { state: geo.state }),
            }));
        } catch {
            setGeoError('Unable to detect location. Please enable GPS permissions or select your city manually.');
        } finally {
            setGeoDetecting(false);
        }
    };

    // City suggestion autocomplete helper
    useEffect(() => {
        if (!mapSearchQuery || mapSearchQuery.trim().length < 3) {
            setMapSearchResults([]);
            setMapSearchError('');
            setMapSearchLoading(false);
            return;
        }

        const timer = setTimeout(() => {
            setMapSearchLoading(true);
            setMapSearchError('');
            const q = mapSearchQuery.trim().toLowerCase();
            const candidates = allCities
                .filter(c => c && (c.name.toLowerCase().includes(q) || (c.state || '').toLowerCase().includes(q)))
                .slice(0, 8)
                .map(c => ({
                    placeId: c.id,
                    description: `${c.name}${c.state ? `, ${c.state}` : ''}, ${c.country}`
                }));
            
            setMapSearchResults(candidates);
            if (candidates.length === 0) {
                setMapSearchError('No matching cities found.');
            }
            setMapSearchLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [allCities, mapSearchQuery]);

    const selectCityAutocomplete = (desc: string) => {
        const city = allCities.find(c => `${c.name}${c.state ? `, ${c.state}` : ''}, ${c.country}` === desc);
        if (!city) return;

        setStepData(prev => ({
            ...prev,
            country: city.country,
            state: city.state || '',
            city: city.name,
            zipCode: city.postalCode || prev.zipCode,
            latitude: city.latitude ? city.latitude.toFixed(7) : prev.latitude,
            longitude: city.longitude ? city.longitude.toFixed(7) : prev.longitude,
            mapConfirmed: true
        }));
        setMapSearchResults([]);
        setMapSearchQuery(desc);
    };

    // Duplicate listing soft alert
    const runDuplicateCheck = async () => {
        try {
            const rawPhone = `${stepData.phoneCode}${stepData.phoneNumber}`;
            const res = await api.businessSetup.checkDuplicate({
                businessName: stepData.businessName,
                phone: rawPhone,
                address: stepData.address,
                city: stepData.city,
                state: stepData.state,
                latitude: stepData.latitude || undefined,
                longitude: stepData.longitude || undefined
            });

            if (res.showPrompt) {
                return window.confirm(
                    `Warning: Potential duplicate business detected by (${res.signals.join(', ')}). Proceed anyway?`
                );
            }
            return true;
        } catch {
            return true; // proceed soft fail
        }
    };

    // Form saving / compilation
    const compileAnswers = () => {
        return {
            'businessTagline': [stepData.businessTagline],
            'contactPersonTitle': [stepData.contactPersonTitle],
            'contactPersonName': [stepData.contactPersonName],
            'type-1': stepData.businessType,
            'nature-1': stepData.coreNature,
            'ops-1': stepData.operationalStructure,
            'primaryCategory': [stepData.primaryCategory],
            'subcategory1': [stepData.subcategory1],
            'subcategory2': [stepData.subcategory2],
            'subcategory3': [stepData.subcategory3],
            'customCategoryTag': [stepData.customCategoryTag],
            'serve-1': stepData.targetMarket,
            'businessOffers': stepData.offers,
            'country': [stepData.country],
            'city': [stepData.city],
            'state': [stepData.state],
            'address': [stepData.address],
            'businessAddressLine2': [stepData.addressLine2],
            'zipCode': [stepData.zipCode],
            'latitude': [stepData.latitude],
            'longitude': [stepData.longitude],
            'manualPinConfirmed': [String(stepData.mapConfirmed)],
            'whatsapp': [`${stepData.whatsappCode}${stepData.whatsappNumber}`],
            'whatsappSameAsPhone': [String(stepData.whatsappSameAsPhone)],
            'namedPhoneNumbers': [JSON.stringify(stepData.namedPhoneNumbers)],
            'businessHours': [JSON.stringify(stepData.hours)],
            'businessTimezone': [stepData.timezone],
            'open247': [String(stepData.open247)],
            'bio': [stepData.bio],
            'businessLanguages': stepData.languages,
            'yearEstablished': [stepData.yearEstablished],
            'employeeSize': [stepData.employeeSize],
            'hasMultipleBranches': [String(stepData.hasMultipleBranches)],
            'website': [stepData.website],
            'socialLinks': [JSON.stringify(stepData.socialLinks)],
            'amenities-1': stepData.amenities,
            'industrySubtypes': stepData.specialisedSectors,
            'metaKeywords': stepData.keywords,
            'faqs': [JSON.stringify(stepData.faqs)],
            'franchiseOpportunity': [stepData.franchiseOpportunity],
            'franchiseAreas': stepData.franchiseAreas,
            'franchiseInvestment': [stepData.franchiseInvestment],
            'franchiseSupport': stepData.franchiseSupport,
            'franchiseMinSpace': [stepData.franchiseMinSpace],
            'dealersResellers': [stepData.dealersResellers],
            'importerExporter': [stepData.importerExporter],
            'areasServed': stepData.areasServed,
            'logoUrl': [stepData.logoUrl],
            'coverImageUrl': [stepData.coverImageUrl],
            'galleryUrls': stepData.galleryUrls,
            'imageCaptions': [JSON.stringify(stepData.imageCaptions)],
        };
    };

    const handleSaveStep = async (next = true) => {
        setSaving(true);
        try {
            const payload = compileAnswers();
            
            // Sync core details on step 1 & step 8 & step 10
            if (currentStep === 0) {
                const businessName = stepData.businessName.trim();
                if (businessName.length >= 2) {
                    await api.businessProfiles.updateProfile({
                        businessName,
                    });
                }
            } else if (currentStep === 7) {
                const businessAddress = stepData.address.trim();
                const profileUpdate: any = {};
                if (businessAddress.length >= 5) profileUpdate.businessAddress = businessAddress;
                if (stepData.city) profileUpdate.city = stepData.city;
                if (stepData.country) profileUpdate.country = stepData.country;
                if (stepData.state) profileUpdate.state = stepData.state;
                if (Object.keys(profileUpdate).length > 0) {
                    await api.businessProfiles.updateProfile(profileUpdate);
                }
            } else if (currentStep === 9) {
                const normalizedPhone = stepData.phoneNumber.replace(/[^\d]/g, '').replace(/^0+/, '');
                const businessPhone = `${stepData.phoneCode}${normalizedPhone}`;
                const businessEmail = stepData.businessEmail.trim();
                const profileUpdate: Record<string, string> = {};

                if (/^\+[1-9]\d{7,14}$/.test(businessPhone)) {
                    profileUpdate.businessPhone = businessPhone;
                }
                if (businessEmail.includes('@')) {
                    profileUpdate.businessEmail = businessEmail;
                }

                if (Object.keys(profileUpdate).length > 0) {
                    await api.businessProfiles.updateProfile(profileUpdate);
                }
            } else if (currentStep === 10) {
                if (stepData.hours && Object.keys(stepData.hours).length > 0) {
                    await api.businessProfiles.updateProfile({
                        businessHours: stepData.hours as any,
                    });
                }
            } else if (currentStep === 11) {
                const bio = stepData.bio.trim();
                if (bio.length >= 20) {
                    await api.businessProfiles.updateProfile({
                        bio,
                    });
                }
            } else if (currentStep === 13) {
                const links = Object.entries(stepData.socialLinks)
                    .filter(([_, url]) => url)
                    .map(([platform, url]) => ({ platform, url }));
                if (links.length > 0) {
                    await api.businessProfiles.updateProfile({
                        socialLinks: links as any,
                    });
                }
            }

            await api.businessSetup.saveAnswers(payload);

            if (next) {
                setCurrentStep(prev => Math.min(prev + 1, 20));
            } else {
                setCurrentStep(prev => Math.max(prev - 1, 0));
            }
            window.scrollTo(0, 0);
        } catch (err: any) {
            console.error('Failed to save wizard progress step:', err);
            // Proceed anyway to ensure robust client execution if endpoints return 404 on staging
            if (next) {
                setCurrentStep(prev => Math.min(prev + 1, 20));
            } else {
                setCurrentStep(prev => Math.max(prev - 1, 0));
            }
            window.scrollTo(0, 0);
        } finally {
            setSaving(false);
        }
    };

    const handleFinalSubmit = async () => {
        setSaving(true);
        try {
            if (
                !stepData.termsAccepted ||
                !stepData.privacyAccepted ||
                !stepData.moderationAccepted ||
                !stepData.accuracyConfirmed ||
                !stepData.publicLocationConsent
            ) {
                alert('Please complete all required legal consent checkboxes before finishing.');
                setSaving(false);
                return;
            }

            const isDupCheckOk = await runDuplicateCheck();
            if (!isDupCheckOk) {
                setSaving(false);
                return;
            }

            const payload: any = compileAnswers();
            payload.legalConsentAccepted = ['true'];
            payload.legalConsentAcceptedAt = [new Date().toISOString()];
            payload.legalConsentSessionId = [consentMeta.sessionId];
            payload.legalConsentDeviceId = [consentMeta.deviceId];
            payload.termsVersion = ['v1'];
            payload.privacyVersion = ['v1'];
            payload.moderationPolicyVersion = ['v1'];
            payload.legalConsentTerms = [String(stepData.termsAccepted)];
            payload.legalConsentPrivacy = [String(stepData.privacyAccepted)];
            payload.legalConsentModeration = [String(stepData.moderationAccepted)];
            payload.legalConsentAccuracy = [String(stepData.accuracyConfirmed)];
            payload.legalConsentPublicLocation = [String(stepData.publicLocationConsent)];
            payload.legalConsentMarketing = [String(stepData.marketingUpdatesConsent)];

            await api.businessSetup.saveAnswers(payload);
            await syncProfile();
            setCompleted(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (err) {
            console.error('Final signup wizard submission error:', err);
            setCompleted(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } finally {
            setSaving(false);
        }
    };

    // Validation checks for each step before advancing
    const handleNextBtnClick = async () => {
        if (currentStep === 0) {
            // Step 1: Business Name
            if (!stepData.businessName.trim()) {
                alert('Please enter your business name.');
                return;
            }
        }
        else if (currentStep === 7) {
            // Step 8: Business Address
            if (!stepData.country || !stepData.city || !stepData.address.trim()) {
                alert('Please fill in country, city, and street address.');
                return;
            }

            // Validate state if required
            const stateField = addressConfig?.fields?.find((f: any) => f.key === 'state');
            if (stateField?.required && !stepData.state) {
                alert(`Please select or fill in the ${stateField.label || 'State'}.`);
                return;
            }

            // Validate zip/postal code
            if (addressConfig?.postalCode) {
                const pc = addressConfig.postalCode;
                const value = stepData.zipCode.trim();
                if (pc.required && !value) {
                    alert(`Please enter a valid ${pc.label || 'Postal/ZIP Code'}.`);
                    return;
                }
                if (value) {
                    const postalVal = validatePostalCode(stepData.country, value);
                    if (!postalVal.valid) {
                        alert(`Please enter a valid ${pc.label || 'Postal/ZIP Code'} format for ${stepData.country}. Example: ${postalVal.example || '12345'}`);
                        return;
                    }
                }
                if (value && pc.regex) {
                    try {
                        const regex = new RegExp(pc.regex, 'i');
                        if (!regex.test(value)) {
                            alert(`Please enter a valid ${pc.label || 'Postal/ZIP Code'} format.`);
                            return;
                        }
                    } catch (e) {
                        console.error('Invalid postal code regex:', pc.regex);
                    }
                }
            }
        }
        else if (currentStep === 8) {
            // Step 9: Map Pin
            if (!stepData.latitude || !stepData.longitude || !stepData.mapConfirmed) {
                alert('Please confirm your map location coordinates and check the confirmation box.');
                return;
            }
            const lat = parseFloat(stepData.latitude);
            const lng = parseFloat(stepData.longitude);
            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                alert('Please enter valid GPS coordinates (latitude -90 to 90, longitude -180 to 180).');
                return;
            }
        }
        else if (currentStep === 9) {
            // Step 10: Contact details
            if (!stepData.phoneNumber.trim()) {
                alert('Primary phone number is required.');
                return;
            }
            const phoneUtil = PhoneNumberUtil.getInstance();
            
            try {
                const fullPhone = `${stepData.phoneCode}${stepData.phoneNumber}`;
                const parsedNumber = phoneUtil.parseAndKeepRawInput(fullPhone);
                if (!phoneUtil.isValidNumber(parsedNumber)) {
                    alert('Please enter a valid phone number (8-15 digits).');
                    return;
                }
            } catch (e) {
                alert('Please enter a valid phone number (8-15 digits).');
                return;
            }

            if (stepData.whatsappNumber.trim()) {
                try {
                    const fullWa = `${stepData.whatsappCode}${stepData.whatsappNumber}`;
                    const parsedWa = phoneUtil.parseAndKeepRawInput(fullWa);
                    if (!phoneUtil.isValidNumber(parsedWa)) {
                        alert('Please enter a valid WhatsApp phone number (8-15 digits).');
                        return;
                    }
                } catch (e) {
                    alert('Please enter a valid WhatsApp phone number (8-15 digits).');
                    return;
                }
            }
            if (!stepData.businessEmail.trim() || !stepData.businessEmail.includes('@')) {
                alert('A valid business email is required.');
                return;
            }
        }
        else if (currentStep === 11) {
            // Step 12: Bio description length limits
            const len = stepData.bio.trim().length;
            if (len > 0 && len < 20) {
                alert('Description must be at least 20 characters if provided.');
                return;
            }
        }
        else if (currentStep === 16) {
            if (stepData.keywords.some((keyword) => keyword.trim().length > 40)) {
                alert('Each keyword must be 40 characters or less.');
                return;
            }
        }
        else if (currentStep === 17) {
            if (stepData.faqs.some((faq) => faq.question.trim().length > 200 || faq.answer.trim().length > 1000)) {
                alert('FAQs must keep questions under 200 characters and answers under 1,000 characters.');
                return;
            }
        }

        if (currentStep === 8) {
            const isDupOk = await runDuplicateCheck();
            if (!isDupOk) return;
        }

        await handleSaveStep(true);
    };

    // Listing Questions doc — options loaded from /business-setup/questions
    const getQuestionByCategory = (category: string) =>
        setupQuestions.find((q) => q.category === category);

    const mergeQuestionOptions = (category: string, fallback: string[]): string[] => {
        const apiOpts = getQuestionByCategory(category)?.options;
        if (!Array.isArray(apiOpts) || apiOpts.length === 0) return fallback;
        const seen = new Set(apiOpts);
        return [...apiOpts, ...fallback.filter((o) => !seen.has(o))];
    };

    const getQuestionHeading = (category: string, fallback: string) =>
        getQuestionByCategory(category)?.question || fallback;

    const allOperationalOptions = Object.values(OPERATIONAL_STRUCTURE_SECTIONS).flatMap((s) => s.options);
    const allIndustryOptions = Object.values(SPECIALISED_SECTORS).flatMap((s) => s.options);
    const allAmenityOptions = Object.values(AMENITIES_SECTIONS).flatMap((s) => s.options);

    // Helper options toggle
    const toggleMultiSelectOption = (field: 'businessType' | 'coreNature' | 'operationalStructure' | 'targetMarket' | 'languages' | 'amenities' | 'specialisedSectors' | 'franchiseAreas' | 'franchiseSupport' | 'areasServed', val: string) => {
        setStepData(prev => {
            const list = prev[field] as string[];
            if (list.includes(val)) {
                return { ...prev, [field]: list.filter(item => item !== val) };
            } else {
                return { ...prev, [field]: [...list, val] };
            }
        });
    };

    // Step 7: Offers tags helper
    const [offerInput, setOfferInput] = useState('');
    const addOfferTag = () => {
        if (offerInput.trim() && !stepData.offers.includes(offerInput.trim())) {
            setStepData(prev => ({ ...prev, offers: [...prev.offers, offerInput.trim()] }));
            setOfferInput('');
        }
    };

    // Step 17: Keywords tags helper
    const [keywordInput, setKeywordInput] = useState('');
    const addKeywordTag = () => {
        if (keywordInput.trim() && stepData.keywords.length < 10) {
            const kw = keywordInput.trim().replace(/#/g, '').slice(0, 40);
            if (!stepData.keywords.includes(kw)) {
                setStepData(prev => ({ ...prev, keywords: [...prev.keywords, kw] }));
                setKeywordInput('');
            }
        }
    };

    // Step 18: FAQ helpers
    const [faqQ, setFaqQ] = useState('');
    const [faqA, setFaqA] = useState('');
    const addFaqItem = () => {
        if (faqQ.trim() && faqA.trim() && stepData.faqs.length < 10) {
            setStepData(prev => ({
                ...prev,
                faqs: [...prev.faqs, { question: faqQ.trim(), answer: faqA.trim() }]
            }));
            setFaqQ('');
            setFaqA('');
        }
    };
    const removeFaqItem = (idx: number) => {
        setStepData(prev => ({
            ...prev,
            faqs: prev.faqs.filter((_, i) => i !== idx)
        }));
    };

    // Step 20: Media uploads
    const triggerImageUpload = async (file: File, target: 'logoUrl' | 'coverImageUrl' | 'gallery') => {
        setSaving(true);
        try {
            if (target === 'gallery' && isFree && stepData.galleryUrls.length >= 3) {
                alert('Free plans can publish up to 3 gallery images.');
                return;
            }
            const res = await api.listings.uploadImage(file);
            if (target === 'gallery') {
                setStepData(prev => ({ ...prev, galleryUrls: [...prev.galleryUrls, res.url] }));
            } else {
                setStepData(prev => ({ ...prev, [target]: res.url }));
            }
        } catch (e) {
            alert('Upload failed. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Render Wizard Body
    const renderStepContent = () => {
        const currentYear = new Date().getFullYear();
        const yearsList = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => String(currentYear - i));

        switch (currentStep) {
            case 0: // Step 1: Business Identity
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-xl font-black text-slate-800">Business Identity</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 1 of 21 • Required</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Business Name *</label>
                                <input
                                    type="text"
                                    value={stepData.businessName}
                                    onChange={e => setStepData({...stepData, businessName: e.target.value})}
                                    placeholder="Enter business name..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-bold text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Business Tagline</label>
                                <input
                                    type="text"
                                    value={stepData.businessTagline}
                                    onChange={e => setStepData({...stepData, businessTagline: e.target.value})}
                                    placeholder="A catchphrase that describes your business value..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-bold text-slate-800"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Title</label>
                                    <select
                                        value={stepData.contactPersonTitle}
                                        onChange={e => setStepData({...stepData, contactPersonTitle: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-bold text-slate-800"
                                    >
                                        <option value="">Select</option>
                                        <option value="Mr.">Mr.</option>
                                        <option value="Ms.">Ms.</option>
                                        <option value="Dr.">Dr.</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contact Person Name</label>
                                    <input
                                        type="text"
                                        value={stepData.contactPersonName}
                                        onChange={e => setStepData({...stepData, contactPersonName: e.target.value})}
                                        placeholder="Full name..."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-bold text-slate-800"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 1: // Step 2: Business Type
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-xl font-black text-slate-800">{getQuestionHeading('Business Type', 'Business Presence Type')}</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 2 of 21 • Optional</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {mergeQuestionOptions('Business Type', ['Physical Location', 'Home-Based Business', 'Online / Digital Only', 'On-Site at Client Location', 'Mobile Unit']).map(opt => {
                                const selected = stepData.businessType.includes(opt);
                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => toggleMultiSelectOption('businessType', opt)}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all font-bold text-left ${selected ? 'border-blue-600 bg-blue-50/50 text-blue-700' : 'border-slate-100 bg-slate-50/50 hover:bg-white text-slate-600'}`}
                                    >
                                        <span>{opt}</span>
                                        {selected && <Check className="w-4 h-4 text-blue-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );

            case 2: // Step 3: Core Nature
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-xl font-black text-slate-800">{getQuestionHeading('Core Business Nature', 'Core Business Nature')}</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 3 of 21 • Optional</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {mergeQuestionOptions('Core Business Nature', [
                                'We sell physical products', 'We sell digital products', 'We provide in-person services', 'We provide online or remote services',
                                'We rent out products, spaces, or equipment', 'We offer bookings or appointments', 'We organise events, classes, or experiences',
                                'We offer delivery to customers', 'We operate as a marketplace or multi-business platform', 'We offer subscriptions or memberships'
                            ]).map(opt => {
                                const selected = stepData.coreNature.includes(opt);
                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => toggleMultiSelectOption('coreNature', opt)}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all font-bold text-left ${selected ? 'border-blue-600 bg-blue-50/50 text-blue-700' : 'border-slate-100 bg-slate-50/50 hover:bg-white text-slate-600'}`}
                                    >
                                        <span>{opt}</span>
                                        {selected && <Check className="w-4 h-4 text-blue-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );

            case 3: // Step 4: Operational Structure
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-xl font-black text-slate-800">{getQuestionHeading('Operational Structure', 'Operational Structure')}</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 4 of 21 • Optional</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {mergeQuestionOptions('Operational Structure', allOperationalOptions).map(opt => {
                                const selected = stepData.operationalStructure.includes(opt);
                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => toggleMultiSelectOption('operationalStructure', opt)}
                                        className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all font-bold text-left text-sm ${selected ? 'border-blue-600 bg-blue-50/50 text-blue-700' : 'border-slate-100 bg-slate-50/50 hover:bg-white text-slate-600'}`}
                                    >
                                        <span>{opt}</span>
                                        {selected && <Check className="w-4 h-4 text-blue-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );

            case 4: { // Step 5: Category & Subcategory
                const relatedSubcategories = categories.filter(c => c.parentId === stepData.primaryCategory);

                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-xl font-black text-slate-800">Business Category</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 5 of 21 • Optional</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Primary Category</label>
                                <CategorySearchSelect
                                    categories={categories.filter(c => !c.parentId)}
                                    value={stepData.primaryCategory}
                                    onChange={catId => setStepData({...stepData, primaryCategory: catId, subcategory1: '', subcategory2: '', subcategory3: ''})}
                                    loading={false}
                                />
                            </div>

                            {stepData.primaryCategory && relatedSubcategories.length > 0 && (
                                <div className="space-y-4 pt-2 border-t border-slate-100">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                                        {maxSubCategories > 0 ? `Subcategories (Select up to ${maxSubCategories})` : 'Subcategories (Paid plans unlock up to 3)'}
                                    </h4>
                                    {maxSubCategories === 0 && <PremiumFeatureBanner />}

                                    {Array.from({ length: totalSubCategorySlots }).map((_, index) => {
                                        const key = (`subcategory${index + 1}` as 'subcategory1' | 'subcategory2' | 'subcategory3');
                                        const currentValue = stepData[key];
                                        const previousSelections = [stepData.subcategory1, stepData.subcategory2, stepData.subcategory3]
                                            .slice(0, index)
                                            .filter(Boolean);
                                        const availableOptions = relatedSubcategories.filter((sub) => !previousSelections.includes(sub.name) || sub.name === currentValue);
                                        const locked = index >= maxSubCategories;

                                        return (
                                            <div key={key}>
                                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                                    Subcategory {index + 1}
                                                </label>
                                                <select
                                                    value={currentValue}
                                                    disabled={locked}
                                                    onChange={e => setStepData({ ...stepData, [key]: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                                >
                                                    <option value="">{locked ? '-- Upgrade to unlock --' : `-- Select Subcategory ${index + 1} --`}</option>
                                                    {availableOptions.map(sub => (
                                                        <option key={sub.id} value={sub.name}>{sub.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="pt-2 border-t border-slate-100">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Custom Category Tag (If not listed above)</label>
                                <input
                                    type="text"
                                    value={stepData.customCategoryTag}
                                    onChange={e => setStepData({...stepData, customCategoryTag: e.target.value})}
                                    placeholder="e.g. Specialty Organic Bakery..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-bold"
                                />
                            </div>
                        </div>
                    </div>
                );
            }

            case 5: // Step 6: Target Market
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-xl font-black text-slate-800">{getQuestionHeading('Who Do You Serve', 'Target Market (Who Do You Serve?)')}</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 6 of 21 • Optional</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {mergeQuestionOptions('Who Do You Serve', ['B2C - Individual Consumers', 'B2B - Other Businesses', 'B2G - Government & Public Sector', 'D2C - Direct to Consumer', 'Wholesale Buyers', 'International Clients']).map(opt => {
                                const selected = stepData.targetMarket.includes(opt);
                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => toggleMultiSelectOption('targetMarket', opt)}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all font-bold text-left ${selected ? 'border-blue-600 bg-blue-50/50 text-blue-700' : 'border-slate-100 bg-slate-50/50 hover:bg-white text-slate-600'}`}
                                    >
                                        <span>{opt}</span>
                                        {selected && <Check className="w-4 h-4 text-blue-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );

            case 6: // Step 7: What Your Business Offers
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-xl font-black text-slate-800">Key Offerings</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 7 of 21 • Optional</p>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Products & Services offered</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={offerInput}
                                    onChange={e => setOfferInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOfferTag(); } }}
                                    placeholder="Type a product or service (e.g. Wedding Photography, AC Repair) and press Enter..."
                                    className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                />
                                <button
                                    type="button"
                                    onClick={addOfferTag}
                                    className="px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-sm uppercase tracking-wider"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {stepData.offers.map(tag => (
                                    <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-550 border border-blue-100 text-blue-700 font-black text-xs rounded-lg">
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => setStepData(prev => ({ ...prev, offers: prev.offers.filter(o => o !== tag) }))}
                                            className="text-blue-500 hover:text-blue-700"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 7: // Step 8: Address details
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-xl font-black text-slate-800">Business Address</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 8 of 21 • Required</p>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Country *</label>
                                    <select
                                        required
                                        value={stepData.country}
                                        onChange={e => setStepData({...stepData, country: e.target.value, city: '', state: '', zipCode: ''})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-800"
                                    >
                                        <option value="">Select a country</option>
                                        {countries.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">City *</label>
                                    <input
                                        required
                                        list="city-list"
                                        value={stepData.city}
                                        onChange={e => {
                                            const nextCity = e.target.value;
                                            setStepData({...stepData, city: nextCity});
                                            applySelectedCity(nextCity);
                                        }}
                                        placeholder="Type or select a city"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                    />
                                    <datalist id="city-list">
                                        {filteredCities.map(c => (
                                            <option key={c.id} value={c.name} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(!addressConfig || addressConfig?.fields?.find((f: any) => f.key === 'state')) && (
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                            {addressConfig?.fields?.find((f: any) => f.key === 'state')?.label || 'State / Province'}
                                            {addressConfig?.fields?.find((f: any) => f.key === 'state')?.required ? ' *' : ''}
                                        </label>
                                        {stateOptions.length > 0 ? (
                                            <select
                                                required={addressConfig?.fields?.find((f: any) => f.key === 'state')?.required}
                                                value={stepData.state}
                                                onChange={e => setStepData({...stepData, state: e.target.value, city: '', zipCode: ''})}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-800"
                                            >
                                                <option value="">Select State / Province</option>
                                                {stateOptions.map((state) => (
                                                    <option key={state} value={state}>{state}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={stepData.state}
                                                onChange={e => setStepData({...stepData, state: e.target.value, city: '', zipCode: ''})}
                                                placeholder="e.g. Punjab, Dubai, New York..."
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                            />
                                        )}
                                    </div>
                                )}
                                {(!addressConfig || addressConfig.postalCode?.label) && (
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                            {addressConfig?.postalCode?.label || 'Zip / Postal Code'}
                                            {addressConfig?.postalCode?.required ? ' *' : ''}
                                        </label>
                                        <input
                                            type="text"
                                            value={stepData.zipCode}
                                            onChange={e => setStepData({...stepData, zipCode: e.target.value})}
                                            placeholder={`e.g. 10001, SW1A 1AA... ${addressConfig?.postalCode?.required ? '' : '(Optional)'}`}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Street Address *</label>
                                <AddressPlacesAutocomplete
                                    value={stepData.address}
                                    onChange={(value) => setStepData({ ...stepData, address: value })}
                                    countryCode={countryOptions.find((c) => c.name === stepData.country)?.code}
                                    onPlaceSelected={(place) => {
                                        setStepData((prev) => ({
                                            ...prev,
                                            address: place.streetAddress || place.formattedAddress || prev.address,
                                            ...(place.city && { city: place.city }),
                                            ...(place.state && { state: place.state }),
                                            ...(place.postalCode && { zipCode: place.postalCode }),
                                            ...(place.country && { country: place.country }),
                                            latitude: String(place.latitude),
                                            longitude: String(place.longitude),
                                            mapConfirmed: true,
                                        }));
                                    }}
                                    placeholder="Start typing street address (min 3 characters)..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                    required
                                />
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">Google Places suggestions — or type manually if unavailable.</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Street Address Line 2 (Optional)</label>
                                <input
                                    type="text"
                                    value={stepData.addressLine2}
                                    onChange={e => setStepData({...stepData, addressLine2: e.target.value})}
                                    placeholder="Apartment, suite, landmark, floor..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 8: // Step 9: Confirm Location Map
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-xl font-black text-slate-800">Map Placement & Coordinates</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 9 of 21 • Required</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search City to Auto-fill GPS Coordinates</label>
                                <input
                                    type="text"
                                    placeholder="Type city name..."
                                    value={mapSearchQuery}
                                    onChange={e => setMapSearchQuery(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                />
                                {mapSearchLoading && <p className="text-xs text-blue-600 font-bold">Searching cities...</p>}
                                {mapSearchError && <p className="text-xs text-red-500 font-bold">{mapSearchError}</p>}
                                {mapSearchResults.length > 0 && (
                                    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                                        {mapSearchResults.map(res => (
                                            <button
                                                key={res.placeId}
                                                type="button"
                                                onClick={() => selectCityAutocomplete(res.description)}
                                                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                                            >
                                                {res.description}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={detectMyLocation}
                                    disabled={geoDetecting}
                                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5"
                                >
                                    {geoDetecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                                    Use My GPS Location
                                </button>
                                {geoError && <span className="self-center text-xs font-bold text-amber-600">{geoError}</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Latitude *</label>
                                    <input
                                        type="text"
                                        value={stepData.latitude}
                                        onChange={e => setStepData({...stepData, latitude: e.target.value})}
                                        placeholder="e.g. 33.6844"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Longitude *</label>
                                    <input
                                        type="text"
                                        value={stepData.longitude}
                                        onChange={e => setStepData({...stepData, longitude: e.target.value})}
                                        placeholder="e.g. 73.0479"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="rounded-2xl overflow-hidden border border-slate-200 h-[320px] relative">
                                    <DraggablePinMap
                                        latitude={parseFloat(stepData.latitude) || 30.3753}
                                        longitude={parseFloat(stepData.longitude) || 69.3451}
                                        onChange={(lat, lng) => {
                                            setStepData((prev) => ({
                                                ...prev,
                                                latitude: lat.toFixed(7),
                                                longitude: lng.toFixed(7),
                                                mapConfirmed: true,
                                            }));
                                        }}
                                    />
                                    <div className="absolute top-3 left-3 z-[500] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm pointer-events-none">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Drag pin or click map to adjust</p>
                                    </div>
                                </div>

                            {stepData.latitude && stepData.longitude && (
                                <a
                                    href={`https://www.openstreetmap.org/?mlat=${stepData.latitude}&mlon=${stepData.longitude}#map=16/${stepData.latitude}/${stepData.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-black uppercase tracking-wider hover:underline"
                                >
                                    Check location on OpenStreetMap
                                </a>
                            )}

                            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 mt-4 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={stepData.mapConfirmed}
                                    onChange={e => setStepData({...stepData, mapConfirmed: e.target.checked})}
                                    className="mt-1 h-4 w-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-bold text-slate-700">I confirm the coordinates align accurately with my business address. *</span>
                            </label>
                        </div>
                    </div>
                );

            case 9: // Step 10: Contact details
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-xl font-black text-slate-800">Contact Details</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 10 of 21 • Required</p>
                        </div>
                        <div className="space-y-4 overflow-hidden">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Contact Person Name *</label>
                                <input
                                    type="text"
                                    value={stepData.contactPersonName}
                                    onChange={e => setStepData({...stepData, contactPersonName: e.target.value})}
                                    placeholder="Full name..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-bold text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Primary Phone Number *</label>
                                <div className="flex items-center gap-2 min-w-0">
                                    <select
                                        value={stepData.phoneCode}
                                        onChange={e => setStepData({...stepData, phoneCode: e.target.value})}
                                        className="shrink-0 w-[140px] px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-700 text-sm"
                                    >
                                        {DIAL_CODES.map(d => (
                                            <option key={d.code} value={d.dialCode}>{d.code} ({d.dialCode})</option>
                                        ))}
                                    </select>
                                    <input
                                        type="tel"
                                        value={stepData.phoneNumber}
                                        onChange={e => {
                                            const cleaned = cleanPastedPhone(e.target.value, stepData.phoneCode);
                                            setStepData(prev => ({
                                                ...prev,
                                                phoneCode: cleaned.dialCode || prev.phoneCode,
                                                phoneNumber: cleaned.phoneNumber
                                            }));
                                        }}
                                        placeholder="e.g. 3001234567"
                                        className="flex-1 min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                {!hasWhatsappIntegration && <PremiumFeatureBanner />}
                                <label className="flex items-center gap-2 cursor-pointer mb-2 ml-1">
                                    <input
                                        type="checkbox"
                                        checked={stepData.whatsappSameAsPhone}
                                        onChange={e => {
                                            const checked = e.target.checked;
                                            setStepData(prev => ({
                                                ...prev,
                                                whatsappSameAsPhone: checked,
                                                whatsappCode: checked ? prev.phoneCode : prev.whatsappCode,
                                                whatsappNumber: checked ? prev.phoneNumber : prev.whatsappNumber
                                            }));
                                        }}
                                        className="h-4 w-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                                    />
                                    <span className="text-xs font-bold text-slate-600">WhatsApp number is the same as primary phone</span>
                                </label>
                                
                                {!stepData.whatsappSameAsPhone && (
                                    <div className="flex items-center gap-2 min-w-0">
                                        <select
                                            value={stepData.whatsappCode}
                                            onChange={e => setStepData({...stepData, whatsappCode: e.target.value})}
                                            className="shrink-0 w-[140px] px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-700 text-sm"
                                        >
                                            {DIAL_CODES.map(d => (
                                                <option key={d.code} value={d.dialCode}>{d.code} ({d.dialCode})</option>
                                            ))}
                                        </select>
                                        <input
                                            type="tel"
                                            value={stepData.whatsappNumber}
                                            onChange={e => {
                                                const cleaned = cleanPastedPhone(e.target.value, stepData.whatsappCode);
                                                setStepData(prev => ({
                                                    ...prev,
                                                    whatsappCode: cleaned.dialCode || prev.whatsappCode,
                                                    whatsappNumber: cleaned.phoneNumber
                                                }));
                                            }}
                                            placeholder="e.g. 3007654321"
                                            className="flex-1 min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Business Email *</label>
                                <input
                                    type="email"
                                    value={stepData.businessEmail}
                                    onChange={e => setStepData({...stepData, businessEmail: e.target.value})}
                                    placeholder="contact@mybusiness.com"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-800"
                                />
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Additional Named Phone Numbers{maxNamedPhoneNumbers === 0 ? ' (Premium Only)' : ''}</label>
                                {maxNamedPhoneNumbers === 0 && <PremiumFeatureBanner />}
                                <div className="space-y-2">
                                    {stepData.namedPhoneNumbers.map((p, idx) => (
                                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <input
                                                type="text"
                                                placeholder="Label (Sales, Support)"
                                                value={p.label}
                                                onChange={e => {
                                                    const updated = [...stepData.namedPhoneNumbers];
                                                    updated[idx].label = e.target.value;
                                                    setStepData({...stepData, namedPhoneNumbers: updated});
                                                }}
                                                className="px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-xs"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Person name"
                                                value={p.personName}
                                                onChange={e => {
                                                    const updated = [...stepData.namedPhoneNumbers];
                                                    updated[idx].personName = e.target.value;
                                                    setStepData({...stepData, namedPhoneNumbers: updated});
                                                }}
                                                className="px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-xs"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Title / role"
                                                value={p.title}
                                                onChange={e => {
                                                    const updated = [...stepData.namedPhoneNumbers];
                                                    updated[idx].title = e.target.value;
                                                    setStepData({...stepData, namedPhoneNumbers: updated});
                                                }}
                                                className="px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-xs"
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="+923001234567"
                                                    value={p.number}
                                                    onChange={e => {
                                                        const updated = [...stepData.namedPhoneNumbers];
                                                        updated[idx].number = e.target.value;
                                                        setStepData({...stepData, namedPhoneNumbers: updated});
                                                    }}
                                                    className="flex-grow px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-xs"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setStepData({
                                                            ...stepData,
                                                            namedPhoneNumbers: stepData.namedPhoneNumbers.filter((_, i) => i !== idx)
                                                        });
                                                    }}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {stepData.namedPhoneNumbers.length < 5 && (
                                        <button
                                            type="button"
                                            onClick={() => setStepData({...stepData, namedPhoneNumbers: [...stepData.namedPhoneNumbers, { label: '', personName: '', title: '', number: '' }]})}
                                            className="inline-flex items-center gap-1 text-xs font-black text-blue-600 uppercase tracking-wider mt-1 hover:underline"
                                        >
                                            + Add Additional Number
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 10: // Step 11: Business Hours
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-xl font-black text-slate-800">Business Hours</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 11 of 21 • Optional</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Business Timezone</label>
                                <input
                                    type="text"
                                    value={stepData.timezone}
                                    onChange={e => setStepData({ ...stepData, timezone: e.target.value })}
                                    placeholder="e.g. Asia/Karachi"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-sm"
                                />
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">Auto-detected from your device — edit if your hours follow a different timezone.</p>
                            </div>

                            <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={stepData.open247}
                                    onChange={e => setStepData({...stepData, open247: e.target.checked})}
                                    className="h-4 w-4 rounded text-blue-600 border-slate-300"
                                />
                                <span className="text-sm font-black text-slate-700">Open 24 hours a day, 7 days a week</span>
                            </label>

                            {!stepData.open247 && (
                                <div className="space-y-3 pt-2">
                                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(d => {
                                        const record = stepData.hours[d] || { isOpen: false, openTime: '09:00', closeTime: '17:00' };
                                        return (
                                            <div key={d} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                                                <div className="flex items-center gap-2 w-1/3">
                                                    <input
                                                        type="checkbox"
                                                        checked={record.isOpen}
                                                        onChange={e => {
                                                            const updated = { ...stepData.hours };
                                                            updated[d] = { ...record, isOpen: e.target.checked };
                                                            setStepData({...stepData, hours: updated});
                                                        }}
                                                        className="h-4 w-4 rounded text-blue-600"
                                                    />
                                                    <span className="text-sm font-black text-slate-700 capitalize">{d}</span>
                                                </div>
                                                
                                                {record.isOpen ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="time"
                                                            value={record.openTime}
                                                            onChange={e => {
                                                                const updated = { ...stepData.hours };
                                                                updated[d] = { ...record, openTime: e.target.value };
                                                                setStepData({...stepData, hours: updated});
                                                            }}
                                                            className="px-2 py-1 border rounded bg-white font-semibold text-xs"
                                                        />
                                                        <span className="text-xs text-slate-400 font-bold">to</span>
                                                        <input
                                                            type="time"
                                                            value={record.closeTime}
                                                            onChange={e => {
                                                                const updated = { ...stepData.hours };
                                                                updated[d] = { ...record, closeTime: e.target.value };
                                                                setStepData({...stepData, hours: updated});
                                                            }}
                                                            className="px-2 py-1 border rounded bg-white font-semibold text-xs"
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Closed</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 11: // Step 12: Description & Languages
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-xl font-black text-slate-800">Business Description & Languages</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 12 of 21 • Optional</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Short Description (Bio) * (Min 20, Max 2000 chars)</label>
                                <textarea
                                    rows={6}
                                    value={stepData.bio}
                                    onChange={e => setStepData({...stepData, bio: e.target.value})}
                                    placeholder="Write details about your business offerings, values, history, and why users should choose you..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-700 resize-none leading-relaxed"
                                />
                                <p className="text-[10px] font-bold text-slate-400 text-right mt-1">{stepData.bio.length} / 2000</p>
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Spoken / Supported Languages</label>
                                <p className="text-[10px] text-slate-400 font-medium mb-2 ml-1">Enter languages separated by commas (e.g. English, Urdu, Arabic)</p>
                                <input
                                    type="text"
                                    value={stepData.languagesText}
                                    onChange={e => setStepData({...stepData, languagesText: e.target.value, languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                                    placeholder="English, Urdu, Arabic, Hindi..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-700"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 12: // Step 13: Year Established & Team Size
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-xl font-black text-slate-800">Experience & Maturity</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 13 of 21 • Optional</p>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Year Established</label>
                                    <input
                                        type="number"
                                        min="1900"
                                        max={new Date().getFullYear()}
                                        placeholder="e.g. 2015"
                                        value={stepData.yearEstablished}
                                        onChange={e => setStepData({...stepData, yearEstablished: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Team Size (Employees)</label>
                                    <select
                                        value={stepData.employeeSize}
                                        onChange={e => setStepData({...stepData, employeeSize: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-700 cursor-pointer"
                                    >
                                        <option value="">-- Select Team Size --</option>
                                        {EMPLOYEE_SIZE_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer mt-2">
                                <input
                                    type="checkbox"
                                    checked={stepData.hasMultipleBranches}
                                    onChange={e => setStepData({...stepData, hasMultipleBranches: e.target.checked})}
                                    className="mt-1 h-4 w-4 rounded text-blue-600 border-slate-300"
                                />
                                <div>
                                    <span className="text-sm font-black text-slate-700">This business operates in multiple branches / chains</span>
                                    <span className="block text-xs text-slate-400 font-semibold mt-1">Note: Each physical branch must be registered as a separate listing.</span>
                                </div>
                            </label>
                        </div>
                    </div>
                );

            case 13: // Step 14: Website & Social Media
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-800">Online Profile Links</h3>
                                {isFree && <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full"><Lock className="w-3 h-3" /> Upgrade Incentive</span>}
                            </div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 14 of 21 • Optional</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Website URL (Must start with https://)</label>
                                <input
                                    type="url"
                                    value={stepData.website}
                                    onChange={e => setStepData({...stepData, website: e.target.value})}
                                    placeholder="https://www.mywebsite.com"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-700"
                                />
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Social Media Links</p>
                                {isFree && (
                                    <div className="mb-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-3 text-xs font-bold text-amber-700">
                                        Social links will still be saved now. Upgrade later to unlock them on your live profile.
                                    </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Facebook Page</label>
                                        <input
                                            type="url"
                                            value={stepData.socialLinks.facebook}
                                            onChange={e => setStepData({...stepData, socialLinks: {...stepData.socialLinks, facebook: e.target.value}})}
                                            placeholder="https://facebook.com/..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Instagram Profile</label>
                                        <input
                                            type="url"
                                            value={stepData.socialLinks.instagram}
                                            onChange={e => setStepData({...stepData, socialLinks: {...stepData.socialLinks, instagram: e.target.value}})}
                                            placeholder="https://instagram.com/..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">TikTok</label>
                                        <input
                                            type="url"
                                            value={stepData.socialLinks.tiktok}
                                            onChange={e => setStepData({...stepData, socialLinks: {...stepData.socialLinks, tiktok: e.target.value}})}
                                            placeholder="https://tiktok.com/@..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Twitter / X</label>
                                        <input
                                            type="url"
                                            value={stepData.socialLinks.twitter}
                                            onChange={e => setStepData({...stepData, socialLinks: {...stepData.socialLinks, twitter: e.target.value}})}
                                            placeholder="https://x.com/..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">LinkedIn Profile</label>
                                        <input
                                            type="url"
                                            value={stepData.socialLinks.linkedin}
                                            onChange={e => setStepData({...stepData, socialLinks: {...stepData.socialLinks, linkedin: e.target.value}})}
                                            placeholder="https://linkedin.com/in/..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">YouTube Channel</label>
                                        <input
                                            type="url"
                                            value={stepData.socialLinks.youtube}
                                            onChange={e => setStepData({...stepData, socialLinks: {...stepData.socialLinks, youtube: e.target.value}})}
                                            placeholder="https://youtube.com/c/..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-700"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Custom Additional Links */}
                            <div className="pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional Links</label>
                                    <button
                                        type="button"
                                        onClick={() => setStepData({
                                            ...stepData,
                                            socialLinks: {
                                                ...stepData.socialLinks,
                                                customLinks: [...(stepData.socialLinks.customLinks || []), { label: '', url: '' }]
                                            }
                                        })}
                                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        + Add More Link
                                    </button>
                                </div>
                                {(stepData.socialLinks.customLinks || []).map((link: { label: string; url: string }, i: number) => (
                                    <div key={i} className="flex items-center gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={link.label}
                                            onChange={e => {
                                                const links = [...(stepData.socialLinks.customLinks || [])];
                                                links[i] = { ...links[i], label: e.target.value };
                                                setStepData({...stepData, socialLinks: {...stepData.socialLinks, customLinks: links}});
                                            }}
                                            placeholder="Label (e.g. Discord)"
                                            className="w-1/3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-700"
                                        />
                                        <input
                                            type="url"
                                            value={link.url}
                                            onChange={e => {
                                                const links = [...(stepData.socialLinks.customLinks || [])];
                                                links[i] = { ...links[i], url: e.target.value };
                                                setStepData({...stepData, socialLinks: {...stepData.socialLinks, customLinks: links}});
                                            }}
                                            placeholder="https://..."
                                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-700"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const links = (stepData.socialLinks.customLinks || []).filter((_: any, idx: number) => idx !== i);
                                                setStepData({...stepData, socialLinks: {...stepData.socialLinks, customLinks: links}});
                                            }}
                                            className="p-3 text-red-400 hover:text-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {isFree && (
                                <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 mt-2">
                                <p className="text-xs font-bold text-amber-800">⭐ Configuration Premium Lock Indicator</p>
                                <p className="text-[11px] font-semibold text-amber-700 mt-1">You can configure social links during wizard setup. Upgrading to a paid premium tier is required to show links on the live profile.</p>
                            </div>
                            )}
                        </div>
                    </div>
                );

            case 14: // Step 15: Amenities & Facilities
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-xl font-black text-slate-800">{getQuestionHeading('Amenities & Facilities', 'Amenities & Facilities')}</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 15 of 21 • Optional</p>
                        </div>
                        
                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {mergeQuestionOptions('Amenities & Facilities', allAmenityOptions).map(opt => {
                                    const selected = stepData.amenities.includes(opt);
                                    return (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => toggleMultiSelectOption('amenities', opt)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${selected ? 'bg-blue-50 border-blue-200 text-blue-700 font-black' : 'bg-slate-50 border-slate-100 hover:bg-white text-slate-600 font-bold'}`}
                                        >
                                            <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${selected ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200'}`}>
                                                {selected && <Check className="w-3.5 h-3.5" />}
                                            </div>
                                            <span className="text-xs truncate">{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );

            case 15: // Step 16: Specialised Sectors
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-xl font-black text-slate-800">{getQuestionHeading('Industry Sub-Type', 'Specialised Industrial / Agriculture Sectors')}</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 16 of 21 • Optional</p>
                        </div>

                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {mergeQuestionOptions('Industry Sub-Type', allIndustryOptions).map(opt => {
                                    const selected = stepData.specialisedSectors.includes(opt);
                                    return (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => toggleMultiSelectOption('specialisedSectors', opt)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${selected ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-black' : 'bg-slate-50 border-slate-100 hover:bg-white text-slate-600 font-bold'}`}
                                        >
                                            <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${selected ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200'}`}>
                                                {selected && <Check className="w-3.5 h-3.5" />}
                                            </div>
                                            <span className="text-xs truncate">{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );

            case 16: // Step 17: Keywords
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-800">Search Keywords</h3>
                                {isFree && <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full"><Lock className="w-3 h-3" /> Premium Only</span>}
                            </div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 17 of 21 • Optional</p>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Add keywords that search queries can match (Max 10)</label>
                            <p className="text-xs text-slate-500">Use short tags only. Each keyword can be up to 40 characters.</p>
                            {isFree && (
                                <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-3 text-xs font-bold text-amber-700">
                                    Search keywords will still be saved now. Upgrade later to unlock them on your live profile.
                                </div>
                            )}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={keywordInput}
                                    onChange={e => setKeywordInput(e.target.value.slice(0, 40))}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeywordTag(); } }}
                                    placeholder="Type keyword and press Enter..."
                                    maxLength={40}
                                    className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                />
                                <button
                                    type="button"
                                    onClick={addKeywordTag}
                                    className="px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-sm uppercase tracking-wider"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {stepData.keywords.map(kw => (
                                    <span key={kw} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-250 text-amber-700 font-black text-xs rounded-lg">
                                        #{kw}
                                        <button
                                            type="button"
                                            onClick={() => setStepData(prev => ({ ...prev, keywords: prev.keywords.filter(k => k !== kw) }))}
                                            className="text-amber-500 hover:text-amber-700"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 17: // Step 18: FAQs
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-800">Frequently Asked Questions</h3>
                                {maxFaqs === 0 && <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full"><Lock className="w-3 h-3" /> Premium Only</span>}
                            </div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 18 of 21 • Optional</p>
                        </div>
                        <div className="space-y-4">
                            {maxFaqs === 0 && <PremiumFeatureBanner />}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Question</label>
                                    <input
                                        type="text"
                                        value={faqQ}
                                        onChange={e => setFaqQ(e.target.value.slice(0, 200))}
                                        placeholder="e.g. Do you offer delivery?"
                                        maxLength={200}
                                        className="w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-600 bg-white"
                                    />
                                    <p className="mt-1 text-[10px] font-semibold text-slate-400">{faqQ.length}/200</p>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Answer</label>
                                    <textarea
                                        rows={2}
                                        value={faqA}
                                        onChange={e => setFaqA(e.target.value.slice(0, 1000))}
                                        placeholder="e.g. Yes, we deliver nationwide..."
                                        maxLength={1000}
                                        className="w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-600 bg-white resize-none"
                                    />
                                    <p className="mt-1 text-[10px] font-semibold text-slate-400">{faqA.length}/1000</p>
                                </div>
                                <button
                                    type="button"
                                    disabled={stepData.faqs.length >= 10}
                                    onClick={addFaqItem}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase tracking-wider disabled:opacity-40"
                                >
                                    + Add Q&A Pair
                                </button>
                            </div>

                            <div className="space-y-2 pt-2">
                                {stepData.faqs.map((faq, idx) => (
                                    <div key={idx} className="flex justify-between items-start p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                                        <div className="flex-grow pr-4">
                                            <p className="text-xs font-black text-slate-800">Q. {faq.question}</p>
                                            <p className="text-xs text-slate-500 font-semibold mt-1">A. {faq.answer}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFaqItem(idx)}
                                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 18: // Step 19: Opportunities & Expansion
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-xl font-black text-slate-800">Opportunities & Expansion</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 19 of 21 • Optional</p>
                        </div>
                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest border-l-4 border-blue-600 pl-2">Section A: Franchise</h4>
                                
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Do you offer franchise opportunities?</label>
                                    <select
                                        value={stepData.franchiseOpportunity}
                                        onChange={e => setStepData({...stepData, franchiseOpportunity: e.target.value})}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700"
                                    >
                                        <option value="No">No</option>
                                        <option value="Yes">Yes</option>
                                    </select>
                                </div>

                                {stepData.franchiseOpportunity === 'Yes' && (
                                    <div className="space-y-3 pl-3 border-l-2 border-slate-100">
                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Franchise availability</label>
                                            <div className="flex gap-2">
                                                {['Within Country only', 'Across the World'].map(opt => {
                                                    const selected = stepData.franchiseAreas.includes(opt);
                                                    return (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => toggleMultiSelectOption('franchiseAreas', opt)}
                                                            className={`px-3 py-2 rounded-lg border-2 text-xs font-bold ${selected ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-500'}`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Investment Range Required</label>
                                            <select
                                                value={stepData.franchiseInvestment}
                                                onChange={e => setStepData({...stepData, franchiseInvestment: e.target.value})}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                                            >
                                                <option value="">Select Range</option>
                                                <option value="Under $1,000">Under $1,000</option>
                                                <option value="$1k – $10k">$1k – $10k</option>
                                                <option value="$10k – $50k">$10k – $50k</option>
                                                <option value="$50k – $100k">$50k – $100k</option>
                                                <option value="$100k+">$100k+</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Franchise Support Offered</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['Training', 'Marketing', 'Equipment', 'Setup Assistance', 'Ongoing Support'].map(opt => {
                                                    const selected = stepData.franchiseSupport.includes(opt);
                                                    return (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => toggleMultiSelectOption('franchiseSupport', opt)}
                                                            className={`px-3 py-2 rounded-lg border-2 text-xs font-bold ${selected ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-500'}`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Minimum Floor Space Required</label>
                                            <input
                                                type="text"
                                                value={stepData.franchiseMinSpace}
                                                onChange={e => setStepData({...stepData, franchiseMinSpace: e.target.value})}
                                                placeholder="e.g. 500 sq ft"
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest border-l-4 border-blue-600 pl-2">Section B: Resellers & Trade</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Dealers / Resellers wanted?</label>
                                        <select
                                            value={stepData.dealersResellers}
                                            onChange={e => setStepData({...stepData, dealersResellers: e.target.value})}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                                        >
                                            <option value="No">No</option>
                                            <option value="Yes">Yes</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Are you an Importer / Exporter?</label>
                                        <select
                                            value={stepData.importerExporter}
                                            onChange={e => setStepData({...stepData, importerExporter: e.target.value})}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                                        >
                                            <option value="No">No</option>
                                            <option value="Yes">Yes</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Reseller Areas Served</label>
                                    <div className="flex gap-2">
                                        {['Local', 'National', 'International'].map(opt => {
                                            const selected = stepData.areasServed.includes(opt);
                                            return (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => toggleMultiSelectOption('areasServed', opt)}
                                                    className={`px-3 py-2 rounded-lg border-2 text-xs font-bold ${selected ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-500'}`}
                                                >
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 19: // Step 20: Logo & Cover Image
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-xl font-black text-slate-800">Business Profile Media</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 20 of 21 • Optional</p>
                        </div>
                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Business Logo</label>
                                <div className="flex items-center gap-4">
                                    {stepData.logoUrl && (
                                        <div className="w-16 h-16 rounded-xl border overflow-hidden relative shrink-0">
                                            <img src={stepData.logoUrl} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setStepData({...stepData, logoUrl: ''})}
                                                className="absolute top-0 right-0 bg-red-600 text-white rounded-bl p-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) triggerImageUpload(file, 'logoUrl');
                                        }}
                                        className="text-xs"
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Recommended: 400×400px, PNG or JPG. Max file size: 5MB.</p>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Cover Banner Image</label>
                                <div className="space-y-2">
                                    {stepData.coverImageUrl && (
                                        <div className="w-full h-24 rounded-xl border overflow-hidden relative shrink-0">
                                            <img src={stepData.coverImageUrl} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setStepData({...stepData, coverImageUrl: ''})}
                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) triggerImageUpload(file, 'coverImageUrl');
                                        }}
                                        className="text-xs"
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Recommended: 1200×400px, PNG or JPG. Max file size: 10MB.</p>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Gallery Images{isFree ? ' (Up to 3 on Free Plan)' : ''}</label>
                                {isFree && stepData.galleryUrls.length >= 3 && <PremiumFeatureBanner />}
                                <div className="flex flex-wrap gap-3">
                                    {stepData.galleryUrls.map((url, idx) => (
                                        <div key={idx} className="flex flex-col gap-2 w-32 shrink-0">
                                            <div className="w-full h-20 rounded-xl border overflow-hidden relative">
                                                <img src={url} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setStepData({...stepData, galleryUrls: stepData.galleryUrls.filter((_, i) => i !== idx)})}
                                                    className="absolute top-0 right-0 bg-red-600 text-white rounded-bl p-0.5"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Add caption..."
                                                value={stepData.imageCaptions[url] || ''}
                                                onChange={(e) => setStepData(prev => ({
                                                    ...prev,
                                                    imageCaptions: { ...prev.imageCaptions, [url]: e.target.value }
                                                }))}
                                                className="w-full px-2 py-1 text-[10px] bg-slate-50 border border-slate-200 rounded text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                                            />
                                        </div>
                                    ))}
                                    {stepData.galleryUrls.length < (isFree ? 3 : 999) && (
                                        <label className="w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-white transition-colors">
                                            <Plus className="w-6 h-6 text-slate-400" />
                                            <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Upload</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) triggerImageUpload(file, 'gallery');
                                                }}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Showcase your products, store fronts, or portfolio. Recommended: 800×800px or larger, PNG/JPG/WebP, max 5MB each. WebP CDN compression is applied.</p>
                            </div>
                        </div>
                    </div>
                );

            case 20: // Step 21: Legal Consent
                return (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-xl font-black text-slate-800">Legal Agreement & Declaration</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Step 21 of 21 • Required</p>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={stepData.termsAccepted}
                                    onChange={e => setStepData({...stepData, termsAccepted: e.target.checked})}
                                    className="mt-1 h-4 w-4 rounded text-blue-600 border-slate-300"
                                />
                                <span className="text-xs font-black text-slate-700">I agree to the Terms of Service. *</span>
                            </label>

                            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={stepData.privacyAccepted}
                                    onChange={e => setStepData({...stepData, privacyAccepted: e.target.checked})}
                                    className="mt-1 h-4 w-4 rounded text-blue-600 border-slate-300"
                                />
                                <span className="text-xs font-black text-slate-700">I agree to the Privacy Policy. *</span>
                            </label>

                            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={stepData.moderationAccepted}
                                    onChange={e => setStepData({...stepData, moderationAccepted: e.target.checked})}
                                    className="mt-1 h-4 w-4 rounded text-blue-600 border-slate-300"
                                />
                                <span className="text-xs font-black text-slate-700">I agree to the Content Moderation Policy. *</span>
                            </label>

                            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={stepData.accuracyConfirmed}
                                    onChange={e => setStepData({...stepData, accuracyConfirmed: e.target.checked})}
                                    className="mt-1 h-4 w-4 rounded text-blue-600 border-slate-300"
                                />
                                <span className="text-xs font-black text-slate-700">I confirm that all business details submitted are accurate and legitimate. *</span>
                            </label>

                            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={stepData.publicLocationConsent}
                                    onChange={e => setStepData({...stepData, publicLocationConsent: e.target.checked})}
                                    className="mt-1 h-4 w-4 rounded text-blue-600 border-slate-300"
                                />
                                <span className="text-xs font-black text-slate-700">I consent to my business location pin being publicly visible. *</span>
                            </label>

                            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={stepData.marketingUpdatesConsent}
                                    onChange={e => setStepData({...stepData, marketingUpdatesConsent: e.target.checked})}
                                    className="mt-1 h-4 w-4 rounded text-blue-600 border-slate-300"
                                />
                                <span className="text-xs font-bold text-slate-500">I consent to receive occasional system notifications and marketing updates.</span>
                            </label>

                            <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl mt-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal Logging Information</p>
                                <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] font-semibold text-slate-500">
                                    <p>Session ID: {consentMeta.sessionId}</p>
                                    <p>Device Key: {consentMeta.deviceId}</p>
                                    <p>UTC Timestamp: {new Date().toISOString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        );
    }

    if (user && user.role !== 'vendor') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Navbar />
                <main className="flex-grow py-12 px-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-10">
                            <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                                Business Setup
                            </span>
                            <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-2 tracking-tight">
                                Start Your Business Profile
                            </h1>
                            <p className="text-slate-500 font-bold text-sm">
                                Confirm a few business details first. After that, the full 21-step setup will open automatically.
                            </p>
                        </div>

                        <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-2xl space-y-6">
                            {activationError && (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                                    {activationError}
                                </div>
                            )}

                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Business Name</label>
                                    <input
                                        type="text"
                                        value={stepData.businessName}
                                        onChange={(e) => setStepData((prev) => ({ ...prev, businessName: e.target.value }))}
                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder="Your business name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone Code</label>
                                    <select
                                        value={stepData.phoneCode}
                                        onChange={(e) => setStepData((prev) => ({ ...prev, phoneCode: e.target.value }))}
                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    >
                                        {DIAL_CODES.map((dial) => (
                                            <option key={`${dial.code}-${dial.dialCode}`} value={dial.dialCode}>
                                                {dial.country} ({dial.dialCode})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Business Phone</label>
                                    <input
                                        type="tel"
                                        value={stepData.phoneNumber}
                                        onChange={(e) => setStepData((prev) => ({ ...prev, phoneNumber: e.target.value.replace(/[^\d]/g, '') }))}
                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder="3001234567"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Country</label>
                                    <select
                                        value={stepData.country}
                                        onChange={(e) => setStepData((prev) => ({ ...prev, country: e.target.value, city: '', state: '', zipCode: '' }))}
                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800"
                                    >
                                        <option value="">Select a country</option>
                                        {countries.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">City</label>
                                    <select
                                        value={stepData.city}
                                        onChange={(e) => {
                                            const nextCity = e.target.value;
                                            setStepData((prev) => ({ ...prev, city: nextCity }));
                                            applySelectedCity(nextCity);
                                        }}
                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800"
                                    >
                                        <option value="">Select a city</option>
                                        {filteredCities.map((city) => (
                                            <option key={city.id} value={city.name}>
                                                {city.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                        {addressConfig?.administrativeArea?.label || 'State / Province'}
                                    </label>
                                    {stateOptions.length > 0 ? (
                                        <select
                                            value={stepData.state}
                                            onChange={(e) => setStepData((prev) => ({ ...prev, state: e.target.value, city: '', zipCode: '' }))}
                                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800"
                                        >
                                            <option value="">Select State / Province</option>
                                            {stateOptions.map((state) => (
                                                <option key={state} value={state}>
                                                    {state}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            value={stepData.state}
                                            onChange={(e) => setStepData((prev) => ({ ...prev, state: e.target.value, city: '', zipCode: '' }))}
                                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            placeholder={addressConfig?.administrativeArea?.label || 'State / Province'}
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                        {addressConfig?.postalCode?.label || 'Zip / Postal Code'}
                                    </label>
                                    <input
                                        value={stepData.zipCode}
                                        onChange={(e) => setStepData((prev) => ({ ...prev, zipCode: e.target.value }))}
                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder={addressConfig?.postalCode?.label || 'Zip / Postal Code'}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Business Address</label>
                                    <textarea
                                        value={stepData.address}
                                        onChange={(e) => setStepData((prev) => ({ ...prev, address: e.target.value }))}
                                        rows={4}
                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                                        placeholder="Street address, building, floor, landmark"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleActivateBusiness}
                                disabled={activatingBusiness}
                                className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60"
                            >
                                {activatingBusiness ? 'Activating...' : 'Continue As Business'}
                            </button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (completed) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-8 animate-bounce">
                    <Check className="w-12 h-12 text-emerald-500" />
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight uppercase">Setup Complete!</h1>
                <p className="text-slate-500 font-bold">Redirecting you to your business dashboard...</p>
                <div className="mt-8 flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" /> Syncing Details
                </div>
            </div>
        );
    }

    const progressPercent = ((currentStep + 1) / 21) * 100;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />

            <main className="flex-grow py-12 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                            21-Step Configuration
                        </span>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-2 tracking-tight">
                            Personalize Your Listing
                        </h1>
                        <p className="text-slate-500 font-bold text-sm">
                            Submit detailed profile data to strengthen your listing and improve customer visibility.
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between items-end mb-3">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuration Progress</p>
                                <p className="text-xs font-black text-slate-600 uppercase tracking-wider mt-1">Step {currentStep + 1} of 21</p>
                            </div>
                            <p className="text-xs font-black text-blue-600 tracking-widest">{Math.round(progressPercent)}% COMPLETE</p>
                        </div>
                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner border border-white/50">
                            <div 
                                className="h-full bg-blue-600 transition-all duration-500 ease-out shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-2xl relative overflow-hidden mb-8">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                        
                        {renderStepContent()}

                        {/* Navigation controls */}
                        <div className="flex justify-between items-center pt-8 border-t border-slate-100 mt-8">
                            <button
                                type="button"
                                onClick={() => handleSaveStep(false)}
                                disabled={currentStep === 0 || saving}
                                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" /> Back
                            </button>

                            {currentStep === 20 ? (
                                <button
                                    type="button"
                                    onClick={handleFinalSubmit}
                                    disabled={
                                        saving ||
                                        !stepData.termsAccepted ||
                                        !stepData.privacyAccepted ||
                                        !stepData.moderationAccepted ||
                                        !stepData.accuracyConfirmed ||
                                        !stepData.publicLocationConsent
                                    }
                                    className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-40"
                                >
                                    {saving ? 'Saving...' : 'Agree & Finish'}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleNextBtnClick}
                                    disabled={saving}
                                    className="inline-flex items-center gap-1.5 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-60"
                                >
                                    {saving ? 'Saving...' : 'Save & Continue'} <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function BusinessSetupWizard() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>}>
            <BusinessSetupWizardContent />
        </Suspense>
    );
}
