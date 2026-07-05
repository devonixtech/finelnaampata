import React, { useState } from 'react';
import { StepProps, ListingFormData } from '../types';
import { ChevronDown, Phone, MapPin, Tag, Plus, Trash2, ImagePlus, Loader2, Lock } from 'lucide-react';
import { DEFAULT_DIAL_CODES } from '../../../../lib/phone-codes';
import { SOCIAL_PLATFORMS, AMENITIES } from '../../../../lib/constants/listing-options';
import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';
import { usePlanFeature } from '../../../../hooks/usePlanFeature';
import CategorySearchSelect from '../../../../components/CategorySearchSelect';

const inputClass = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all placeholder:text-slate-400";
const selectClass = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all appearance-none cursor-pointer pr-10";
const labelClass = "block text-xs font-black uppercase tracking-widest text-slate-400 mb-2";

const toggleArrayItem = (arr: string[], item: string) => {
    const safeArr = Array.isArray(arr) ? arr : [];
    return safeArr.includes(item) ? safeArr.filter(i => i !== item) : [...safeArr, item];
};

export const Step5Category = ({ formData, setFormData, categories = [], categoriesLoading }: StepProps) => {
    const { getFeatureValue } = usePlanFeature();
    const maxSubCategories = Number(getFeatureValue('maxSubCategories') || 0);
    const visibleSubCategorySlots = Math.max(3, maxSubCategories || 0);
    const selectedSubCategories = Array.isArray(formData.subCategoryIds) ? formData.subCategoryIds : [];
    
    // Determine available subcategories based on selected category
    const relatedSubcategories = formData.categoryId && formData.categoryId !== 'other' 
        ? categories.filter(c => c.parentId === formData.categoryId) 
        : [];

    return (
        <div className="space-y-6">
            <div>
                <label className={labelClass}>Main Category</label>
                <CategorySearchSelect
                    categories={categories.filter(c => !c.parentId)}
                    value={formData.categoryId}
                    onChange={catId => setFormData(p => ({ ...p, categoryId: catId, subCategoryIds: [] }))}
                    loading={categoriesLoading}
                />
            </div>

            {relatedSubcategories.length > 0 && (
                <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                    <h4 className="text-sm font-black text-slate-900 mb-3">
                        {maxSubCategories > 0 ? `Subcategories (Select up to ${maxSubCategories})` : 'Subcategories (Paid plans unlock up to 3)'}
                    </h4>
                    <div className="space-y-3">
                        {Array.from({ length: visibleSubCategorySlots }).map((_, i) => {
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
                                                value={selectedSubCategories[i] || ''}
                                                onChange={e => {
                                                    const newSubs = [...selectedSubCategories];
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
                                                        disabled={selectedSubCategories.includes(sub.id) && selectedSubCategories[i] !== sub.id}
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

            <div>
                <label className={labelClass}>Custom Category Tag (Optional)</label>
                <input
                    type="text"
                    value={formData.customCategoryTag}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customCategoryTag: e.target.value }))}
                    maxLength={80}
                    placeholder="Suggest a better-fit category if you do not see it"
                    className={inputClass}
                />
                <p className="text-xs text-slate-500 mt-2">This is saved for admin review and future category expansion.</p>
            </div>
        </div>
    );
};

export const Step9Contact = ({ formData, setFormData }: StepProps) => {
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const { getFeatureValue, hasFeature } = usePlanFeature();
    const maxNamedPhoneNumbers = Number(getFeatureValue('maxNamedPhoneNumbers') || 0);
    const canManageNamedPhones = maxNamedPhoneNumbers > 0;
    const hasWhatsappIntegration = hasFeature('showChat');
    const namedPhoneNumbers = Array.isArray(formData.namedPhoneNumbers) ? formData.namedPhoneNumbers : [];

    const handlePhoneChange = (val: string, type: 'phone' | 'whatsapp') => {
        // Strip non-digits except +
        const cleaned = val.replace(/[^\d+]/g, '');
        
        setFormData(prev => ({
            ...prev,
            [type === 'phone' ? 'phoneNumber' : 'whatsapp']: cleaned,
            ...(type === 'phone' && prev.whatsappSameAsPrimary ? { whatsapp: cleaned } : {}),
        }));

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

    const addNamedPhone = () => {
        if (namedPhoneNumbers.length >= 5) return;
        setFormData((prev) => ({
            ...prev,
            namedPhoneNumbers: [...(Array.isArray(prev.namedPhoneNumbers) ? prev.namedPhoneNumbers : []), { label: '', number: '' }],
        }));
    };

    const updateNamedPhone = (index: number, field: 'label' | 'number', value: string) => {
        setFormData((prev) => {
            const next = [...(Array.isArray(prev.namedPhoneNumbers) ? prev.namedPhoneNumbers : [])];
            next[index] = {
                ...(next[index] || { label: '', number: '' }),
                [field]: field === 'number' ? value.replace(/[^\d+]/g, '') : value,
            };
            return { ...prev, namedPhoneNumbers: next };
        });
    };

    const removeNamedPhone = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            namedPhoneNumbers: (Array.isArray(prev.namedPhoneNumbers) ? prev.namedPhoneNumbers : []).filter((_, i) => i !== index),
        }));
    };

    return (
        <div className="space-y-6 pb-4">
            <div>
                <label className={labelClass}>Contact Person Title (Optional)</label>
                <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Owner, Manager, Sales Lead"
                    value={formData.contactPersonTitle}
                    onChange={e => setFormData(p => ({ ...p, contactPersonTitle: e.target.value }))}
                />
            </div>
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
                <div className="flex items-center gap-2 min-w-0">
                    <select
                        value={formData.phoneCode}
                        onChange={e => {
                            setFormData(prev => ({ ...prev, phoneCode: e.target.value }));
                            handlePhoneChange(formData.phoneNumber, 'phone');
                        }}
                        className="shrink-0 w-[140px] px-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all appearance-none cursor-pointer"
                    >
                        {DEFAULT_DIAL_CODES.map((d: any) => (
                            <option key={`${d.code}-${d.dialCode}`} value={d.dialCode}>
                                {d.dialCode} {d.country}
                            </option>
                        ))}
                    </select>
                    <div className="flex-1 min-w-0 relative">
                        <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={e => handlePhoneChange(e.target.value, 'phone')}
                            placeholder="300 1234567"
                            className={`w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all placeholder:text-slate-400 ${phoneError ? 'border-red-400 focus:ring-red-400' : ''}`}
                        />
                        {phoneError && <p className="text-xs text-red-500 mt-1 font-bold">{phoneError}</p>}
                    </div>
                </div>
            </div>
            <div className="pt-2 pb-2">
                <label className={labelClass}>WhatsApp Number (Optional)</label>
                {!hasWhatsappIntegration && (
                    <div className="mb-3 rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-3 text-xs font-bold text-amber-700">
                        WhatsApp contact is available on paid business plans. You can still save it here now, and it will unlock publicly after upgrade.
                    </div>
                )}
                <label className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-500">
                    <input
                        type="checkbox"
                        checked={formData.whatsappSameAsPrimary}
                        onChange={(e) => setFormData((prev) => ({
                            ...prev,
                            whatsappSameAsPrimary: e.target.checked,
                            whatsapp: e.target.checked ? prev.phoneNumber : prev.whatsapp,
                        }))}
                        className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                    />
                    Same as primary phone
                </label>
                <div className="flex items-center gap-2 min-w-0">
                    <select className="shrink-0 w-[140px] px-3 py-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-semibold text-sm appearance-none cursor-pointer" disabled>
                        <option>{formData.phoneCode}</option>
                    </select>
                    <input
                        type="tel"
                        value={formData.whatsapp}
                        onChange={e => handlePhoneChange(e.target.value, 'whatsapp')}
                        placeholder="WhatsApp number"
                        disabled={formData.whatsappSameAsPrimary}
                        className="flex-1 min-w-0 w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>
            <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between gap-3">
                    <label className={labelClass + " mb-0"}>Additional Named Numbers</label>
                    {canManageNamedPhones ? (
                        <span className="text-[10px] font-black text-slate-500">
                            {namedPhoneNumbers.length}/{maxNamedPhoneNumbers}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600">
                            <Lock className="w-3 h-3" />
                            Paid only
                        </span>
                    )}
                </div>

                {!canManageNamedPhones && (
                    <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 px-4 py-3 text-xs font-bold text-amber-700">
                        Paid business plans can publish up to 5 named phone numbers. You can still save draft numbers here now.
                    </div>
                )}

                {namedPhoneNumbers.map((item, idx) => (
                    <div key={`${idx}-${item.label || 'phone'}`} className="grid grid-cols-12 gap-2">
                        <input
                            type="text"
                            value={item.label}
                            onChange={(e) => updateNamedPhone(idx, 'label', e.target.value)}
                            placeholder="Label"
                            className="col-span-12 md:col-span-3 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                        />
                        <input
                            type="text"
                            value={item.personName || ''}
                            onChange={(e) => setFormData((prev) => {
                                const next = [...(Array.isArray(prev.namedPhoneNumbers) ? prev.namedPhoneNumbers : [])];
                                next[idx] = { ...(next[idx] || { label: '', number: '' }), personName: e.target.value };
                                return { ...prev, namedPhoneNumbers: next };
                            })}
                            placeholder="Person name"
                            className="col-span-12 md:col-span-3 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                        />
                        <input
                            type="text"
                            value={item.title || ''}
                            onChange={(e) => setFormData((prev) => {
                                const next = [...(Array.isArray(prev.namedPhoneNumbers) ? prev.namedPhoneNumbers : [])];
                                next[idx] = { ...(next[idx] || { label: '', number: '' }), title: e.target.value };
                                return { ...prev, namedPhoneNumbers: next };
                            })}
                            placeholder="Title / role"
                            className="col-span-12 md:col-span-2 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                        />
                        <input
                            type="tel"
                            value={item.number}
                            onChange={(e) => updateNamedPhone(idx, 'number', e.target.value)}
                            placeholder="+923001234567"
                            className="col-span-11 md:col-span-3 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                        />
                        <button
                            type="button"
                            onClick={() => removeNamedPhone(idx)}
                            className="col-span-1 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addNamedPhone}
                    disabled={namedPhoneNumbers.length >= 5}
                    className="w-full py-3 border border-dashed border-slate-300 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                    + Add Named Number
                </button>
            </div>
        </div>
    );
};

export const Step13Online = ({ formData, setFormData }: StepProps) => {
    const { isFree } = usePlanFeature();
    const safeSocialLinks = Array.isArray(formData.socialLinks) ? formData.socialLinks : [];

    const handleSocialUpdate = (platform: string, url: string) => {
        const existing = safeSocialLinks.find(s => s.platform === platform);
        if (url.trim() === '') {
            setFormData(p => ({ ...p, socialLinks: (Array.isArray(p.socialLinks) ? p.socialLinks : []).filter(s => s.platform !== platform) }));
        } else if (existing) {
            setFormData(p => ({
                ...p, 
                socialLinks: (Array.isArray(p.socialLinks) ? p.socialLinks : []).map(s => s.platform === platform ? { ...s, url } : s)
            }));
        } else {
            setFormData(p => ({
                ...p,
                socialLinks: [...(Array.isArray(p.socialLinks) ? p.socialLinks : []), { platform, url }]
            }));
        }
    };

    const customLinks = safeSocialLinks.filter(s => !SOCIAL_PLATFORMS.find((p: any) => p.key === s.platform));

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
                {isFree && (
                    <div className="mb-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-3 text-xs font-bold text-amber-700">
                        Social media links are visible here for setup and will be saved now. They stay locked on the free plan until you upgrade.
                    </div>
                )}
                <div className="space-y-3">
                    {SOCIAL_PLATFORMS.map((platform: any) => {
                        const link = safeSocialLinks.find(s => s.platform === platform.key)?.url || '';
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

            <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                    <label className={labelClass}>Additional Links</label>
                    <button
                        type="button"
                        onClick={() => setFormData(p => ({
                            ...p,
                            socialLinks: [...(Array.isArray(p.socialLinks) ? p.socialLinks : []), { platform: 'custom', url: '', label: '' }]
                        }))}
                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        + Add More Link
                    </button>
                </div>
                <div className="space-y-3">
                    {customLinks.map((link: any, i: number) => (
                        <div key={`custom-${i}`} className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Label"
                                value={link.label || ''}
                                onChange={e => {
                                    const updated = safeSocialLinks.map(s => s === link ? { ...s, label: e.target.value } : s);
                                    setFormData(p => ({ ...p, socialLinks: updated }));
                                }}
                                className={`${inputClass} w-1/3`}
                            />
                            <input
                                type="url"
                                placeholder="https://..."
                                value={link.url}
                                onChange={e => {
                                    const updated = safeSocialLinks.map(s => s === link ? { ...s, url: e.target.value } : s);
                                    setFormData(p => ({ ...p, socialLinks: updated }));
                                }}
                                className={inputClass}
                            />
                            <button
                                type="button"
                                onClick={() => setFormData(p => ({
                                    ...p,
                                    socialLinks: (Array.isArray(p.socialLinks) ? p.socialLinks : []).filter(s => s !== link)
                                }))}
                                className="p-3 text-red-400 hover:text-red-600 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
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
                        const selectedValues = Array.isArray(formData[formKey]) ? formData[formKey] : [];
                        const isChecked = selectedValues.includes(opt);
                        
                        return (
                            <label key={opt} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${isChecked ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-200'}`}>
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
                                    checked={isChecked}
                                    onChange={() => setFormData(p => ({
                                        ...p,
                                        [formKey]: toggleArrayItem(Array.isArray(p[formKey]) ? p[formKey] : [], opt)
                                    }))}
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

