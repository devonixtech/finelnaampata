export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    imageUrl?: string;
    parentId?: string;
    displayOrder: number;
    status: 'active' | 'disabled';
    source: 'google' | 'admin';
    businessCount?: number;
    subcategories?: Category[];
    createdAt: string;
}

export interface City {
    id: string;
    name: string;
    slug: string;
    state?: string;
    postalCode?: string;
    country: string;
    description?: string;
    heroImageUrl?: string;
    imageUrl?: string;        // alias kept for backward compat
    isPopular: boolean;
    displayOrder: number;
    metaTitle?: string;
    metaDescription?: string;
    latitude?: number;
    longitude?: number;
    businessCount?: number;
    createdAt: string;
    updatedAt?: string;
}

export interface BusinessHours {
    id: string;
    dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    openTime: string;
    closeTime: string;
    isOpen: boolean;
}

export interface Amenity {
    id: string;
    name: string;
    icon?: string;
}

export interface BusinessAmenity {
    id: string;
    amenity: Amenity;
}

export interface Vendor {
    id: string;
    slug: string;
    userId?: string;
    businessName?: string;
    businessEmail?: string;
    businessPhone?: string;
    businessAddress?: string;
    bio?: string;
    country?: string;
    city?: string;
    state?: string;
    user?: {
        id: string;
        fullName?: string;
        email?: string;
        phone?: string;
        isOnline?: boolean;
        lastLoginAt?: string;
        lastActiveAt?: string;
        lastLogoutAt?: string;
        avatarUrl?: string;
        deleteAt?: string;
        deletionScheduledAt?: string;
        createdAt?: string;
    };
    isOnline?: boolean;
    businessHours?: Record<string, { isOpen: boolean; openTime: string; closeTime: string }>;
    socialLinks?: { platform: string; url: string; }[];
}

export interface Business {
    id: string;
    title: string;
    slug: string;
    description: string;
    shortDescription?: string;
    email?: string;
    phone: string;
    namedPhoneNumbers?: { label: string; number: string }[];
    address: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
    logoUrl?: string;
    coverImageUrl?: string;
    images: string[];
    imageCaptions?: Record<string, string>;
    albums?: {
        id: string;
        name: string;
        images: { id: string; url: string; caption?: string; sortOrder: number }[];
        createdAt: string;
        updatedAt: string;
    }[];
    averageRating: number;
    totalReviews: number;
    priceRange?: string;
    isVerified: boolean;
    isFeatured: boolean;
    whatsapp?: string;
    category?: Category;
    subcategories?: Category[];
    website?: string;
    businessHours?: BusinessHours[];
    businessAmenities?: BusinessAmenity[];
    vendorId?: string;
    vendor?: Vendor;
    // SEO / Search
    metaKeywords?: string;
    searchKeywords?: string[];
    // Offer / Promo
    hasOffer?: boolean;
    offerTitle?: string;
    offerDescription?: string;
    offerBadge?: string;
    offerExpiresAt?: string;
    offerBannerUrl?: string;
    // Stats
    followersCount?: number;
    status: 'pending' | 'approved' | 'rejected' | 'disabled';
    faqs?: { question: string; answer: string }[];
    recentUntil?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface ReviewReply {
    id: string;
    content: string;
    userId: string;
    user: {
        fullName: string;
        avatarUrl?: string;
    };
    createdAt: string;
}

export interface Review {
    id: string;
    rating: number;
    comment: string;
    user: {
        fullName: string;
        avatarUrl?: string;
        trust_score?: number;
        badge?: string;
        review_count?: number;
        helpful_votes?: number;
    };
    business?: {
        id: string;
        name?: string;
        title?: string;
        slug: string;
        coverImageUrl?: string;
        vendor?: Vendor;
    };
    vendorResponse?: string;
    vendorResponseAt?: string;
    replies?: ReviewReply[];
    createdAt: string;
    ip_address?: string;
    device_id?: string;
}

export interface SearchResponse {
    data: Business[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    };
}

export enum OfferType {
    OFFER = 'offer',
    EVENT = 'event',
}
export enum JobLeadStatus {
    OPEN = 'open',
    BROADCASTED = 'broadcasted',
    RESPONDED = 'responded',
    CLOSED = 'closed',
}

export interface OfferEvent {
    id: string;
    title: string;
    description: string;
    type: OfferType;
    offerBadge?: string;
    imageUrl?: string;
    startDate?: string;
    endDate?: string;
    expiryDate?: string;
    highlights?: string[];
    terms?: string[];
    businessId: string;
    business?: Business;
    createdAt: string;
}

export interface JobLead {
    id: string;
    userId: string;
    categoryId: string;
    category?: Category;
    title: string;
    description: string;
    city?: string;
    location?: string;
    budget?: number;
    status: JobLeadStatus;
    latitude?: number;
    longitude?: number;
    createdAt: string;
    responses?: JobLeadResponse[];
    hasResponded?: boolean;
    user?: {
        id: string;
        fullName: string;
        email: string;
    phone?: string;
    namedPhoneNumbers?: {
        label: string;
        number: string;
    }[];
    };
    myResponse?: JobLeadResponse;
}

export interface JobLeadResponse {
    id: string;
    jobLeadId: string;
    vendorId: string;
    vendor?: Vendor;
    message: string;
    price?: number;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

export interface BusinessQuestion {
    id: string;
    category: string;
    question: string;
    options: string[];
    isActive: boolean;
    order: number;
}
