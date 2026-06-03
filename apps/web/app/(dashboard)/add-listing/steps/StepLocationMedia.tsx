import React, { useState } from 'react';
import { StepProps } from '../types';
import { Loader2, MapPin, ImagePlus, Plus, Trash2, HelpCircle, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import AddressPlacesAutocomplete from '../../../../components/AddressPlacesAutocomplete';
import { FeatureGate } from '../../../../components/business/FeatureGate';
import { useAddressConfig } from '../../../../hooks/useAddressConfig';
import { tryDetectDeviceLocation } from '../../../../lib/location-detect';

const inputClass = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all placeholder:text-slate-400";
const labelClass = "block text-xs font-black uppercase tracking-widest text-slate-400 mb-2";

const DraggablePinMap = dynamic(() => import('../../../../components/DraggablePinMap'), { ssr: false });

export const Step7Address = ({ formData, setFormData }: StepProps) => {
    const { config: addressConfig } = useAddressConfig(formData.country || null);
    const handlePlaceSelected = (place: any) => {
        setFormData(prev => ({
            ...prev,
            address: place.streetAddress || place.formattedAddress || prev.address,
            city: place.city || prev.city,
            state: place.state || prev.state,
            country: place.country || prev.country,
            pincode: place.postalCode || prev.pincode,
            latitude: place.latitude || prev.latitude,
            longitude: place.longitude || prev.longitude
        }));
    };

    const stateLabel = addressConfig?.administrativeArea?.label || 'State / Province';
    const stateRequired = addressConfig?.administrativeArea?.required || false;
    const postalLabel = addressConfig?.postalCode?.label || 'Postal Code';
    const postalRequired = addressConfig?.postalCode?.required || false;

    return (
        <div className="space-y-6">
            <div>
                <label className={labelClass}>Search Address *</label>
                <AddressPlacesAutocomplete
                    value={formData.address}
                    onChange={(val: string) => setFormData(p => ({ ...p, address: val }))}
                    onPlaceSelected={handlePlaceSelected}
                    placeholder="Start typing your address..."
                    className={inputClass}
                    required
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>City *</label>
                    <input 
                        type="text" 
                        value={formData.city} 
                        onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                        className={inputClass}
                        required
                    />
                </div>
                <div>
                    <label className={labelClass}>{stateLabel}{stateRequired ? ' *' : ''}</label>
                    <input 
                        type="text" 
                        value={formData.state} 
                        onChange={e => setFormData(p => ({ ...p, state: e.target.value }))}
                        className={inputClass}
                        required={stateRequired}
                    />
                </div>
            </div>
            <div>
                <label className={labelClass}>{postalLabel}{postalRequired ? ' *' : ''}</label>
                <input 
                    type="text" 
                    value={formData.pincode} 
                    onChange={e => setFormData(p => ({ ...p, pincode: e.target.value }))}
                    className={inputClass}
                    required={postalRequired}
                    placeholder={postalRequired ? '' : '(Optional)'}
                />
            </div>
        </div>
    );
};

export const Step8Map = ({ formData, setFormData }: StepProps) => {
    const [geoDetecting, setGeoDetecting] = useState(false);
    const [geoError, setGeoError] = useState('');

    const detectMyLocation = async () => {
        setGeoDetecting(true);
        setGeoError('');
        try {
            const result = await tryDetectDeviceLocation();
            if (!result.ok) {
                setGeoError(result.message);
                return;
            }

            setFormData((prev) => ({
                ...prev,
                latitude: result.coords.latitude,
                longitude: result.coords.longitude,
            }));
        } finally {
            setGeoDetecting(false);
        }
    };

    return (
        <div className="space-y-4">
            <label className={labelClass}>Pinpoint Your Location</label>
            <p className="text-xs text-slate-500 mb-2">Drag the pin to your exact storefront or office entrance. This helps customers find you easily.</p>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={detectMyLocation}
                    disabled={geoDetecting}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                    {geoDetecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    Use My GPS Location
                </button>
                <span className="text-[11px] text-slate-500 font-medium">We will ask for browser permission and set the pin automatically.</span>
            </div>
            {geoError && <p className="text-xs font-bold text-amber-600">{geoError}</p>}
            <div className="h-96 w-full rounded-2xl overflow-hidden border border-slate-200">
                <DraggablePinMap
                    latitude={formData.latitude || 30.3753}
                    longitude={formData.longitude || 69.3451}
                    onChange={(lat: number, lng: number) => setFormData(p => ({ ...p, latitude: lat, longitude: lng }))}
                />
            </div>
        </div>
    );
};

export const Step16Keywords = ({ formData, setFormData }: StepProps) => {
    const [input, setInput] = useState('');
    const safeKeywords = Array.isArray(formData.searchKeywords) ? formData.searchKeywords : [];

    const addKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tag = input.trim().toLowerCase().replace(/[,]+$/, '');
            if (tag && !safeKeywords.includes(tag) && safeKeywords.length < 20) {
                setFormData(p => ({
                    ...p, 
                    searchKeywords: [...safeKeywords, tag],
                    metaKeywords: [...safeKeywords, tag].join(', ')
                }));
            }
            setInput('');
        }
    };

    const removeKeyword = (kw: string) => {
        setFormData(p => {
            const updated = p.searchKeywords.filter(k => k !== kw);
            return { ...p, searchKeywords: updated, metaKeywords: updated.join(', ') };
        });
    };

    return (
        <FeatureGate feature="maxKeywords" isPage={false} title="SEO Keywords Locked" description="Add targeted search keywords to help customers find your business easily. Upgrade to a professional plan to unlock SEO tools.">
            <div className="space-y-4">
            <label className={labelClass}>Search Keywords</label>
            <p className="text-xs text-slate-500 mb-2">Press enter or comma to add a keyword. Maximum 20 allowed.</p>
            <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={addKeyword}
                placeholder="e.g. coffee shop, organic, 24/7..."
                className={inputClass}
            />
            <div className="flex flex-wrap gap-2 mt-4">
                {safeKeywords.map(kw => (
                    <span key={kw} className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-xs font-bold border border-orange-100 flex items-center gap-2">
                        {kw}
                        <button type="button" onClick={() => removeKeyword(kw)} className="text-orange-400 hover:text-orange-600">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
            </div>
        </div>
        </FeatureGate>
    );
};

export const Step17FAQs = ({ formData, setFormData }: StepProps) => {
    const [q, setQ] = useState('');
    const [a, setA] = useState('');
    const safeFaqs = Array.isArray(formData.faqs) ? formData.faqs : [];

    const addFaq = () => {
        if (q.trim() && a.trim()) {
            setFormData(p => ({ ...p, faqs: [...(Array.isArray(p.faqs) ? p.faqs : []), { question: q, answer: a }] }));
            setQ('');
            setA('');
        }
    };

    return (
        <FeatureGate feature="maxFaqs" isPage={false} title="Customer FAQs Locked" description="Anticipate customer questions and provide instant answers on your profile. Upgrade to a professional plan to add FAQs.">
            <div className="space-y-6">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <label className={labelClass}>Add a New FAQ</label>
                <input 
                    type="text" 
                    placeholder="Question (e.g. Do you offer delivery?)" 
                    value={q} 
                    onChange={e => setQ(e.target.value)} 
                    className={inputClass} 
                />
                <textarea 
                    placeholder="Answer" 
                    value={a} 
                    onChange={e => setA(e.target.value)} 
                    className={inputClass} 
                />
                <button type="button" onClick={addFaq} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add FAQ
                </button>
            </div>

            <div className="space-y-3">
                {safeFaqs.map((faq, idx) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-xl relative group pr-12">
                        <h4 className="font-bold text-sm text-slate-900">{faq.question}</h4>
                        <p className="text-sm text-slate-600 mt-1">{faq.answer}</p>
                        <button 
                            type="button" 
                            onClick={() => setFormData(p => ({ ...p, faqs: p.faqs.filter((_, i) => i !== idx) }))}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
        </FeatureGate>
    );
};

