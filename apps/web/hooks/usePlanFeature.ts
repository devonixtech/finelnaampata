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
    canCreateAlbums?: boolean;
    isFeatured?: boolean;
    [key: string]: any;
}

export const usePlanFeature = () => {
    const { user } = useAuth();
    
    // In our system, getProfile attaches normalized activeSubscription to vendor
    const activeSub = user?.vendor?.activeSubscription;
    
    // Default features (restrictive) if no plan is found
    // This handles the gap between registration and plan assignment sync
    const defaultFeatures: DashboardFeatures = {
        showListings: true,
        showSaved: false,
        showFollowing: false,
        showQueries: false,
        showLeads: true,
        showOffers: true,
        showReviews: true,
        showAnalytics: false,
        showCustomerNotes: false,
        showChat: false,
        showBroadcast: true,
        canRespondBroadcast: false,
        canReplyReviews: false,
        showDemand: false,
        canAddListing: true,
        maxListings: 1,
        maxOffers: 1,
        maxKeywords: 0,
        maxFaqs: 0,
        maxSubCategories: 0,
        canCreateAlbums: false,
        isFeatured: false,
    };

    const features: DashboardFeatures = activeSub?.plan?.dashboardFeatures || defaultFeatures;

    const hasFeature = (featureName: keyof DashboardFeatures): boolean => {
        // Admins/Superadmins bypass all gating
        if (user?.role === 'admin' || user?.role === 'superadmin') return true;
        
        // Standard users bypass gating for core community features
        if (user?.role === 'user' && ['showChat', 'showSaved', 'showFollowing', 'showReviews'].includes(featureName as string)) {
            return true;
        }

        // If it's a vendor, check their active plan features
        return !!features[featureName];
    };

    const getFeatureValue = (featureName: string): any => {
        if (user?.role === 'admin' || user?.role === 'superadmin') {
            if (featureName.startsWith('max')) return 999999;
            return true;
        }
        return features[featureName];
    };

    return {
        hasFeature,
        getFeatureValue,
        features,
        planName: activeSub?.plan?.name || 'Free',
        isFree: !activeSub || activeSub.plan?.planType?.toLowerCase() === 'free' || activeSub.plan?.name?.toLowerCase().includes('free'),
        loading: !user,
    };
};
