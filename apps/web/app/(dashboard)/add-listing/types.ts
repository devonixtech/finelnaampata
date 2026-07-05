import { Category } from '../../../types/api';

export interface ListingFormData {
    title: string;
    businessTagline: string;
    shortDescription: string;
    description: string;
    
    businessType: string[];
    coreBusinessNature: string[];
    operationalStructure: string[];
    targetMarket: string[];
    
    categoryId: string;
    subCategoryIds: string[];
    customCategoryTag: string;
    
    address: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    
    latitude: number;
    longitude: number;
    
    phoneCode: string;
    phoneNumber: string;
    whatsapp: string;
    whatsappSameAsPrimary: boolean;
    contactPersonTitle: string;
    contactPersonName: string;
    namedPhoneNumbers: { label: string; personName?: string; title?: string; number: string }[];
    
    businessHours: any[];
    open247: boolean;
    timezone: string;
    
    yearEstablished: string;
    employeeCount: string;
    
    website: string;
    socialLinks: { platform: string; url: string; label?: string }[];
    
    locationAccess: string[];
    facilities: string[];
    staffFeatures: string[];
    paymentMethods: string[];
    
    industrySubType: string[];
    
    searchKeywords: string[];
    metaKeywords: string; // for compatibility, maybe sync them
    
    faqs: { question: string; answer: string }[];
    
    franchiseOpportunities: boolean;
    franchiseAvailableIn: string[];
    franchiseInvestmentRange: string;
    franchiseSupport: string[];
    franchiseMinSpace: string;
    lookingForDealers: boolean;
    isImporterExporter: boolean;
    areasServed: string[];
    businessLanguages: string[];
    chainOrMultipleBranches: boolean;
    
    logoUrl: string;
    coverImageUrl: string;
    images: string[];
    imageCaptions: Record<string, string>;

    legalConsentTerms: boolean;
    legalConsentPrivacy: boolean;
    legalConsentModeration: boolean;
    legalConsentAccuracy: boolean;
    legalConsentPublicLocation: boolean;
    legalConsentMarketing: boolean;
}

export interface StepProps {
    formData: ListingFormData;
    setFormData: React.Dispatch<React.SetStateAction<ListingFormData>>;
    onNext: () => void;
    onPrev: () => void;
    categories?: Category[];
    categoriesLoading?: boolean;
}
