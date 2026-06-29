"use client";

import { useAuth } from '../context/AuthContext';

export interface DashboardFeatures {
    showListings: boolean;
    showSaved: boolean;
    showFollowing: boolean;
    showQueries: boolean;
    showLeads: boolean;
    showOffers: boolean;
    showReviews: boolean;
    showAnalytics: boolean;
    showChat: boolean;
    showBroadcast: boolean;
    canRespondBroadcast?: boolean;
    canReplyReviews?: boolean;
    showDemand: boolean;
    showCustomerNotes?: boolean;
    canAddListing: boolean;
    maxListings?: number;
    maxKeywords?: number;
    maxOffers?: number;
    maxEvents?: number;
    maxFaqs?: number;
    maxSubCategories?: number;
    maxNamedPhoneNumbers?: number;
    canCreateAlbums?: boolean;
    isFeatured?: boolean;
    [key: string]: any;
}

export const usePlanFeature = () => {
    const { user } = useAuth();
    
    // In our system, getProfile attaches normalized activeSubscription to vendor
    const activeSub = user?.vendor?.activeSubscription;
    
    // Default features stay conservative until a real plan is available.
    const defaultFeatures: DashboardFeatures = {
        showListings: true,
        showSaved: true,
        showFollowing: false,
        showQueries: false,
        showLeads: false,
        showOffers: true,
        showEvents: true,
        showReviews: false,
        showAnalytics: false,
        showCustomerNotes: true,
        showChat: false,
        showBroadcast: false,
        canRespondBroadcast: false,
        canReplyReviews: false,
        showDemand: false,
        canAddListing: true,
        maxListings: 1,
        maxOffers: 999,
        maxEvents: 999,
        maxKeywords: 0,
        maxFaqs: 0,
        maxSubCategories: 0,
        maxNamedPhoneNumbers: 0,
        canCreateAlbums: false,
        isFeatured: false,
    };

    const features: DashboardFeatures = {
        ...defaultFeatures,
        ...(activeSub?.plan?.dashboardFeatures || {}),
    };
    const getFeatureValue = (featureName: string): any => {
        if (user?.role === 'admin' || user?.role === 'superadmin') {
            if (featureName.startsWith('max')) return 999999;
            return true;
        }
        const value = features[featureName];
        const hasActiveSub = !!activeSub && (activeSub.status?.toLowerCase() === 'active' || activeSub.status?.toLowerCase() === 'trialing' || !!activeSub.plan);
        if (featureName.startsWith('max')) {
            if (featureName === 'maxSubCategories') {
                const numeric = Number(value ?? 0);
                const fallbackFromCategories = Number((features as any).maxCategories ?? 0);
                if (numeric > 0) return numeric;
                if (fallbackFromCategories > 0) return Math.max(0, fallbackFromCategories - 1);
                if (hasActiveSub) return 3;
                return 0;
            }
            if (featureName === 'maxNamedPhoneNumbers') {
                const num = Number(value ?? (features as any).maxAdditionalPhones ?? 0);
                if (num > 0) return num;
                if (hasActiveSub) return 5;
                return 0;
            }
            if (Number(value ?? 0) === 0 && hasActiveSub) {
                const paidDefaults: Record<string, number> = {
                    maxPhotos: 10, maxListings: 3, maxHighlights: 6,
                    maxSpecials: 3, maxTeamMembers: 10, maxSocialLinks: 4,
                    maxOperatingHours: 3, maxDealsPerMonth: 3, maxEventsPerMonth: 3,
                    maxKeywords: 10, maxFaqs: 10, maxEmailAddresses: 5, maxNamedPhoneNumbers: 5, maxSubCategories: 3
                };
                if (paidDefaults[featureName]) return paidDefaults[featureName];
            }
            return Number(value ?? 0);
        }
        return value;
    };

    const hasFeature = (featureName: keyof DashboardFeatures): boolean => {
        // Admins/Superadmins bypass all gating
        if (user?.role === 'admin' || user?.role === 'superadmin') return true;

        // Core features always available for all roles
        if (['showCustomerNotes'].includes(featureName as string)) return true;

        // Standard users bypass gating for core community features
        if (user?.role === 'user' && ['showChat', 'showSaved', 'showFollowing', 'showReviews'].includes(featureName as string)) {
            return true;
        }

        const key = featureName as string;
        if (key.startsWith('max')) {
            return Number(getFeatureValue(key) || 0) > 0;
        }

        // If it's a vendor, check their active plan features
        if (!!activeSub && (activeSub.status?.toLowerCase() === 'active' || activeSub.status?.toLowerCase() === 'trialing' || !!activeSub.plan)) return true; 
        return !!features[featureName];
    };

    return {
        hasFeature,
        getFeatureValue,
        features,
        planName: (activeSub?.plan?.name && activeSub.plan.name.toLowerCase() !== 'free') ? activeSub.plan.name : 'Starter Plan',
        isFree: (user?.role !== 'admin' && user?.role !== 'superadmin') && (!activeSub || activeSub.plan?.planType?.toLowerCase() === 'free' || activeSub.plan?.name?.toLowerCase().includes('free') || activeSub.plan?.name?.toLowerCase().includes('starter')),
        hasPaidPlan: !!activeSub && (activeSub.status?.toLowerCase() === 'active' || activeSub.status?.toLowerCase() === 'trialing' || !!activeSub.plan) && activeSub.plan?.planType?.toLowerCase() !== 'free',
        loading: !user,
    };
};
