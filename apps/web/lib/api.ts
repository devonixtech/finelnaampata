import { Business, Category, City, SearchResponse, Review, ReviewReply } from '../types/api';
import { isLoopbackUrl, stripApiPath } from './runtime-url';

const isProd = process.env.NODE_ENV === 'production';
const isServer = typeof window === 'undefined';

// DIRECT fix: Always use Railway URL in production.
// No runtime hostname replacement - prevents naampata.com/api/v1 bug.
const RAILWAY_API_URL = 'https://local-business-listing-directory-production.up.railway.app/api/v1';

const API_BASE_URL = isProd
    ? RAILWAY_API_URL
    : (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || RAILWAY_API_URL).replace(/\/+$/, '');


// 5. Debugging (visible in server logs and browser console in dev)
if (isServer) {
    console.log(`[SSR] Initializing API with: ${API_BASE_URL}`);
} else if (!isProd) {
    console.log(`[Client] Initializing API with: ${API_BASE_URL}`);
}

const API_ROOT = API_BASE_URL ? stripApiPath(API_BASE_URL) : '';

console.log('[api.ts] Unified API_BASE_URL:', API_BASE_URL);

export const getImageUrl = (path: string | null | undefined) => {
    if (!path) return undefined;
    if (path.startsWith('data:')) return path; // Base64 preview
    if (path.startsWith('http')) return path; // Cloudinary or full URL

    // For relative paths, prepend API_ROOT (the base domain of the API)
    // Trim leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${API_ROOT}/${cleanPath}`;
};

interface FetcherOptions extends RequestInit {
    silent?: boolean;
    timeout?: number;
}

