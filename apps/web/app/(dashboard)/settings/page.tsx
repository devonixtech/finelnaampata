"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Settings, User, Phone, MapPin, Globe, Save, Loader2, CheckCircle2, AlertCircle, Upload, KeyRound, Camera, ChevronDown, Clock, Facebook, Instagram, Linkedin, Twitter, Youtube, ExternalLink, Trash2, Plus, Share2, AlertTriangle, RefreshCcw, Bell, Mail, ShieldCheck, Award, Lock } from 'lucide-react';
import { api, getImageUrl } from '../../../lib/api';
import BusinessAvatar from '../../../components/BusinessAvatar';
import { useAuth } from '../../../context/AuthContext';
import { City } from '../../../types/api';
import { COUNTRIES_STATES, CountryData } from '../../../lib/data/countries-states';

export default function AccountSettings() {
    const { user, loading: authLoading, updateUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const hasFetched = useRef(false);
    const isFetching = useRef(false);

    // Profile State
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewImage, setPreviewImage] = useState<string | null | undefined>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [allCities, setAllCities] = useState<City[]>([]);
    const [availableStates, setAvailableStates] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        avatarUrl: '',
        city: '',
        state: '',
        country: 'Pakistan',
        // Business fields
        businessName: '',
        businessEmail: '',
        businessPhone: '',
        businessAddress: '',
        gstNumber: '',
        ntnNumber: '',
        businessHours: {} as Record<string, { isOpen: boolean, openTime: string, closeTime: string }>,
        socialLinks: [] as { platform: string, url: string }[],
        notificationSettings: {
            email: {
                marketing: true,
                security: true,
                updates: true,
                leads: true
            },
            push: {
                new_message: true,
                new_review: true,
                system_alerts: true,
                offers: true
            }
        }
    });

    // Password State
    const [pwdSaving, setPwdSaving] = useState(false);
    const [pwdSuccess, setPwdSuccess] = useState(false);
    const [pwdError, setPwdError] = useState<string | null>(null);
    const [pwdData, setPwdData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Deletion State
    const [deletionLoading, setDeletionLoading] = useState(false);
    const [deletionStatus, setDeletionStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            console.log('[AccountSettings] fetchData triggered', { hasFetched: hasFetched.current, isFetching: isFetching.current, authLoading, hasUser: !!user });
            if (hasFetched.current || isFetching.current) return;

            // Wait for auth to resolve before making decisions
            if (authLoading) return;

            // If auth resolved and no user, we can't fetch profile
            if (!user) {
                console.log('[AccountSettings] auth resolved but no user, ending load');
                setLoading(false);
                return;
            }

            console.log('[AccountSettings] starting profile fetch');
            isFetching.current = true;
            setLoading(true);

            try {
                // Fetch cities and profile in parallel
                const [citiesData, profile] = await Promise.all([
                    api.cities.getAll().catch((err: any) => {
                        console.error('Failed to fetch cities:', err);
                        return [];
                    }),
                    api.users.getProfile()
                ]);

                // Update Cities State
                setAllCities(citiesData);
                const states = Array.from(new Set(citiesData.map((c: any) => c.state).filter(Boolean))) as string[];
                setAvailableStates(states.sort());

                // Update Profile State
                if (profile) {
                    setFormData(prev => ({
                        ...prev,
                        fullName: profile.fullName || '',
                        phone: profile.phone || '',
                        avatarUrl: profile.avatarUrl || '',
                        city: profile.city || '',
                        state: profile.state || '',
                        country: profile.country || 'Pakistan',
                        businessName: profile.vendor?.businessName || '',
                        businessEmail: profile.vendor?.businessEmail || '',
                        businessPhone: profile.vendor?.businessPhone || '',
                        businessAddress: profile.vendor?.businessAddress || '',
                        gstNumber: profile.vendor?.gstNumber || '',
                        ntnNumber: profile.vendor?.ntnNumber || '',
                        businessHours: profile.vendor?.businessHours || {
                            monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                            tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                            wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                            thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                            friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                            saturday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
                            sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
                        },
                        socialLinks: profile.vendor?.socialLinks || [],
                        notificationSettings: profile.notificationSettings || prev.notificationSettings
                    }));
                    if (profile.avatarUrl) {
                        setPreviewImage(getImageUrl(profile.avatarUrl));
                    }
                    if (updateUser) {
                        updateUser(profile);
                    }
                }
                console.log('[AccountSettings] fetch success', { profile: !!profile });
                hasFetched.current = true;
            } catch (err) {
                console.error('[AccountSettings] fetch error', err);
                setError('Failed to load profile data. Please try refreshing.');
            } finally {
                console.log('[AccountSettings] finally: setting loading to false');
                setLoading(false);
                isFetching.current = false;
            }
        };

        fetchData();
    }, [user, authLoading, updateUser]);

    // Profile Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (success) setSuccess(false);
        if (error) setError(null);
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            // Reset state/city if country changes
            if (name === 'country') {
                newData.state = '';
                newData.city = '';
            }
            // Reset city if state changes
            if (name === 'state') {
                newData.city = '';
            }
            return newData;
        });
        if (success) setSuccess(false);
        if (error) setError(null);
    };

    const handleBusinessHoursChange = (day: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            businessHours: {
                ...prev.businessHours,
                [day]: {
                    ...prev.businessHours[day],
                    [field]: value
                }
            }
        }));
        if (success) setSuccess(false);
        if (error) setError(null);
    };

    const addSocialLink = () => {
        setFormData(prev => ({
            ...prev,
            socialLinks: [...prev.socialLinks, { platform: 'facebook', url: '' }]
        }));
    };

    const removeSocialLink = (index: number) => {
        setFormData(prev => ({
            ...prev,
            socialLinks: prev.socialLinks.filter((_, i) => i !== index)
        }));
    };

    const handleSocialLinkChange = (index: number, field: string, value: string) => {
        setFormData(prev => {
            const newLinks = [...prev.socialLinks];
            newLinks[index] = { ...newLinks[index], [field]: value };
            return { ...prev, socialLinks: newLinks };
        });
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            // Use URL.createObjectURL for instant preview
            const objectUrl = URL.createObjectURL(file);
            setPreviewImage(objectUrl);

            if (success) setSuccess(false);
            if (error) setError(null);

            // Important:Revoke the URL when the component unmounts or image changes
            return () => URL.revokeObjectURL(objectUrl);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);
        setError(null);

        try {
            let currentAvatarUrl = formData.avatarUrl;

            // 1. Upload avatar if changed
            if (avatarFile) {
                const response = await api.users.uploadAvatar(avatarFile);
                currentAvatarUrl = response.user.avatarUrl;
                setFormData(prev => ({ ...prev, avatarUrl: currentAvatarUrl }));
            }

            // 2. Update user profile
            await api.users.updateProfile({
                fullName: formData.fullName,
                phone: formData.phone,
                city: formData.city,
                state: formData.state,
                country: formData.country,
                avatarUrl: currentAvatarUrl
            });

            // 3. Update business profile — ONLY if the user is explicitly a business
            if (user?.role === 'vendor') {
                // Strip empty strings — @IsOptional() only skips undefined/null, not ""
                const vendorPayload: any = {
                    businessName: formData.businessName || undefined,
                    businessEmail: formData.businessEmail || undefined,
                    businessPhone: formData.businessPhone || undefined,
                    businessAddress: formData.businessAddress || undefined,
                    gstNumber: formData.gstNumber || undefined,
                    ntnNumber: formData.ntnNumber || undefined,
                    businessHours: formData.businessHours,
                    socialLinks: formData.socialLinks,
                };
                // Remove undefined keys so they aren't serialised to JSON as null
                Object.keys(vendorPayload).forEach(k => {
                    if (vendorPayload[k] === undefined) delete vendorPayload[k];
                });
                await api.businessProfiles.updateProfile(vendorPayload);
            }

            // 4. Update Notification Settings
            await api.users.updateNotificationSettings(formData.notificationSettings);

            // 4. BIG SYNC: Re-fetch the entire profile from the backend to ensure a source of truth
            const finalFullProfile = await api.users.getProfile();

            // Sync AuthContext and local form state with the re-fetched data
            if (updateUser) {
                updateUser(finalFullProfile);
            }

            setFormData(prev => ({
                ...prev,
                fullName: finalFullProfile.fullName || '',
                phone: finalFullProfile.phone || '',
                avatarUrl: finalFullProfile.avatarUrl || '',
                city: finalFullProfile.city || '',
                state: finalFullProfile.state || '',
                country: finalFullProfile.country || 'Pakistan',
                businessName: finalFullProfile.vendor?.businessName || '',
                businessEmail: finalFullProfile.vendor?.businessEmail || '',
                businessPhone: finalFullProfile.vendor?.businessPhone || '',
                businessAddress: finalFullProfile.vendor?.businessAddress || '',
                gstNumber: finalFullProfile.vendor?.gstNumber || '',
                ntnNumber: finalFullProfile.vendor?.ntnNumber || '',
                businessHours: finalFullProfile.vendor?.businessHours || formData.businessHours,
                socialLinks: finalFullProfile.vendor?.socialLinks || [],
                notificationSettings: finalFullProfile.notificationSettings || formData.notificationSettings
            }));

            if (finalFullProfile.avatarUrl) {
                setPreviewImage(getImageUrl(finalFullProfile.avatarUrl));
            }

            setSuccess(true);
            setAvatarFile(null);
        } catch (err: any) {
            console.error('Failed to update profile:', err);
            setError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    // Password Handlers
    const handlePwdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPwdData(prev => ({ ...prev, [name]: value }));
        if (pwdSuccess) setPwdSuccess(false);
        if (pwdError) setPwdError(null);
    };

    const handlePwdSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwdSaving(true);
        setPwdSuccess(false);
        setPwdError(null);

        if (pwdData.newPassword.length < 8) {
            setPwdError('Password must be at least 8 characters long');
            setPwdSaving(false);
            return;
        }

        if (pwdData.newPassword !== pwdData.confirmPassword) {
            setPwdError('New passwords do not match');
            setPwdSaving(false);
            return;
        }

        try {
            await api.users.changePassword({
                oldPassword: pwdData.oldPassword,
                newPassword: pwdData.newPassword
            });
            setPwdSuccess(true);
            setPwdData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            console.error('Failed to change password:', err);
            setPwdError(err.message || 'Failed to change password');
        } finally {
            setPwdSaving(false);
        }
    };

    const handleNotificationToggle = (type: 'email' | 'push', key: string) => {
        setFormData(prev => {
            const currentSettings = (prev.notificationSettings || {}) as any;
            const currentTypeSettings = (currentSettings[type] || {}) as any;
            
            return {
                ...prev,
                notificationSettings: {
                    ...currentSettings,
                    [type]: {
                        ...currentTypeSettings,
                        [key]: !currentTypeSettings[key]
                    }
                }
            } as typeof prev;
        });
    };

    const handleRequestDeletion = async () => {
        if (!confirm('Are you sure you want to delete your account? This action will schedule your account for permanent deletion in 30 days.')) {
            return;
        }

        setDeletionLoading(true);
        setDeletionStatus(null);
        try {
            await api.users.requestDeletion();
            setDeletionStatus({ type: 'success', message: 'Account deletion scheduled. You have 30 days to cancel this request.' });
            // Re-sync profile to show deletion info
            const updatedProfile = await api.users.getProfile();
            if (updateUser) updateUser(updatedProfile);
        } catch (err: any) {
            setDeletionStatus({ type: 'error', message: err.message || 'Failed to request account deletion' });
        } finally {
            setDeletionLoading(false);
        }
    };

    const handleCancelDeletion = async () => {
        setDeletionLoading(true);
        setDeletionStatus(null);
        try {
            await api.users.cancelDeletion();
            setDeletionStatus({ type: 'success', message: 'Account deletion cancelled.' });
            // Re-sync profile
            const updatedProfile = await api.users.getProfile();
            if (updateUser) updateUser(updatedProfile);
        } catch (err: any) {
            setDeletionStatus({ type: 'error', message: err.message || 'Failed to cancel account deletion' });
        } finally {
            setDeletionLoading(false);
        }
    };

    const getDaysLeft = (scheduledAt: string) => {
        const deleteDate = new Date(scheduledAt);
        deleteDate.setDate(deleteDate.getDate() + 30);
        const remaining = deleteDate.getTime() - new Date().getTime();
        const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
    };

    const getScheduledDeleteDate = (scheduledAt: string) => {
        const deleteDate = new Date(scheduledAt);
        deleteDate.setDate(deleteDate.getDate() + 30);
        return deleteDate;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest">Loading Settings...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl pb-24">
            <header className="mb-12">
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/10">
                        <Settings className="w-6 h-6" />
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                        Account Settings
                    </h1>
                </div>
                <p className="text-slate-400 font-bold text-lg ml-1">Manage your identity, security, and account status.</p>
            </header>

            <div className="space-y-12">
                {/* Reputation & Trust Score */}


                {/* General Profile Info */}
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden group">
                    <div className="p-10 lg:p-12 border-b border-slate-50 bg-slate-50/30 relative overflow-hidden">
                        <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-50/50 rounded-full group-hover:scale-110 transition-transform duration-700" />
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Personal Information</h3>
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Configure your identity across the platform</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 lg:p-12 space-y-10 relative z-10">
                        {success && (
                            <div className="flex items-center gap-3 p-5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-[24px] animate-in fade-in slide-in-from-top-2">
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <span className="font-black text-xs uppercase tracking-widest">Profile updated successfully!</span>
                            </div>
                        )}
                        {error && (
                            <div className="flex items-center gap-3 p-5 bg-rose-50 border border-rose-100 text-rose-600 rounded-[24px] animate-in fade-in slide-in-from-top-2">
                                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <span className="font-black text-xs uppercase tracking-widest">{error}</span>
                            </div>
                        )}

                        {/* Avatar Upload */}
                        <div className="flex flex-col sm:flex-row items-start gap-8 border-b border-slate-100 pb-8">
                            <div className="relative group">
                                <BusinessAvatar
                                    src={avatarFile ? previewImage : formData.avatarUrl}
                                    alt={formData.fullName || 'User'}
                                    size="lg"
                                    className="border-4 border-white shadow-lg"
                                    isPreview={!!avatarFile}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-3 -right-3 w-12 h-12 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:scale-110 transition-all cursor-pointer"
                                >
                                    <Camera className="w-5 h-5" />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/webp"
                                />
                            </div>
                            <div className="pt-2">
                                <h4 className="font-bold text-slate-900 text-lg mb-1">Profile Photo</h4>
                                <p className="text-sm text-slate-500 mb-4 font-medium max-w-sm">We recommend an image of at least 400x400px. You can upload a PNG or JPEG.</p>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                                >
                                    Choose File
                                </button>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                                    <User className="w-3.5 h-3.5" /> Full Name
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="e.g. John Doe"
                                    className="w-full px-6 py-4 bg-slate-50 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                                    <Phone className="w-3.5 h-3.5" /> Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="e.g. +1 234 567 890"
                                    className="w-full px-6 py-4 bg-slate-50 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                                    <Globe className="w-3.5 h-3.5" /> Country / Region
                                </label>
                                <div className="relative">
                                    <select
                                        name="country"
                                        value={formData.country}
                                        onChange={handleSelectChange}
                                        className="w-full px-6 py-4 bg-slate-50 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        {COUNTRIES_STATES.map(c => (
                                            <option key={c.code} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                                    <Globe className="w-3.5 h-3.5" /> State / Province
                                </label>
                                <div className="relative">
                                    <select
                                        name="state"
                                        value={formData.state}
                                        onChange={handleSelectChange}
                                        className="w-full px-6 py-4 bg-slate-50 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">Select state / province</option>
                                        {(() => {
                                            const country = COUNTRIES_STATES.find(c => c.name === formData.country);
                                            return country ? country.states.map(s => (
                                                <option key={s.code} value={s.name}>{s.name}</option>
                                            )) : [];
                                        })()}
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                                    <MapPin className="w-3.5 h-3.5" /> City
                                </label>
                                <div className="relative">
                                    <input
                                        list="settings-city-list"
                                        name="city"
                                        value={formData.city}
                                        onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                        placeholder={formData.state ? "Type or select a city" : "Select state first"}
                                        disabled={!formData.state}
                                        className="w-full px-6 py-4 bg-slate-50 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <datalist id="settings-city-list">
                                        {formData.country === 'Pakistan' ? (
                                            allCities
                                                .filter(c => c.state === formData.state)
                                                .map(city => (
                                                    <option key={city.id} value={city.name} />
                                                ))
                                        ) : []}
                                    </datalist>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center justify-center gap-3 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black  shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Save Profile
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Business Information (Business Only) */}
                {(user?.role === 'vendor' || user?.vendor) && (
                    <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-8 lg:p-12 border-b border-slate-50 bg-slate-50/30">
                            <h3 className="text-xl font-black text-slate-900 mb-2">Business Information</h3>
                            <p className="text-sm text-slate-500 font-medium">Manage your business profile and contact details.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 lg:p-12 space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                                        Business Name
                                    </label>
                                    <input
                                        type="text"
                                        name="businessName"
                                        value={formData.businessName}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 bg-slate-50 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                                        Business Email
                                    </label>
                                    <input
                                        type="email"
                                        name="businessEmail"
                                        value={formData.businessEmail}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 bg-slate-50 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                                        Business Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="businessPhone"
                                        value={formData.businessPhone}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 bg-slate-50 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-3 md:col-span-2">
                                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                                        Business Address
                                    </label>
                                    <input
                                        type="text"
                                        name="businessAddress"
                                        required
                                        value={formData.businessAddress}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 bg-slate-50 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100 mt-8">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Tax Information</h4>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                                            GST Number
                                        </label>
                                        <input
                                            type="text"
                                            name="gstNumber"
                                            value={formData.gstNumber}
                                            onChange={handleChange}
                                            placeholder="Optional"
                                            className="w-full px-6 py-4 bg-slate-50 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                                            National Tax Number (NTN)
                                        </label>
                                        <input
                                            type="text"
                                            name="ntnNumber"
                                            value={formData.ntnNumber}
                                            onChange={handleChange}
                                            placeholder="1234567-8"
                                            className="w-full px-6 py-4 bg-slate-50 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center justify-center gap-3 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black  shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                                >
                                    {saving ? 'Updating...' : 'Save Business Info'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Business Hours (Business Only) */}
                {(user?.role === 'vendor' || user?.vendor) && (
                    <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-8 lg:p-12 border-b border-slate-50 bg-slate-50/30 flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">Business Hours</h3>
                                <p className="text-sm text-slate-500 font-medium">Set your weekly availability. This will be shown to customers on your listings.</p>
                            </div>
                        </div>

                        <div className="p-8 lg:p-12 space-y-6">
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                                <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-4 py-4 border-b border-slate-50 last:border-0">
                                    <div className="w-32">
                                        <span className="text-sm font-black text-slate-900 uppercase tracking-widest">{day}</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={formData.businessHours[day]?.isOpen || false}
                                                onChange={(e) => handleBusinessHoursChange(day, 'isOpen', e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                            <span className="ms-3 text-sm font-bold text-slate-600">
                                                {formData.businessHours[day]?.isOpen ? 'Open' : 'Closed'}
                                            </span>
                                        </label>

                                        {formData.businessHours[day]?.isOpen && (
                                            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                                                <input
                                                    type="time"
                                                    value={formData.businessHours[day]?.openTime || '09:00'}
                                                    onChange={(e) => handleBusinessHoursChange(day, 'openTime', e.target.value)}
                                                    className="px-3 py-2 bg-slate-50 border-transparent focus:border-blue-500/20 focus:bg-white rounded-xl text-xs font-bold transition-all outline-none"
                                                />
                                                <span className="text-slate-400 font-bold">to</span>
                                                <input
                                                    type="time"
                                                    value={formData.businessHours[day]?.closeTime || '18:00'}
                                                    onChange={(e) => handleBusinessHoursChange(day, 'closeTime', e.target.value)}
                                                    className="px-3 py-2 bg-slate-50 border-transparent focus:border-blue-500/20 focus:bg-white rounded-xl text-xs font-bold transition-all outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="pt-6 flex justify-end">
                                <button
                                    onClick={handleSubmit}
                                    disabled={saving}
                                    className="flex items-center justify-center gap-3 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black  shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                                >
                                    {saving ? 'Updating...' : 'Save Business Hours'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {/* Social Media Profiles (Business Only) */}
            {(user?.role === 'vendor' || user?.vendor) && (
                <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden relative">
                    {/* PREMIUM GATE FOR SOCIAL LINKS */}
                    {(!user?.vendor?.subscriptions?.some((sub: any) => sub.status === 'active' && sub.plan?.name?.toLowerCase() !== 'free')) && (
                        <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-white/60 flex flex-col items-center justify-center p-6 text-center rounded-[20px] border border-orange-100/50">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
                                <Lock className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-lg font-black text-slate-900 mb-2">Premium Feature</h4>
                            <p className="text-sm font-bold text-slate-600 mb-4 max-w-sm">Upgrade your plan to add social media links to your listing.</p>
                            <a href="/subscription" className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-slate-900/20">
                                Upgrade Plan
                            </a>
                        </div>
                    )}

                    <div className="p-8 lg:p-12 border-b border-slate-50 bg-slate-50/30 flex items-start gap-4">
                        <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center shrink-0">
                            <Share2 className="w-6 h-6" />
                        </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 mb-2">Social Media Profiles</h3>
                                        <p className="text-sm text-slate-500 font-medium">Add links to your social media profiles to help customers find you.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addSocialLink}
                                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-slate-800 transition-all active:scale-95"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Social
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 lg:p-12 space-y-6">
                            {formData.socialLinks.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                                        <Globe className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h4 className="text-slate-900 font-black mb-1">No social profiles added</h4>
                                    <p className="text-slate-500 text-sm font-medium mb-6">Connect with your customers on other platforms.</p>
                                    <button
                                        type="button"
                                        onClick={addSocialLink}
                                        className="text-blue-600 font-black text-sm hover:underline"
                                    >
                                        Add your first social link
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {formData.socialLinks.map((link, index) => (
                                        <div key={index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="w-full sm:w-48">
                                                <div className="relative">
                                                    <select
                                                        value={link.platform}
                                                        onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                                                        className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold appearance-none outline-none focus:border-blue-500/20 transition-all"
                                                    >
                                                        <option value="facebook">Facebook</option>
                                                        <option value="instagram">Instagram</option>
                                                        <option value="linkedin">LinkedIn</option>
                                                        <option value="twitter">Twitter / X</option>
                                                        <option value="youtube">YouTube</option>
                                                        <option value="whatsapp">WhatsApp</option>
                                                        <option value="website">Website</option>
                                                    </select>
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                        {link.platform === 'facebook' && <Facebook className="w-4 h-4" />}
                                                        {link.platform === 'instagram' && <Instagram className="w-4 h-4" />}
                                                        {link.platform === 'linkedin' && <Linkedin className="w-4 h-4" />}
                                                        {link.platform === 'twitter' && <Twitter className="w-4 h-4" />}
                                                        {link.platform === 'youtube' && <Youtube className="w-4 h-4" />}
                                                        {link.platform === 'website' && <Globe className="w-4 h-4" />}
                                                        {link.platform === 'whatsapp' && <Phone className="w-4 h-4" />}
                                                    </div>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="flex-1 w-full relative">
                                                <input
                                                    type="url"
                                                    value={link.url}
                                                    onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                                                    placeholder={
                                                        link.platform === 'whatsapp'
                                                            ? "Enter Phone Number"
                                                            : link.platform === 'website'
                                                                ? "https://yourwebsite.com"
                                                                : `https://${link.platform}.com/yourprofile`
                                                    }
                                                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500/20 transition-all"
                                                />
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                                                    <ExternalLink className="w-4 h-4" />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeSocialLink(index)}
                                                className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {formData.socialLinks.length > 0 && (
                                <div className="pt-6 border-t border-slate-50 flex justify-end">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={saving}
                                        className="flex items-center justify-center gap-3 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black  shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                                    >
                                        {saving ? 'Updating...' : 'Save Social Links'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Security & Password */}
                <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 lg:p-12 border-b border-slate-50 bg-slate-50/30 flex items-start gap-4">
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
                            <KeyRound className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Security & Password</h3>
                            <p className="text-sm text-slate-500 font-medium">Keep your account secure. If you change your password, you might be securely logged out on other devices.</p>
                        </div>
                    </div>

                    <form onSubmit={handlePwdSubmit} className="p-8 lg:p-12 space-y-8">
                        {pwdSuccess && (
                            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-bold text-sm">Password updated successfully!</span>
                            </div>
                        )}
                        {pwdError && (
                            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5" />
                                <span className="font-bold text-sm">{pwdError}</span>
                            </div>
                        )}

                        <div className="space-y-6 max-w-xl">
                            <div className="space-y-3">
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Current Password</label>
                                <input
                                    type="password"
                                    name="oldPassword"
                                    required
                                    value={pwdData.oldPassword}
                                    onChange={handlePwdChange}
                                    placeholder="Enter current password"
                                    className="w-full px-6 py-4 bg-slate-50 border-transparent focus:border-orange-500/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        required
                                        minLength={8}
                                        value={pwdData.newPassword}
                                        onChange={handlePwdChange}
                                        placeholder="Min. 8 characters"
                                        className="w-full px-6 py-4 bg-slate-50 border-transparent focus:border-orange-500/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        required
                                        minLength={8}
                                        value={pwdData.confirmPassword}
                                        onChange={handlePwdChange}
                                        placeholder="Repeat new password"
                                        className="w-full px-6 py-4 bg-slate-50 border-transparent focus:border-orange-500/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50 flex justify-end">
                            <button
                                type="submit"
                                disabled={pwdSaving || !pwdData.oldPassword || !pwdData.newPassword || !pwdData.confirmPassword}
                                className="flex items-center justify-center gap-3 px-10 py-4 bg-[#FF7A30] text-white rounded-2xl font-black  shadow-orange-500/20 hover:bg-[#E86920] transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                            >
                                {pwdSaving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <KeyRound className="w-5 h-5" />
                                        Change Password
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>



                {/* Danger Zone: Account Deletion */}
                <div className="bg-white rounded-[20px] border border-rose-100 shadow-sm overflow-hidden">
                    <div className="p-8 lg:p-12 border-b border-rose-50 bg-rose-50/30 flex items-start gap-4">
                        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-rose-900 mb-2">Danger Zone</h3>
                            <p className="text-sm text-rose-600 font-medium">Irreversible actions. Be careful with these settings.</p>
                        </div>
                    </div>

                    <div className="p-8 lg:p-12 space-y-6">
                        {deletionStatus && (
                            <div className={`flex items-center gap-3 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 ${deletionStatus.type === 'success' ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-rose-50 border border-rose-100 text-rose-600'
                                }`}>
                                {deletionStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <span className="font-bold text-sm">{deletionStatus.message}</span>
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="space-y-1">
                                {user?.deletionScheduledAt ? (
                                    <>
                                        <h4 className="font-black text-rose-600 uppercase tracking-widest text-xs flex items-center gap-2">
                                            <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                                        </h4>
                                        <p className="text-slate-900 font-bold">Your account will be permanently deleted in {getDaysLeft(user.deletionScheduledAt)} days.</p>
                                        <p className="text-slate-500 text-sm font-medium">Scheduled for removal on: {getScheduledDeleteDate(user.deletionScheduledAt).toLocaleDateString()}</p>
                                    </>
                                ) : (
                                    <>
                                        <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Delete Account</h4>
                                        <p className="text-slate-500 text-sm font-medium">Permanently remove your account and all associated data.</p>
                                        <p className="text-slate-400 text-xs font-bold leading-relaxed">Account will be scheduled for deletion and cleared in 30 days.</p>
                                    </>
                                )}
                            </div>

                            {user?.deletionScheduledAt ? (
                                <button
                                    onClick={handleCancelDeletion}
                                    disabled={deletionLoading}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-black hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {deletionLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                    ) : (
                                        <RefreshCcw className="w-4 h-4" />
                                    )}
                                    Cancel Deletion
                                </button>
                            ) : (
                                <button
                                    onClick={handleRequestDeletion}
                                    disabled={deletionLoading}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-sm font-black hover:bg-rose-100 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {deletionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Delete Account
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

