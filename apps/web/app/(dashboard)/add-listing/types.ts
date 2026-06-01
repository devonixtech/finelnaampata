import { Category } from '../../../types/api';

export interface ListingFormData {
    title: string;
    shortDescription: string;
    description: string;
    
    businessType: string[];
    coreBusinessNature: string[];
    operationalStructure: string[];
    targetMarket: string[];
    
    categoryId: string;
    subCategoryIds: string[];
    
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
    contactPersonName: string;
    
    businessHours: any[];
    
    yearEstablished: string;
    employeeCount: string;
    
    website: string;
    socialLinks: { platform: string; url: string }[];
    
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
    
    agreed: boolean;
}

export interface StepProps {
    formData: ListingFormData;
    setFormData: React.Dispatch<React.SetStateAction<ListingFormData>>;
    onNext: () => void;
    onPrev: () => void;
    categories?: Category[];
}