async function fetcher<T>(endpoint: string, options?: FetcherOptions): Promise<T> {
    const headers = new Headers(options?.headers);

    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    console.log(`[api.ts] Fetching: ${API_BASE_URL}${endpoint}`);

    const controller = new AbortController();
    const timeout = options?.timeout || 60000;
    const timeoutId = setTimeout(() => controller.abort(), timeout); // Use custom or 60s default

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const url = `${API_BASE_URL.endsWith('/') ? API_BASE_URL : API_BASE_URL + '/'}${cleanEndpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorData: any;
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
            } else {
                const text = await response.text();
                errorData = { message: text || 'An unknown error occurred' };
            }

            // Only redirect on 401 for protected (non-auth) endpoints.
            const isAuthEndpoint = endpoint.startsWith('/auth/');

            if (response.status === 401 && !isAuthEndpoint && !options?.silent) {
                if (typeof window !== 'undefined') {
                    console.error('[api.ts] Unauthorized! Redirecting to login...');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login?error=expired';
                }
            } else if (response.status >= 500 && !options?.silent) {
                console.error(`[api.ts] API Error on ${endpoint}:`, response.status, response.statusText, errorData);
            }

            if (options?.silent) {
                return null as any;
            }
            throw new Error(errorData.message || 'API request failed');
        }

        // Check if the response has content before parsing as JSON
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');

        if (response.status === 204) {
            return (undefined as any);
        }

        if (isJson) {
            const text = await response.text();
            try {
                return text ? JSON.parse(text) : (undefined as any);
            } catch (e: any) {
                console.error('[api.ts] JSON Parse Error:', e.message, 'Raw text:', text.substring(0, 200));
                throw new Error('Invalid JSON response from server');
            }
        } else {
            const text = await response.text();
            // If it's not JSON but was successful, return text if possible or just plain object
            return text as unknown as T;
        }
    } catch (error: any) {
        clearTimeout(timeoutId);

        // Comprehensive Network Error Logging
        const errMessage = error.message || '';
        const errName = error.name || '';

        const isNetworkError =
            errMessage.includes('fetch') ||
            errMessage.includes('NetworkError') ||
            errMessage.includes('Network Request Failed') ||
            errMessage.includes('Failed to fetch') ||
            errName === 'AbortError' ||
            errMessage.includes('timed out') ||
            errMessage.includes('NetworkError when attempting to fetch resource');

        if (isNetworkError) {
            if (options?.silent) {
                console.warn(`[api.ts] Silent network error on ${endpoint}`, errMessage);
                return null as any;
            }

            console.error('[api.ts] Network Connectivity Issue Detected:', {
                message: errMessage,
                name: errName,
                requestedUrl: url,
                apiUrlConfig: API_BASE_URL,
                origin: typeof window !== 'undefined' ? window.location.origin : 'server-side',
                stack: error.stack
            });

            let hint = '';
            if (isLoopbackUrl(url)) {
                hint = ' (Loopback Backend Unreachable). If you opened the app on another host or device, point NEXT_PUBLIC_API_URL/NEXT_PUBLIC_SOCKET_URL to a reachable public host.';
            } else if (url.includes('railway.app')) {
                hint = ' (Production Backend Unreachable). Check Railway status or your internet connection.';
            }

            throw new Error(`Connection Failed: Unable to reach the backend at ${url}.${hint}`);
        }

        if (options?.silent) {
            console.warn(`[api.ts] Silent error on ${endpoint}`, errMessage);
            return null as any;
        }

        // Re-throw other errors
        throw error;
    }
}

export const api = {
    get: <T>(endpoint: string, options?: FetcherOptions) => fetcher<T>(endpoint, { ...options, method: 'GET' }),
    post: <T>(endpoint: string, body?: any, options?: FetcherOptions) => fetcher<T>(endpoint, {
        ...options,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined
    }),
    patch: <T>(endpoint: string, body?: any, options?: FetcherOptions) => fetcher<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined
    }),
    delete: <T>(endpoint: string, options?: FetcherOptions) => fetcher<T>(endpoint, { ...options, method: 'DELETE' }),

    categories: {
        getAll: (options?: FetcherOptions & { includeSubcategories?: boolean }) => { const query = options?.includeSubcategories ? '?includeSubcategories=true' : ''; return fetcher<Category[]>('/categories' + query, options); },
        getPopular: (limit = 8, options?: FetcherOptions) => fetcher<Category[]>(`/categories/popular?limit=${limit}`, options),
        getTree: (options?: FetcherOptions) => fetcher<Category[]>('/categories/tree', options),
        getBySlug: (slug: string, options?: FetcherOptions) => fetcher<Category>(`/categories/slug/${slug}`, options),
        // Admin endpoints
        adminGetAll: (page = 1, limit = 10, search = '') => {
            const query = new URLSearchParams({
                page: String(page),
                limit: String(limit),
                search
            }).toString();
            return fetcher<{ data: Category[], total: number }>(`/categories/admin?${query}`);
        },
        adminCreate: (data: any) => fetcher<Category>('/categories/admin', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        adminUpdate: (id: string, data: any) => fetcher<Category>(`/categories/admin/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
        adminUpdateStatus: (id: string, status: string) => fetcher<Category>(`/categories/admin/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),
        adminDelete: (id: string) => fetcher<void>(`/categories/admin/${id}`, {
            method: 'DELETE',
        }),
        syncGoogle: (name: string) => fetcher<Category>('/categories/sync-google', {
            method: 'POST',
            body: JSON.stringify({ name }),
        }),
        bulkImportGoogle: () => fetcher(`/categories/admin/bulk-import-google`, {
            method: 'POST',
            timeout: 300000, // 5 minute timeout for bulk import
        }),
        suggest: (title: string, description?: string) => {
            const query = new URLSearchParams({ title, description: description || '' }).toString();
            return fetcher<Category[]>(`/categories/suggest?${query}`);
        },
    },
    listings: {
        create: (listingData: any, options?: FetcherOptions) => fetcher<Business>('/businesses', {
            ...options,
            method: 'POST',
            body: JSON.stringify(listingData),
        }),
        search: (params: Record<string, string | number | boolean | undefined | null>) => {
            const sanitizedParams: Record<string, string> = {};

            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '' && value !== false) {
                    sanitizedParams[key] = String(value);
                }
            });

            const query = new URLSearchParams(sanitizedParams).toString();
            return fetcher<SearchResponse>(`/businesses/search?${query}`);
        },
        getSuggestions: (q: string) => fetcher<string[]>(`/businesses/search/suggestions?q=${encodeURIComponent(q)}`),
        getBySlug: (slug: string, options?: FetcherOptions) => fetcher<Business>(`/businesses/slug/${slug}`, options),
        getFeatured: (page = 1, limit = 12, options?: FetcherOptions) => fetcher<SearchResponse>(`/businesses/search?featuredOnly=true&page=${page}&limit=${limit}`, options),
        uploadImage: async (file: File) => {
            let fileToUpload = file;
            if (typeof window !== 'undefined' && file.type.startsWith('image/')) {
                try {
                    const imageCompression = (await import('browser-image-compression')).default;
                    const options = {
                        maxSizeMB: 1.0,
                        maxWidthOrHeight: 1600,
                        useWebWorker: true,
                        fileType: 'image/jpeg',
                        initialQuality: 0.8,
                    };
                    const compressedBlob = await imageCompression(file, options);
                    fileToUpload = new File([compressedBlob], file.name, { type: 'image/jpeg' });
                    console.log(`[api.ts] Compressed image from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`);
                } catch (error) {
                    console.warn('[api.ts] Image compression failed, uploading original.', error);
                }
            }
            const result = await api.cloudinary.uploadToCloudinary(fileToUpload, 'listings');
            return { url: result.secure_url };
        },
        getMyListings: (params: any = {}) => {
            const query = new URLSearchParams(params).toString();
            return fetcher<{ data: Business[], meta: any }>(`/businesses/owner/my-listings?${query}`);
        },
        update: (id: string, listingData: any) => fetcher<Business>(`/businesses/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(listingData),
        }),
        getAlbums: (listingId: string) => fetcher<any[]>(`/businesses/${listingId}/albums`),
        createAlbum: (listingId: string, name: string) => fetcher<any[]>(`/businesses/${listingId}/albums`, {
            method: 'POST',
            body: JSON.stringify({ name }),
        }),
        renameAlbum: (listingId: string, albumId: string, name: string) => fetcher<any[]>(`/businesses/${listingId}/albums/${albumId}`, {
            method: 'PATCH',
            body: JSON.stringify({ name }),
        }),
        deleteAlbum: (listingId: string, albumId: string) => fetcher<any[]>(`/businesses/${listingId}/albums/${albumId}`, {
            method: 'DELETE',
        }),
        upsertAlbumImages: (listingId: string, albumId: string, images: any[]) => fetcher<any[]>(`/businesses/${listingId}/albums/${albumId}/images`, {
            method: 'PATCH',
            body: JSON.stringify({ images }),
        }),
        getAmenities: () => fetcher<any[]>('/businesses/amenities/all'),
        createAmenity: (data: { name: string, icon?: string }) => fetcher<any>('/businesses/amenities', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    },
    cities: {
        getPopular: (options?: FetcherOptions) => fetcher<City[]>('/cities/popular', options),
        getAll: (options?: FetcherOptions & { country?: string }) => {
            const country = options?.country?.trim();
            const query = country ? `?country=${encodeURIComponent(country)}` : '';
            return fetcher<City[]>(`/cities${query}`, options);
        },
        getCountries: (options?: FetcherOptions) => fetcher<string[]>('/cities/countries', options),
        getSupportedCountries: (options?: FetcherOptions) => fetcher<{ country: string; cityCount: number }[]>('/cities/supported-countries', options),
        // Admin endpoints
        adminCreate: (data: any) => fetcher<City>('/cities/admin', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        adminUpdate: (id: string, data: any) => fetcher<City>(`/cities/admin/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
        adminList: (page = 1, limit = 10, search = '') => {
            const query = new URLSearchParams({
                page: String(page),
                limit: String(limit),
                search
            }).toString();
            return fetcher<{ data: City[], total: number }>(`/cities/admin?${query}`);
        },
        adminDelete: (id: string) => fetcher<void>(`/cities/admin/${id}`, {
            method: 'DELETE',
        }),
        bulkImport: (country = 'Pakistan') => fetcher<{ count: number, total: number }>('/cities/admin/bulk-import', {
            method: 'POST',
            body: JSON.stringify({ country }),
            timeout: 60000,
        }),
    },
    addressConfig: {
        getCountries: (options?: FetcherOptions) =>
            fetcher<{ code: string; name: string }[]>('/address-config/countries', options),
        get: (countryCode: string) => fetcher<any>(`/address-config/${encodeURIComponent(countryCode)}`),
        validatePostal: (countryCode: string, postalCode: string) =>
            fetcher<{ valid: boolean }>(
                `/address-config/${encodeURIComponent(countryCode)}/validate-postal-code?postalCode=${encodeURIComponent(postalCode)}`,
            ),
    },
    reviews: {
        findAll: (params: any = {}, options?: FetcherOptions) => {
            const query = new URLSearchParams(params).toString();
            return fetcher<{ data: Review[], meta: any }>(`/reviews?${query}`, options);
        },
        getByBusiness: (idOrSlug: string, options?: FetcherOptions) => fetcher<{ data: Review[], meta: any }>(`/reviews/business/${idOrSlug}`, options),
        getByVendor: (vendorId: string, options?: FetcherOptions) => fetcher<{ data: Review[], meta: any }>(`/reviews?vendorId=${vendorId}`, options),
        getBusinessAll: (page = 1, limit = 20, options?: FetcherOptions) => fetcher<{ data: Review[], meta: any }>(`/reviews/business/all?page=${page}&limit=${limit}`, options),
        /** @deprecated use getBusinessAll */
        getVendorAll: (page = 1, limit = 20, options?: FetcherOptions) => fetcher<{ data: Review[], meta: any }>(`/reviews/business/all?page=${page}&limit=${limit}`, options),
        getPopular: (limit = 3, options?: FetcherOptions) => fetcher<{ data: Review[], meta: any }>(`/reviews?rating=5&limit=${limit}`, options),
        create: (reviewData: any) => fetcher<Review>('/reviews', {
            method: 'POST',
            body: JSON.stringify(reviewData),
        }),
        createReply: (reviewId: string, content: string) => fetcher<ReviewReply>(`/reviews/${reviewId}/replies`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        }),
        respond: (reviewId: string, response: string) => fetcher<Review>(`/reviews/${reviewId}/response`, {
            method: 'POST',
            body: JSON.stringify({ response }),
        }),
        // Admin endpoints
        adminGetAll: (params: any = {}) => {
            const query = new URLSearchParams(params).toString();
            return fetcher<{ data: Review[], meta: any }>(`/reviews/admin/all?${query}`);
        },
        adminModerate: (id: string, data: { isApproved?: boolean; isSuspicious?: boolean }) => fetcher<Review>(`/reviews/admin/${id}/moderate`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
        adminDelete: (id: string) => fetcher<void>(`/reviews/admin/${id}`, {
            method: 'DELETE',
        }),
    },
    cloudinary: {
        getSignature: () => fetcher<{ timestamp: number, signature: string, apiKey: string, cloudName: string }>('/cloudinary/sign', {
            method: 'POST',
        }),
        uploadToCloudinary: async (file: File, folder: string) => {
            // 1. Get signature from backend
            const { timestamp, signature, apiKey, cloudName } = await api.cloudinary.getSignature().catch(() => ({ timestamp: Date.now(), signature: '', apiKey: '', cloudName: '' }));

            if (!cloudName || !apiKey || !signature) {
                console.warn('[api.ts] Cloudinary credentials missing or sign failed, using local object URL fallback for listing upload');
                return { secure_url: URL.createObjectURL(file) };
            }

            console.log('[api.ts] UPLOAD DEBUG: Sending EXACTLY these params to Cloudinary:', {
                cloudName,
                api_key: apiKey,
                timestamp,
                signature,
                file: file.name
            });

            // 2. Upload directly to Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', apiKey);
            formData.append('timestamp', timestamp.toString());
            formData.append('signature', signature);

            // STRICT RULE: Do NOT append folder, upload_preset, or any other params.

            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Cloudinary upload failed' }));
                throw new Error(error.message || 'Direct upload to Cloudinary failed');
            }

            return response.json(); // Returns { secure_url, ... }
        }
    },
    users: {
        getProfile: (options?: FetcherOptions) => fetcher<any>('/users/profile', options),
        updateProfile: (profileData: any) => fetcher<any>('/users/profile', {
            method: 'PATCH',
            body: JSON.stringify(profileData),
        }),
        uploadAvatar: async (file: File) => {
            // 1. Upload to Cloudinary directly from client
            const result = await api.cloudinary.uploadToCloudinary(file, 'avatars');

            // 2. Update backend with the new URL
            return fetcher<any>('/users/profile/avatar', {
                method: 'PATCH',
                body: JSON.stringify({ avatarUrl: result.secure_url }),
            });
        },
        changePassword: (passwordData: any) => fetcher<void>('/users/password', {
            method: 'PATCH',
            body: JSON.stringify(passwordData),
        }),
        getFavorites: () => fetcher<{ data: Business[] }>('/users/favorites'),
        addFavorite: (businessId: string) => fetcher<void>(`/users/favorites/${businessId}`, {
            method: 'POST',
        }),
        removeFavorite: (businessId: string) => fetcher<void>(`/users/favorites/${businessId}`, {
            method: 'DELETE',
        }),
        getSavedOfferEvents: (page = 1, limit = 20) =>
            fetcher<{ data: any[]; meta: any }>(`/users/saved-offers-events?page=${page}&limit=${limit}`),
        addSavedOfferEvent: (offerEventId: string) => fetcher<void>(`/users/saved-offers-events/${offerEventId}`, {
            method: 'POST',
        }),
        removeSavedOfferEvent: (offerEventId: string) => fetcher<void>(`/users/saved-offers-events/${offerEventId}`, {
            method: 'DELETE',
        }),
        getNotifications: (params: any = {}) => {
            const query = new URLSearchParams(params).toString();
            return fetcher<{ data: any[], meta: any }>(`/users/notifications?${query}`);
        },
        markNotificationRead: (id: string) => fetcher<void>(`/users/notifications/${id}/read`, {
            method: 'PATCH',
        }),
        updateNotificationSettings: (settings: any) => fetcher<any>('/users/profile/notification-settings', {
            method: 'PATCH',
            body: JSON.stringify({ settings }),
        }),
        updateDeviceToken: (deviceToken: string) => fetcher<any>('/users/profile/device-token', {
            method: 'PATCH',
            body: JSON.stringify({ deviceToken }),
        }),
        requestDeletion: () => fetcher<any>('/users/profile', {
            method: 'DELETE',
        }),
        cancelDeletion: () => fetcher<any>('/users/profile/cancel-deletion', {
            method: 'POST',
        }),
    },
    businessProfiles: {
        getStats: (options?: FetcherOptions) => fetcher<any>('/business-profiles/dashboard-stats', options),
        getProfile: (options?: FetcherOptions) => fetcher<any>('/business-profiles/profile', options),
        updateProfile: (profileData: any) => fetcher<any>('/business-profiles/profile', {
            method: 'PATCH',
            body: JSON.stringify(profileData),
        }),
        register: (data: { businessName: string, businessPhone: string, businessAddress: string }) => fetcher<any>('/business-profiles/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        getByCity: (city: string) => fetcher<any>(`/business-profiles/by-city?city=${encodeURIComponent(city)}`),
        getPublicProfile: (id: string) => fetcher<any>(`/business-profiles/${id}/public`),
        getAllSlugs: () => fetcher<string[]>('/business-profiles/slugs/all'),
    },
    /** @deprecated Use api.businessProfiles */
    vendors: {
        getStats: (options?: FetcherOptions) => fetcher<any>('/business-profiles/dashboard-stats', options),
        getProfile: (options?: FetcherOptions) => fetcher<any>('/business-profiles/profile', options),
        updateProfile: (profileData: any) => fetcher<any>('/business-profiles/profile', {
            method: 'PATCH',
            body: JSON.stringify(profileData),
        }),
        becomeVendor: (data: { businessName: string, businessPhone: string }) => fetcher<any>('/business-profiles/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        getByCity: (city: string) => fetcher<any>(`/business-profiles/by-city?city=${encodeURIComponent(city)}`),
        getPublicProfile: (id: string) => fetcher<any>(`/business-profiles/${id}/public`),
        getAllSlugs: () => fetcher<string[]>('/business-profiles/slugs/all'),
    },
    leads: {
        getForBusiness: (params: any = {}) => {
            const query = new URLSearchParams(params).toString();
            return fetcher<any>(`/leads/business?${query}`);
        },
        /** @deprecated use getForBusiness */
        getForVendor: (params: any = {}) => {
            const query = new URLSearchParams(params).toString();
            return fetcher<any>(`/leads/business?${query}`);
        },
        getStats: () => fetcher<any>('/leads/business/stats'),
        updateStatus: (id: string, status: string) => fetcher<any>(`/leads/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),
        markRead: (id: string) => fetcher<any>(`/leads/${id}/read`, {
            method: 'PATCH'
        }),
        createLead: (data: {
            businessId: string;
            name: string;
            email: string;
            phone?: string;
            message: string;
            type?: 'call' | 'whatsapp' | 'chat';
            source?: string;
        }) => fetcher<any>('/leads', {
            method: 'POST',
            body: JSON.stringify({ ...data, type: data.type || 'chat' }),
        }),
        getMyEnquiries: (params: any = {}) => {
            const query = new URLSearchParams(params).toString();
            return fetcher<any>(`/leads/my-enquiries?${query}`);
        },
        addNote: (leadId: string, note: string) => fetcher<any>(`/leads/${leadId}/notes`, {
            method: 'POST',
            body: JSON.stringify({ note }),
        }),
        getNotes: (leadId: string) => fetcher<any[]>(`/leads/${leadId}/notes`),
    },
    auth: {
        login: (credentials: any) => fetcher<any>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        }),
        register: (userData: any) => fetcher<any>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        }),
        googleLogin: (data: { credential: string; role?: string; referralCode?: string }) => fetcher<any>('/auth/google', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        verifyEmail: (email: string, otp: string) => fetcher<{ success: boolean; message: string }>('/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify({ email, otp }),
        }),
        resendOtp: (email: string) => fetcher<{ success: boolean; message: string }>('/auth/resend-otp', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),
        logout: () => fetcher<void>('/auth/logout', { method: 'POST', silent: true }),
        ping: () => fetcher<{ online: boolean }>('/auth/ping', { method: 'POST', silent: true }),
        forgotPassword: (email: string) => fetcher<{ message: string }>('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),
        resetPassword: (email: string, code: string, newPassword: string) => fetcher<{ message: string }>('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, code, newPassword }),
        }),
    },
    expertQuote: {
        create: (data: any) => fetcher<any>('/expert-quote', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        getAll: (page = 1, limit = 20) => fetcher<any>(`/expert-quote?page=${page}&limit=${limit}`),
        getOne: (id: string) => fetcher<any>(`/expert-quote/${id}`),
    },
    admin: {
        getStats: () => fetcher<any>('/admin/stats'),
        getUsers: (page = 1, limit = 10) => fetcher<any>(`/admin/users?page=${page}&limit=${limit}`),
        getUserDetails: (id: string) => fetcher<any>(`/admin/users/${id}`),
        getUserConversations: (id: string) => fetcher<any>(`/admin/users/${id}/conversations`),
        updateUserRole: (id: string, role: string) => fetcher<any>(`/admin/users/${id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        }),
        toggleUserStatus: (id: string, isActive: boolean) => fetcher<any>(`/admin/users/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive }),
        }),
        deleteUser: (id: string) => fetcher<any>(`/admin/users/${id}`, {
            method: 'DELETE',
        }),
        scheduleUserDeletion: (id: string) => fetcher<any>(`/admin/users/${id}/schedule-deletion`, {
            method: 'POST',
        }),
        cancelUserDeletion: (id: string) => fetcher<any>(`/admin/users/${id}/cancel-deletion`, {
            method: 'POST',
        }),
        getBusinesses: (page = 1, limit = 20, status?: string, search?: string) => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(status && { status }),
                ...(search && { search }),
            });
            return fetcher<any>(`/admin/businesses?${params}`);
        },
        setBusinessSuspension: (id: string, suspended: boolean) => fetcher<any>(`/admin/business/${id}/suspension`, {
            method: 'PATCH',
            body: JSON.stringify({ suspended }),
        }),
        deleteBusiness: (id: string) => fetcher<any>(`/admin/businesses/${id}`, {
            method: 'DELETE',
        }),
        toggleFeatured: (id: string, isFeatured: boolean) => fetcher<any>(`/admin/business/${id}/featured`, {
            method: 'PATCH',
            body: JSON.stringify({ isFeatured }),
        }),
        toggleVerifiedListing: (id: string, isVerified: boolean) => fetcher<any>(`/admin/business/${id}/verify-listing`, {
            method: 'PATCH',
            body: JSON.stringify({ isVerified }),
        }),
        updateSearchKeywords: (id: string, keywords: string[]) => fetcher<any>(`/admin/business/${id}/search-keywords`, {
            method: 'PATCH',
            body: JSON.stringify({ keywords }),
        }),
        getVendors: (page = 1, limit = 20, isVerified?: boolean, search?: string) => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(isVerified !== undefined && { isVerified: isVerified.toString() }),
                ...(search && { search }),
            });
            return fetcher<any>(`/admin/vendors?${params}`);
        },
        verifyVendor: (id: string, status: boolean) => fetcher<any>(`/admin/vendor/${id}/verify?status=${status}`, {
            method: 'POST',
        }),
        getSettings: () => fetcher<Record<string, string>>('/admin/settings'),
        updateSettings: (settings: Record<string, string>) => fetcher<Record<string, string>>('/admin/settings', {
            method: 'PATCH',
            body: JSON.stringify(settings),
        }),
        getHeatmapData: (startDate?: string, endDate?: string) => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            return fetcher<any[]>(`/admin/heatmap-data?${params.toString()}`);
        },
        getEventDealPayments: () => fetcher<any[]>('/admin/event-deal-payments'),
        plans: {
            getAll: () => fetcher<any[]>('/subscriptions/plans/admin'),
            getById: (id: string) => fetcher<any>(`/subscriptions/plans/${id}`),
            create: (data: any) => fetcher<any>('/subscriptions/plans', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
            update: (id: string, data: any) => fetcher<any>(`/subscriptions/plans/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            }),
            delete: (id: string) => fetcher<any>(`/subscriptions/plans/${id}`, {
                method: 'DELETE',
            }),
        },
        pricingPlans: {
            getAll: () => fetcher<any[]>('/subscriptions/pricing/plans/admin'),
            create: (data: any) => fetcher<any>('/subscriptions/pricing/plans', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
            update: (id: string, data: any) => fetcher<any>(`/subscriptions/pricing/plans/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            }),
            delete: (id: string) => fetcher<any>(`/subscriptions/pricing/plans/${id}`, {
                method: 'DELETE',
            }),
        },
        globalSearch: (q: string) => fetcher<{
            businesses: any[],
            users: any[],
            categories: any[],
            cities: any[]
        }>(`/admin/search/global?q=${encodeURIComponent(q)}`),
        affiliate: {
            getReferrals: () => fetcher<any[]>('/affiliate/admin/referrals'),
            activateReferral: (id: string) => fetcher<any>(`/affiliate/admin/activate-referral/${id}`, { method: 'POST' }),
            getStats: () => fetcher<any>('/affiliate/admin/stats'),
            getPayouts: () => fetcher<any[]>('/affiliate/admin/payouts'),
            updatePayout: (id: string, status: string, notes?: string) => fetcher<any>(`/affiliate/admin/payouts/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status, notes }),
            }),
            updateSettings: (settings: any) => fetcher<any>('/affiliate/admin/settings', {
                method: 'PATCH',
                body: JSON.stringify(settings),
            }),
        },
        searchAnalytics: {
            getOverview: (params?: { startDate?: string; endDate?: string; city?: string }) => {
                const query = new URLSearchParams(params as any).toString();
                return fetcher<any>(`/admin/search-analytics/overview?${query}`);
            },
            getTopKeywords: (params?: { startDate?: string; endDate?: string; city?: string; limit?: number }) => {
                const query = new URLSearchParams(params as any).toString();
                return fetcher<any[]>(`/admin/search-analytics/top-keywords?${query}`);
            },
            getTopCities: (params?: { startDate?: string; endDate?: string; limit?: number }) => {
                const query = new URLSearchParams(params as any).toString();
                return fetcher<any[]>(`/admin/search-analytics/top-cities?${query}`);
            },
            getNoResults: (params?: { startDate?: string; endDate?: string; city?: string; limit?: number }) => {
                const query = new URLSearchParams(params as any).toString();
                return fetcher<any[]>(`/admin/search-analytics/no-results?${query}`);
            },
            getTrends: (params?: { startDate?: string; endDate?: string; city?: string }) => {
                const query = new URLSearchParams(params as any).toString();
                return fetcher<any[]>(`/admin/search-analytics/trends?${query}`);
            },
        },
    },

    notifications: {
        getAll: (options?: FetcherOptions) => fetcher('/notifications', options),
        markRead: (id: string) => fetcher(`/notifications/${id}/read`, { method: 'PATCH' }),
        markAllRead: () => fetcher('/notifications/read-all', { method: 'PATCH' }),
        delete: (id: string) => fetcher(`/notifications/${id}`, { method: 'DELETE' }),
        getVapidPublicKey: () => fetcher<{ publicKey: string }>('/notifications/vapid-public-key'),
        subscribePush: (subscription: any) => fetcher('/notifications/push-subscribe', {
            method: 'POST',
            body: JSON.stringify(subscription),
        }),
    },
    affiliate: {
        join: (dto: any) => fetcher('/affiliate/join', { method: 'POST', body: JSON.stringify(dto) }),
        getStats: () => fetcher<any>('/affiliate/stats'),
        getReferrals: () => fetcher<any[]>('/affiliate/referrals'),
        trackClick: (code: string) => fetcher(`/affiliate/track-click?code=${code}`, { method: 'POST', silent: true }),
        applyReferral: (code: string) => fetcher<{ success: boolean; message: string }>('/affiliate/apply-referral', {
            method: 'POST',
            body: JSON.stringify({ code }),
        }),

        requestPayout: (data: { amount: number; method: string; details: string }) => fetcher('/affiliate/payouts', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        getPayouts: () => fetcher<any[]>('/affiliate/payouts'),
        getSettings: () => fetcher<any>('/affiliate/settings'),
    },
    subscriptions: {
        getPlans: (options?: FetcherOptions) => fetcher<any[]>('/subscriptions/plans', options),
        getPricingPlans: (type?: string) => fetcher<any[]>(`/subscriptions/pricing/plans${type ? `?type=${type}` : ''}`),
        getActive: (options?: FetcherOptions) => fetcher<any>('/subscriptions/active', options),
        getActivePromotions: (options?: FetcherOptions) => fetcher<any>('/subscriptions/active-promotions', options),
        getMyInvoices: (options?: FetcherOptions) => fetcher<any[]>('/subscriptions/my-invoices', options),
        getInvoice: (id: string, options?: FetcherOptions) => fetcher<any>(`/subscriptions/invoice/${id}`, options),
        mockCheckout: (planId: string) => fetcher<any>(`/subscriptions/mock-success/${planId}`, { method: 'POST' }),
        createCheckout: (planId: string) => api.post<{ sessionId: string; checkoutUrl: string }>('/subscriptions/checkout', { planId }),
        verify: (sessionId: string) => api.post<{ success: boolean; alreadyProcessed: boolean }>('/subscriptions/verify', { sessionId }),
        changePlan: (planId: string) => api.post<any>('/subscriptions/change', { planId }),

        // Admin
        adminGetAll: (page = 1, limit = 20) => fetcher<any>(`/subscriptions/admin/all?page=${page}&limit=${limit}`),
        adminGetTransactions: (page = 1, limit = 20) => fetcher<any>(`/subscriptions/admin/transactions?page=${page}&limit=${limit}`),
        adminAssign: (data: { vendorId: string; planId: string; durationDays?: number }) =>
            fetcher<any>('/subscriptions/admin/assign', { method: 'POST', body: JSON.stringify(data) }),
        adminCancel: (subId: string) => fetcher<any>(`/subscriptions/admin/${subId}/cancel`, { method: 'PATCH' }),
        adminTriggerExpiryCheck: () => fetcher<any>('/subscriptions/admin/trigger-expiry-check', { method: 'POST' }),
    },
    enquiries: {
        reply: (leadId: string, message: string) => fetcher<any>(`/leads/${leadId}/reply`, {
            method: 'PATCH',
            body: JSON.stringify({ message }),
        }),
    },
    offers: {
        getById: (id: string) => fetcher<any>(`/offers/public/${id}`),
        create: (data: any) => fetcher<any>('/offers', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        getMy: (page = 1, limit = 10, type?: 'offer' | 'event') => 
            fetcher<{ data: any[]; meta: any }>(`/offers/owner?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`),
        update: (id: string, data: any) => fetcher<any>(`/offers/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
        publish: (id: string) => fetcher<any>(`/offers/${id}/publish`, {
            method: 'POST',
        }),
        remove: (id: string) => fetcher<any>(`/offers/${id}`, {
            method: 'DELETE',
        }),
        // Admin
        adminGetAll: (page = 1, limit = 20) => fetcher<{ data: any[]; meta: any }>(`/offers/admin/all?page=${page}&limit=${limit}`),
        adminToggleFeatured: (id: string, isFeatured: boolean) => fetcher(`/offers/admin/${id}/feature`, {
            method: 'PATCH',
            body: JSON.stringify({ isFeatured }),
        }),
        getByBusiness: (businessId: string) =>
            fetcher<any[]>(`/offers/business/${businessId}/offers`),
        search: (params: Record<string, string | number | boolean | undefined | null>) => {
            const sanitizedParams: Record<string, string> = {};
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '' && value !== false) {
                    sanitizedParams[key] = String(value);
                }
            });
            const query = new URLSearchParams(sanitizedParams).toString();
            return fetcher<{ data: any[]; meta: any }>(`/offers/public/search?${query}`);
        },
    },
    deals: {
        getById: (id: string) => fetcher<any>(`/deals/public/${id}`),
        create: (data: any) => fetcher<any>('/deals', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        getMy: (page = 1, limit = 10) => 
            fetcher<{ data: any[]; meta: any }>(`/deals/owner?page=${page}&limit=${limit}`),
        update: (id: string, data: any) => fetcher<any>(`/deals/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
        publish: (id: string) => fetcher<any>(`/deals/${id}/publish`, {
            method: 'POST',
        }),
        remove: (id: string) => fetcher<any>(`/deals/${id}`, {
            method: 'DELETE',
        }),
        // Admin
        adminGetAll: (page = 1, limit = 20) => fetcher<{ data: any[]; meta: any }>(`/deals/admin/all?page=${page}&limit=${limit}`),
        adminToggleFeatured: (id: string, isFeatured: boolean) => fetcher(`/deals/admin/${id}/feature`, {
            method: 'PATCH',
            body: JSON.stringify({ isFeatured }),
        }),
        getByBusiness: (businessId: string) =>
            fetcher<any[]>(`/deals/business/${businessId}/deals`),
        search: (params: Record<string, string | number | boolean | undefined | null>) => {
            const sanitizedParams: Record<string, string> = {};
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '' && value !== false) {
                    sanitizedParams[key] = String(value);
                }
            });
            const query = new URLSearchParams(sanitizedParams).toString();
            return fetcher<{ data: any[]; meta: any }>(`/deals/public/search?${query}`);
        },
    },
    events: {
        getById: (id: string) => fetcher<any>(`/events/public/${id}`),
        create: (data: any) => fetcher<any>('/events', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        getMy: (page = 1, limit = 10) => 
            fetcher<{ data: any[]; meta: any }>(`/events/owner?page=${page}&limit=${limit}`),
        update: (id: string, data: any) => fetcher<any>(`/events/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
        publish: (id: string) => fetcher<any>(`/events/${id}/publish`, {
            method: 'POST',
        }),
        remove: (id: string) => fetcher<any>(`/events/${id}`, {
            method: 'DELETE',
        }),
        // Admin
        adminGetAll: (page = 1, limit = 20) => fetcher<{ data: any[]; meta: any }>(`/events/admin/all?page=${page}&limit=${limit}`),
        adminToggleFeatured: (id: string, isFeatured: boolean) => fetcher(`/events/admin/${id}/feature`, {
            method: 'PATCH',
            body: JSON.stringify({ isFeatured }),
        }),
        getByBusiness: (businessId: string) =>
            fetcher<any[]>(`/events/business/${businessId}/events`),
        search: (params: Record<string, string | number | boolean | undefined | null>) => {
            const sanitizedParams: Record<string, string> = {};
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '' && value !== false) {
                    sanitizedParams[key] = String(value);
                }
            });
            const query = new URLSearchParams(sanitizedParams).toString();
            return fetcher<{ data: any[]; meta: any }>(`/events/public/search?${query}`);
        },
    },
    comments: {
        create: (data: any) => fetcher<any>('/comments', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        getPublic: (page = 1, limit = 10) =>
            fetcher<{ data: any[]; meta: any }>(`/comments/public?page=${page}&limit=${limit}`),
        getByBusiness: (businessId: string, page = 1, limit = 10) =>
            fetcher<{ data: any[]; meta: any }>(`/business/${businessId}/comments?page=${page}&limit=${limit}`),
        getBusinessComments: (page = 1, limit = 10) =>
            fetcher<{ data: any[]; meta: any }>(`/business/comments?page=${page}&limit=${limit}`),
        /** @deprecated use getBusinessComments */
        getVendorComments: (page = 1, limit = 10) =>
            fetcher<{ data: any[]; meta: any }>(`/business/comments?page=${page}&limit=${limit}`),
        reply: (commentId: string, data: any) =>
            fetcher<any>(`/business/comments/${commentId}/reply`, {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        updateReply: (replyId: string, data: any) =>
            fetcher<any>(`/business/comments/reply/${replyId}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            }),
        deleteReply: (replyId: string) =>
            fetcher<void>(`/business/comments/reply/${replyId}`, {
                method: 'DELETE',
            }),
    },
    demand: {
        getInsights: (city?: string) => fetcher<any[]>(`/demand/insights${city ? `?city=${city}` : ''}`, { silent: true }),
        getOverview: (city?: string) => fetcher<any>(`/demand/overview${city ? `?city=${city}` : ''}`, { silent: true }),
        getAISummary: (city?: string) => fetcher<{ summary: string }>(`/demand/summary-ai${city ? `?city=${city}` : ''}`, { silent: true }),
        getNearby: (lat?: number, lng?: number) => fetcher<any[]>(`/demand/nearby${lat !== undefined && lng !== undefined ? `?lat=${lat}&lng=${lng}` : ''}`, { silent: true }),
        getHeatmap: (startDate?: string, endDate?: string, keyword?: string) => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (keyword) params.append('keyword', keyword);
            return fetcher<any[]>(`/demand/heatmap?${params.toString()}`, { silent: true });
        },
        logSearch: (data: any) => fetcher('/demand/log', { method: 'POST', body: JSON.stringify(data), silent: true }),
    },
    follows: {
        follow: (businessId: string) =>
            fetcher<{ followersCount: number }>(`/follows/${businessId}`, { method: 'POST' }),
        unfollow: (businessId: string) =>
            fetcher<{ followersCount: number }>(`/follows/${businessId}`, { method: 'DELETE' }),
        check: (businessId: string) =>
            fetcher<{ isFollowing: boolean; followersCount: number }>(`/follows/${businessId}/check`, { silent: true }),
        count: (businessId: string) =>
            fetcher<{ followersCount: number }>(`/follows/${businessId}/count`, { silent: true }),
        myFollows: (page = 1, limit = 20) =>
            fetcher<{ data: Business[]; meta: any }>(`/follows/my?page=${page}&limit=${limit}`),
    },
    broadcasts: {
        create: (data: any) => fetcher<any>('/broadcasts', { method: 'POST', body: JSON.stringify(data) }),
        getMyLeads: () => fetcher<any[]>('/broadcasts/my-leads'),
        getBusinessInbox: () => fetcher<any[]>('/broadcasts/business/inbox'),
        /** @deprecated use getBusinessInbox */
        getVendorInbox: () => fetcher<any[]>('/broadcasts/business/inbox'),
        getStats: () => fetcher<{ newCount: number }>('/broadcasts/business/stats'),
        respond: (id: string, data: any) => fetcher<any>(`/broadcasts/${id}/respond`, { method: 'POST', body: JSON.stringify(data) }),
        getResponses: (id: string) => fetcher<any[]>(`/broadcasts/${id}/responses`),
    },
    promotions: {
        getVisibilityRate: (type: 'deal' | 'event' = 'deal', options?: FetcherOptions) =>
            fetcher<{ dayRate: number; type: string }>(`/promotions/visibility-rate?type=${type}`, { silent: true, ...options }),
        calculateVisibility: (data: { startTime: string; endTime: string; type: 'deal' | 'event' }) =>
            api.post<{ days: number; dayRate: number; totalPrice: number }>('/promotions/calculate-visibility', data),
        getPricingRules: (options?: FetcherOptions) => fetcher<any[]>('/promotions/pricing-rules', options),
        calculatePrice: (data: { placements?: string[]; startTime: string; endTime: string; pricingId?: string; dealId?: string; eventId?: string }, type: string = 'offer') =>
            api.post<{ totalPrice: number; durationHours: number; breakup: any[]; isMinimumApplied?: boolean }>(`/promotions/calculate?type=${type}`, data),
        book: (data: { offerEventId?: string; dealId?: string; eventId?: string; placements?: string[]; startTime: string; endTime: string }) =>
            api.post<{ sessionId?: string; checkoutUrl?: string; success?: boolean; bookingId?: string }>('/promotions/book', data),
        verifySession: (sessionId: string) => fetcher<any>(`/promotions/verify-session?session_id=${sessionId}`),
    },
    businessSetup: {
        getQuestions: (options?: FetcherOptions) => fetcher<any[]>('/business-setup/questions', { silent: true, ...options }),
        getStatus: (options?: FetcherOptions) => fetcher<{ isCompleted: boolean; answers: Record<string, string[]> }>('/business-setup/status', { silent: true, ...options }),
        saveAnswers: (answers: Record<string, string | string[]>) =>
            api.post<{ success: boolean }>('/business-setup/answers', { answers }),
        checkDuplicate: (data: {
            businessName: string;
            phone: string;
            address: string;
            city: string;
            state?: string;
            latitude?: string;
            longitude?: string;
        }) => api.post<{ showPrompt: boolean; signals: string[]; matchCount: number }>('/business-setup/duplicate-check', data),
    },
    location: {
        placesAutocomplete: (params: { input: string; sessionToken: string; countryCode?: string }) => {
            const q = new URLSearchParams({
                input: params.input,
                sessionToken: params.sessionToken,
            });
            if (params.countryCode) q.set('countryCode', params.countryCode);
            return fetcher<Array<{ placeId: string; description: string }>>(`/location/places/autocomplete?${q.toString()}`, { silent: true });
        },
        resolvePlace: (description: string, sessionToken: string) =>
            fetcher<{
                placeId: string;
                formattedAddress: string;
                latitude: number;
                longitude: number;
                city?: string;
                state?: string;
                postalCode?: string;
                country?: string;
                streetAddress?: string;
            } | null>('/location/places/resolve', {
                method: 'POST',
                body: JSON.stringify({ description, sessionToken }),
                silent: true,
            }),
    },
    qa: {
        getForBusiness: (businessId: string, options?: FetcherOptions) => fetcher<any[]>(`/qa/business/${businessId}`, { silent: true, ...options }),
        askQuestion: (data: { businessId: string; content: string }) =>
            fetcher<any>('/qa/questions', { method: 'POST', body: JSON.stringify(data) }),
        postAnswer: (data: { questionId: string; content: string }) =>
            fetcher<any>('/qa/answers', { method: 'POST', body: JSON.stringify(data) }),
        getPending: () => fetcher<{ questions: any[]; answers: any[] }>('/qa/admin/pending'),
        moderateQuestion: (id: string, data: { status: string; reason?: string }) =>
            fetcher<any>(`/qa/admin/questions/${id}/moderate`, { method: 'PATCH', body: JSON.stringify(data) }),
        moderateAnswer: (id: string, data: { status: string; reason?: string }) =>
            fetcher<any>(`/qa/admin/answers/${id}/moderate`, { method: 'PATCH', body: JSON.stringify(data) }),
    },
};


