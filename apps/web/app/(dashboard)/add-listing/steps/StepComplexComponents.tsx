import React, { useState } from 'react';
import { StepProps, ListingFormData } from '../types';
import { Layers, ChevronDown, Phone, MapPin, Tag, Plus, Trash2, ImagePlus, Loader2, Lock } from 'lucide-react';
import { DEFAULT_DIAL_CODES } from '../../../../lib/phone-codes';
import { SOCIAL_PLATFORMS, AMENITIES } from '../../../../lib/constants/listing-options';
import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';
import { usePlanFeature } from '../../../../hooks/usePlanFeature';

const inputClass = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all placeholder:text-slate-400";
const selectClass = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all appearance-none cursor-pointer pr-10";
const labelClass = "block text-xs font-black uppercase tracking-widest text-slate-400 mb-2";

const toggleArrayItem = (arr: string[], item: string) => 
    arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

export const Step5Category = ({ formData, setFormData, categories = [] }: StepProps) => {
    const { getFeatureValue } = usePlanFeature();
    const maxSubCategories = getFeatureValue('maxSubCategories') || 0;
    
    // Determine available subcategories based on selected category
    const relatedSubcategories = formData.categoryId && formData.categoryId !== 'other' 
        ? categories.filter(c => c.parentId === formData.categoryId) 
        : [];

    return (
        <div className="space-y-6">
            <div>
                <label className={labelClass}>Main Category</label>
                <div className="relative">
                    <select
                        required
                        value={formData.categoryId}
                        onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value, subCategoryIds: [] }))}
                        className={selectClass}
                    >
                        <option value="" disabled>-- Select Category --</option>
                        {categories.filter(c => !c.parentId).map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <Layers className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {relatedSubcategories.length > 0 && (
                <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                    <h4 className="text-sm font-black text-slate-900 mb-3">Subcategories (Select up to {Math.max(3, maxSubCategories)})</h4>
                    <div className="space-y-3">
                        {Array.from({ length: Math.max(3, maxSubCategories) }).map((_, i) => {
                            const isLocked = i >= maxSubCategories;
                            return (
                                <div key={`sub-${i}`}>
                                    {isLocked ? (
                                        <div className="relative p-3.5 border border-dashed border-purple-200 rounded-xl bg-white/50 flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-400 pl-1 flex items-center gap-2">
                                                <Lock className="w-4 h-4 text-orange-400" />
                                                Premium Subcategory Slot
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-orange-500 bg-orange-50 px-2 py-1 rounded-md">Upgrade to Unlock</span>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <select
                                                value={formData.subCategoryIds[i] || ''}
                                                onChange={e => {
                                                    const newSubs = [...formData.subCategoryIds];
                                                    if (e.target.value) {
                                                        newSubs[i] = e.target.value;
                                                    } else {
                                                        newSubs.splice(i, 1);
                                                    }
                                                    setFormData(prev => ({ ...prev, subCategoryIds: newSubs.filter(Boolean) }));
                                                }}
                                                className={selectClass + " bg-white"}
                                            >
                                                <option value="">-- Optional --</option>
                                                {relatedSubcategories.map(sub => (
                                                    <option 
                                                        key={sub.id} 
                                                        value={sub.id}
                                                        disabled={formData.subCategoryIds.includes(sub.id) && formData.subCategoryIds[i] !== sub.id}
                                                    >
                                                        {sub.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export const Step9Contact = ({ formData, setFormData }: StepProps) => {
    const [phoneError, setPhoneError] = useState<string | null>(null);

    const handlePhoneChange = (val: string, type: 'phone' | 'whatsapp') => {
        // Strip non-digits except +
        const cleaned = val.replace(/[^\d+]/g, '');
        
        setFormData(prev => ({ ...prev, [type === 'phone' ? 'phoneNumber' : 'whatsapp']: cleaned }));

        if (cleaned.length > 5) {
            const fullNumber = cleaned.startsWith('+') ? cleaned : `${formData.phoneCode}${cleaned}`;
            const parsed = parsePhoneNumberFromString(fullNumber);
            if (type === 'phone') {
                if (!parsed || !parsed.isValid()) {
                    setPhoneError('Invalid phone number format');
                } else {
                    setPhoneError(null);
                }
            }
        } else if (type === 'phone') {
            setPhoneError(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <label className={labelClass}>Contact Person Name</label>
                <input 
                    type="text" 
                    className={inputClass} 
                    placeholder="Who should customers talk to?"
                    value={formData.contactPersonName}
                    onChange={e => setFormData(p => ({ ...p, contactPersonName: e.target.value }))}
                />
            </div>
            <div>
                <label className={labelClass}>Contact Number</label>
                <div className="flex gap-2 relative">
                    <select
                        value={formData.phoneCode}
                        onChange={e => {
                            setFormData(prev => ({ ...prev, phoneCode: e.target.value }));
                            handlePhoneChange(formData.phoneNumber, 'phone');
                        }}
                        className={`${selectClass} w-36 flex-shrink-0`}
                    >
                        {DEFAULT_DIAL_CODES.map((d: any) => (
                            <option key={`${d.code}-${d.dialCode}`} value={d.dialCode}>
                                {d.dialCode} {d.country}
                            </option>
                        ))}
                    </select>
                    <div className="flex-1">
                        <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={e => handlePhoneChange(e.target.value, 'phone')}
                            placeholder="300 1234567"
                            className={`${inputClass} ${phoneError ? 'border-red-400 focus:ring-red-400' : ''}`}
                        />
                        {phoneError && <p className="text-xs text-red-500 mt-1 font-bold absolute -bottom-5 left-36">{phoneError}</p>}
                    </div>
                </div>
            </div>
            <div className="pt-2">
                <label className={labelClass}>WhatsApp Number (Optional)</label>
                <div className="flex gap-2">
                    <select className={`${selectClass} w-36 flex-shrink-0 bg-slate-100 text-slate-500`} disabled>
                        <option>{formData.phoneCode}</option>
                    </select>
                    <input
                        type="tel"
                        value={formData.whatsapp}
                        onChange={e => handlePhoneChange(e.target.value, 'whatsapp')}
                        placeholder="Same as above if empty"
                        className={inputClass}
                    />
                </div>
            </div>
        </div>
    );
};

export const Step13Online = ({ formData, setFormData }: StepProps) => {
    const handleSocialUpdate = (platform: string, url: string) => {
        const existing = formData.socialLinks.find(s => s.platform === platform);
        if (url.trim() === '') {
            setFormData(p => ({ ...p, socialLinks: p.socialLinks.filter(s => s.platform !== platform) }));
        } else if (existing) {
            setFormData(p => ({
                ...p, 
                socialLinks: p.socialLinks.map(s => s.platform === platform ? { ...s, url } : s)
            }));
        } else {
            setFormData(p => ({
                ...p,
                socialLinks: [...p.socialLinks, { platform, url }]
            }));
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <label className={labelClass}>Website (Optional)</label>
                <input 
                    type="url" 
                    className={inputClass} 
                    placeholder="https://yourwebsite.com"
                    value={formData.website}
                    onChange={e => setFormData(p => ({ ...p, website: e.target.value }))}
                />
            </div>
            
            <div className="pt-4 border-t border-slate-100">
                <label className={labelClass}>Social Media Links</label>
                <div className="space-y-3">
                    {SOCIAL_PLATFORMS.map((platform: any) => {
                        const link = formData.socialLinks.find(s => s.platform === platform.key)?.url || '';
                        return (
                            <div key={platform.key} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0" title={platform.label}>
                                    {platform.emoji}
                                </div>
                                <input
                                    type="url"
                                    placeholder={platform.placeholder}
                                    value={link}
                                    onChange={e => handleSocialUpdate(platform.key, e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const Step14Amenities = ({ formData, setFormData }: StepProps) => (
    <div className="space-y-8">
        {Object.entries(AMENITIES).map(([group, options]) => (
            <div key={group}>
                <label className={labelClass}>{group.replace(/([A-Z])/g, ' $1').trim()}</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {(options as string[]).map((opt: string) => {
                        // Dynamically resolve which array in formData to update based on the group key
                        const formKey = group as keyof Pick<ListingFormData, 'locationAccess' | 'facilities' | 'staffFeatures' | 'paymentMethods'>;
                        const isChecked = formData[formKey].includes(opt);
                        
                        return (
                            <label key={opt} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${isChecked ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-200'}`}>
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
                                    checked={isChecked}
                                    onChange={() => setFormData(p => ({ ...p, [formKey]: toggleArrayItem(p[formKey], opt) }))}
                                />
                                <span className="ml-3 text-sm font-semibold text-slate-800">{opt}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        ))}
    </div>
);
