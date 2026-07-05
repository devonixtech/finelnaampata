'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Category, City } from '../../types/api';
import CategorySearchSelect from '../CategorySearchSelect';
import CitySearchSelect from '../CitySearchSelect';
import { MapPin, Megaphone, Loader2, Navigation, ChevronRight, ChevronLeft, CheckCircle2, Sparkles, Target, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { detectLocationForUi, sortAndDedupeCities, findNearestCity } from '../../lib/location-detect';
import { useAuth } from '../../context/AuthContext';

interface BroadcastRequestFormProps {
    onSuccess?: () => void;
}

const STEPS = [
    { id: 'category', title: 'Category', icon: Sparkles },
    { id: 'title', title: 'Service', icon: Target },
    { id: 'details', title: 'Details', icon: Megaphone },
    { id: 'location', title: 'Location', icon: MapPin },
    { id: 'review', title: 'Review', icon: CheckCircle2 },
];

export default function BroadcastRequestForm({ onSuccess }: BroadcastRequestFormProps) {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);

    const [categories, setCategories] = useState<Category[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        categoryId: '',
        city: '',
        budget: '',
        latitude: null as number | null,
        longitude: null as number | null,
    });
    const { user } = useAuth();

    useEffect(() => {
        const loadSearchData = async () => {
            try {
                const [catsData, citiesData] = await Promise.all([
                    api.categories.getAll(),
                    api.cities.getAll()
                ]);
                setCategories(catsData || []);
                setCities(sortAndDedupeCities(citiesData || []));
            } catch (err) {
                console.error('Failed to load form data', err);
            }
        };
        loadSearchData();
    }, [user]);

    const detectLocation = async () => {
        setGettingLocation(true);
        setError(null);
        try {
            const coords = await detectLocationForUi();
            if (!coords) return;
            const nearest = findNearestCity(cities, coords.latitude, coords.longitude);
            setFormData(prev => ({
                ...prev,
                latitude: coords.latitude,
                longitude: coords.longitude,
                city: nearest?.name || prev.city,
            }));
        } catch (err) {
            console.error('Geolocation error:', err);
            setError('Could not detect location. Please select your city manually.');
        } finally {
            setGettingLocation(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            await api.broadcasts.create({
                ...formData,
                budget: formData.budget ? parseFloat(formData.budget) : undefined,
                latitude: formData.latitude ?? undefined,
                longitude: formData.longitude ?? undefined,
            });
            setSuccess(true);
            setFormData({
                title: '',
                description: '',
                categoryId: '',
                city: '',
                budget: '',
                latitude: null,
                longitude: null,
            });
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to broadcast request');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 0 && !formData.categoryId) {
            setError('Please select a category');
            return;
        }
        if (step === 1 && !formData.title) {
            setError('Please enter a service title');
            return;
        }
        if (step === 2 && !formData.description) {
            setError('Please provide some details');
            return;
        }
        if (step === 3 && !formData.city && !formData.latitude) {
            setError('Please select your city or use GPS');
            return;
        }
        setError(null);
        setStep(prev => Math.min(prev + 1, STEPS.length - 1));
    };

    const prevStep = () => {
        setError(null);
        setStep(prev => Math.max(prev - 1, 0));
    };

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 p-12 rounded-[24px] border-2 border-emerald-100 text-center shadow-2xl shadow-emerald-200/50"
            >
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[20px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Signal Sent!</h3>
                <p className="text-lg text-slate-500 font-medium mb-10 max-w-sm mx-auto leading-relaxed">
                    Your broadcast is now live. We've notified qualified experts within your vicinity.
                </p>
                <button
                    onClick={() => {
                        setSuccess(false);
                        setStep(0);
                    }}
                    className="px-12 py-5 bg-slate-900 text-white rounded-[24px] font-black hover:bg-emerald-600 transition-all active:scale-95 shadow-xl shadow-slate-200 flex items-center gap-3 mx-auto"
                >
                    Create New Broadcast <Sparkles className="w-5 h-5" />
                </button>
            </motion.div>
        );
    }

    const currentStep = STEPS[step];

    return (
        <div className="space-y-10">
            {/* Step Indicator */}
            <div className="flex items-center justify-between px-2">
                {STEPS.map((s, idx) => (
                    <div key={s.id} className="flex flex-col items-center gap-2 flex-1">
                        <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${idx <= step ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400'
                            }`}>
                            <s.icon className="w-5 h-5" />
                            {idx < STEPS.length - 1 && (
                                <div className={`absolute left-full w-full h-[2px] -translate-y-1/2 top-1/2 ml-2 mr-2 transition-colors duration-500 ${idx < step ? 'bg-blue-600' : 'bg-slate-100'
                                    }`} style={{ width: 'calc(100% - 16px)' }} />
                            )}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${idx <= step ? 'text-blue-600' : 'text-slate-400'}`}>
                            {s.title}
                        </span>
                    </div>
                ))}
            </div>

            {/* Form Content */}
            <div className="min-h-[300px] relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="space-y-8"
                    >
                        {step === 0 && (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Select Category</h2>
                                    <p className="text-slate-400 font-bold">What type of help are you looking for?</p>
                                </div>
                                <CategorySearchSelect
                                    categories={categories}
                                    value={formData.categoryId}
                                    onChange={(id) => {
                                        setFormData({ ...formData, categoryId: id });
                                        setError(null);
                                    }}
                                />
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Requirement Title</h2>
                                    <p className="text-slate-400 font-bold">Summarize your need in a few words</p>
                                </div>
                                <div className="relative group">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="e.g. Urgent Leak Repair, Modern Logo Design"
                                        className="w-full px-8 py-6 rounded-[20px] bg-slate-50 border-4 border-transparent focus:border-blue-400 focus:bg-white outline-none transition-all font-black text-2xl text-slate-900 shadow-inner placeholder:text-slate-200"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                                    />
                                    {/* <Megaphone className="absolute right-8 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-100 group-focus-within:text-blue-600/20 transition-colors" /> */}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">More Details</h2>
                                    <p className="text-slate-400 font-bold">Help experts understand your needs better</p>
                                </div>
                                <textarea
                                    autoFocus
                                    required
                                    rows={5}
                                    placeholder="Describe your issue, timeline, and any specific requirements..."
                                    className="w-full px-8 py-6 rounded-[20px] bg-slate-50 border-4 border-transparent focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-lg text-slate-900 placeholder:text-slate-300 resize-none shadow-inner"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                                <div className="relative group max-w-xs mx-auto">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        <Wallet className="w-5 h-5 text-slate-400" />
                                        <span className="text-slate-300 font-black text-sm">PKR</span>
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="Budget (Optional)"
                                        className="w-full pl-24 pr-8 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all font-black text-slate-900 shadow-sm"
                                        value={formData.budget}
                                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Your Location</h2>
                                    <p className="text-slate-400 font-bold">We match you with experts nearby</p>
                                </div>
                                <div className="bg-slate-50 p-8 rounded-[20px] border-2 border-slate-100/50 shadow-inner">
                                    <CitySearchSelect
                                        cities={cities}
                                        value={formData.city}
                                        onChange={(cityName) => {
                                            setFormData({ ...formData, city: cityName });
                                            setError(null);
                                        }}
                                    />
                                    <div className="my-6 flex items-center gap-4">
                                        <div className="h-[1px] bg-slate-200 flex-1" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">or use GPS for precision</span>
                                        <div className="h-[1px] bg-slate-200 flex-1" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={detectLocation}
                                        disabled={gettingLocation}
                                        className={`w-full py-5 rounded-2xl border-4 border-dashed transition-all flex items-center justify-center gap-3 font-black text-sm ${formData.latitude
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                            : 'bg-white border-slate-100 text-blue-600 hover:border-blue-200 hover:bg-blue-50/30'
                                            }`}
                                    >
                                        {gettingLocation ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                                        {formData.latitude ? 'GPS Coordinates Locked' : 'Detect My Location'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Review Signal</h2>
                                    <p className="text-slate-400 font-bold">Confirm your details before broadcasting</p>
                                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mt-4 text-left max-w-md mx-auto">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Broadcast Guidelines</h4>
                                        <ul className="text-xs text-slate-600 font-medium space-y-1 list-disc list-inside">
                                            <li>Your request will be sent to matching businesses in your area.</li>
                                            <li>You will receive proposals directly in your inbox.</li>
                                            <li>Please ensure your budget and requirements are clear.</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="bg-slate-900 rounded-[20px] p-10 text-white shadow-2xl relative overflow-hidden group">
                                    <Megaphone className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-700" />

                                    <div className="relative space-y-6">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Service Category</span>
                                            <p className="text-xl font-black text-blue-400 italic">
                                                {categories.find(c => c.id === formData.categoryId)?.name || 'Not selected'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Requirement</span>
                                            <p className="text-2xl font-black leading-tight">{formData.title}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Location</span>
                                                <p className="font-bold flex items-center gap-2 mt-1">
                                                    <MapPin className="w-4 h-4 text-blue-400" /> {formData.city || 'GPS Location'}
                                                    {formData.latitude && <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">GPS</span>}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Budget Estimate</span>
                                                <p className="font-black text-emerald-400 mt-1">
                                                    {formData.budget ? `PKR ${formData.budget}` : 'Flexible'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-5 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black border-2 border-red-100 flex items-center gap-3"
                    >
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-6">
                {step > 0 && (
                    <button
                        type="button"
                        onClick={prevStep}
                        className="flex-1 py-5 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-sm hover:bg-slate-50 hover:text-slate-600 transition-all flex items-center justify-center gap-2"
                    >
                        <ChevronLeft className="w-5 h-5" /> Back
                    </button>
                )}

                {step < STEPS.length - 1 ? (
                    <button
                        type="button"
                        onClick={nextStep}
                        className="flex-[2] bg-blue-600 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-95"
                    >
                        Continue <ChevronRight className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-[2] bg-slate-900 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 hover:bg-emerald-600 disabled:opacity-50 active:scale-95 group"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <span className="uppercase tracking-widest text-sm">Initiate Broadcast</span>
                                <Megaphone className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
