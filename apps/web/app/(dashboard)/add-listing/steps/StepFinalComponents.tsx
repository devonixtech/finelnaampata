import React, { useState } from 'react';
import { StepProps } from '../types';
import { ImagePlus, Clock, RotateCcw } from 'lucide-react';
import { api } from '../../../../lib/api';

const inputClass = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all placeholder:text-slate-400";
const labelClass = "block text-xs font-black uppercase tracking-widest text-slate-400 mb-2";

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

type DayHours = { isOpen: boolean; openTime: string; closeTime: string };
type HoursMap = Record<string, DayHours>;

const DEFAULT_HOURS: HoursMap = {
    monday:    { isOpen: true,  openTime: '09:00', closeTime: '17:00' },
    tuesday:   { isOpen: true,  openTime: '09:00', closeTime: '17:00' },
    wednesday: { isOpen: true,  openTime: '09:00', closeTime: '17:00' },
    thursday:  { isOpen: true,  openTime: '09:00', closeTime: '17:00' },
    friday:    { isOpen: true,  openTime: '09:00', closeTime: '17:00' },
    saturday:  { isOpen: true,  openTime: '09:00', closeTime: '17:00' },
    sunday:    { isOpen: false, openTime: '09:00', closeTime: '17:00' },
};

function hoursArrayToMap(arr: any[]): HoursMap {
    if (!arr || arr.length === 0) return { ...DEFAULT_HOURS };
    if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'object' && arr[0].day) {
        const map: HoursMap = { ...DEFAULT_HOURS };
        for (const item of arr) {
            if (item.day) {
                map[item.day.toLowerCase()] = {
                    isOpen: item.isOpen ?? item.isOpen ?? true,
                    openTime: item.openTime || item.open || '09:00',
                    closeTime: item.closeTime || item.close || '17:00',
                };
            }
        }
        return map;
    }
    return { ...DEFAULT_HOURS };
}

function hoursMapToArray(map: HoursMap): any[] {
    return Object.entries(map).map(([day, record]) => ({
        day: day.charAt(0).toUpperCase() + day.slice(1),
        isOpen: record.isOpen,
        openTime: record.openTime,
        closeTime: record.closeTime,
    }));
}

const toggleArrayItem = (arr: string[], item: string) => {
    const safeArr = Array.isArray(arr) ? arr : [];
    return safeArr.includes(item) ? safeArr.filter(i => i !== item) : [...safeArr, item];
};

export const Step10Hours = ({ formData, setFormData }: StepProps) => {
    const [open247, setOpen247] = useState(false);
    const [hoursMap, setHoursMap] = useState<HoursMap>(() => {
        if (Array.isArray(formData.businessHours) && formData.businessHours.length > 0) {
            return hoursArrayToMap(formData.businessHours);
        }
        return { ...DEFAULT_HOURS };
    });

    const updateHours = (map: HoursMap) => {
        setHoursMap(map);
        setFormData(prev => ({ ...prev, businessHours: hoursMapToArray(map) }));
    };

    const handleOpen247 = (checked: boolean) => {
        setOpen247(checked);
        if (checked) {
            const allOpen: HoursMap = {};
            for (const d of DAYS) {
                allOpen[d] = { isOpen: true, openTime: '00:00', closeTime: '23:59' };
            }
            updateHours(allOpen);
        } else {
            updateHours({ ...DEFAULT_HOURS });
        }
    };

    const toggleDay = (day: string) => {
        const updated = { ...hoursMap };
        const current = updated[day] || { isOpen: false, openTime: '09:00', closeTime: '17:00' };
        updated[day] = { ...current, isOpen: !current.isOpen };
        updateHours(updated);
    };

    const setTime = (day: string, field: 'openTime' | 'closeTime', value: string) => {
        const updated = { ...hoursMap };
        const current = updated[day] || { isOpen: true, openTime: '09:00', closeTime: '17:00' };
        updated[day] = { ...current, [field]: value };
        updateHours(updated);
    };

    const applyToAll = (day: string) => {
        const source = hoursMap[day];
        if (!source) return;
        const updated: HoursMap = {};
        for (const d of DAYS) {
            updated[d] = { ...source };
        }
        updateHours(updated);
    };

    return (
        <div className="space-y-6">
            <div>
                <label className={labelClass}>Business Hours</label>
                <p className="text-xs text-slate-500 mb-4 ml-1">Set your operating hours for each day of the week</p>
            </div>

            {/* Open 24/7 toggle */}
            <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                    type="checkbox"
                    checked={open247}
                    onChange={e => handleOpen247(e.target.checked)}
                    className="h-4 w-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500"
                />
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-black text-slate-700">Open 24 hours a day, 7 days a week</span>
                </div>
            </label>

            {/* Day-by-day hours */}
            {!open247 && (
                <div className="space-y-2">
                    {DAYS.map(d => {
                        const record = hoursMap[d] || { isOpen: false, openTime: '09:00', closeTime: '17:00' };
                        return (
                            <div key={d} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${record.isOpen ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50/50'}`}>
                                <div className="flex items-center gap-3 w-1/3 min-w-0">
                                    <input
                                        type="checkbox"
                                        checked={record.isOpen}
                                        onChange={() => toggleDay(d)}
                                        className="h-4 w-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500 flex-shrink-0"
                                    />
                                    <span className={`text-sm font-black capitalize ${record.isOpen ? 'text-slate-700' : 'text-slate-400'}`}>{d}</span>
                                </div>
                                
                                {record.isOpen ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="time"
                                            value={record.openTime}
                                            onChange={e => setTime(d, 'openTime', e.target.value)}
                                            className="px-2 py-1.5 border border-slate-200 rounded-lg bg-white font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        />
                                        <span className="text-xs text-slate-400 font-bold">to</span>
                                        <input
                                            type="time"
                                            value={record.closeTime}
                                            onChange={e => setTime(d, 'closeTime', e.target.value)}
                                            className="px-2 py-1.5 border border-slate-200 rounded-lg bg-white font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => applyToAll(d)}
                                            className="p-1.5 text-slate-400 hover:text-orange-500 transition-colors"
                                            title="Apply to all days"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Closed</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const INDUSTRY_SUB_TYPES = [
    'Halal Certified', 'Organic', 'Vegan', 'Eco-Friendly', 'ISO Certified', 'Handmade / Artisan'
];

export const Step15Industry = ({ formData, setFormData }: StepProps) => {
    const safeIndustrySubType = Array.isArray(formData.industrySubType) ? formData.industrySubType : [];

    return (
        <div className="space-y-4">
            <label className={labelClass}>Industry Specific Tags</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {INDUSTRY_SUB_TYPES.map(type => {
                    const selected = safeIndustrySubType.includes(type);
                    return (
                        <label key={type} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${selected ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-200'}`}>
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
                                checked={selected}
                                onChange={() => setFormData(p => ({ ...p, industrySubType: toggleArrayItem(Array.isArray(p.industrySubType) ? p.industrySubType : [], type) }))}
                            />
                            <span className="ml-3 text-sm font-semibold text-slate-800">{type}</span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
};

export const Step18Expansion = ({ formData, setFormData }: StepProps) => (
    <div className="space-y-6">
        <div>
            <label className="flex items-center p-4 border rounded-xl cursor-pointer transition-all hover:bg-slate-50">
                <input 
                    type="checkbox" 
                    className="w-5 h-5 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
                    checked={formData.franchiseOpportunities}
                    onChange={(e) => setFormData(p => ({ ...p, franchiseOpportunities: e.target.checked }))}
                />
                <div className="ml-3">
                    <span className="block text-sm font-semibold text-slate-800">We offer franchise opportunities</span>
                    <span className="block text-xs text-slate-500">Check this if you are looking to expand your brand via franchising.</span>
                </div>
            </label>
        </div>

        {formData.franchiseOpportunities && (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div>
                    <label className={labelClass}>Investment Range</label>
                    <input 
                        type="text" 
                        className={inputClass} 
                        placeholder="e.g. 5 Million - 10 Million PKR"
                        value={formData.franchiseInvestmentRange}
                        onChange={e => setFormData(p => ({ ...p, franchiseInvestmentRange: e.target.value }))}
                    />
                </div>
                <div>
                    <label className={labelClass}>Minimum Space Required (sq ft)</label>
                    <input 
                        type="text" 
                        className={inputClass} 
                        placeholder="e.g. 500 sq ft"
                        value={formData.franchiseMinSpace}
                        onChange={e => setFormData(p => ({ ...p, franchiseMinSpace: e.target.value }))}
                    />
                </div>
            </div>
        )}
        
        <div className="pt-4 border-t border-slate-100">
            <label className="flex items-center p-4 border rounded-xl cursor-pointer transition-all hover:bg-slate-50">
                <input 
                    type="checkbox" 
                    className="w-5 h-5 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
                    checked={formData.lookingForDealers}
                    onChange={(e) => setFormData(p => ({ ...p, lookingForDealers: e.target.checked }))}
                />
                <div className="ml-3">
                    <span className="block text-sm font-semibold text-slate-800">We are looking for dealers/distributors</span>
                </div>
            </label>
        </div>
    </div>
);

export const Step19Media = ({ formData, setFormData }: StepProps) => {
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const response = await api.listings.uploadImage(file);
            setFormData(prev => ({ ...prev, coverImageUrl: response.url }));
        } catch (err: any) {
            console.error('Failed to upload', err);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const response = await api.listings.uploadImage(file);
            setFormData(prev => ({ ...prev, logoUrl: response.url }));
        } catch (err: any) {
            console.error('Failed to upload logo', err);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <label className={labelClass}>Business Logo</label>
                <label className="block cursor-pointer group">
                    <div className={`relative rounded-2xl border-2 border-dashed transition-all overflow-hidden w-32 h-32 ${formData.logoUrl ? 'border-orange-300' : 'border-slate-200 hover:border-orange-300 bg-slate-50 hover:bg-orange-50/30'}`}>
                        {formData.logoUrl ? (
                            <img src={formData.logoUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 group-hover:text-orange-400 transition-colors">
                                <ImagePlus className="w-8 h-8" />
                            </div>
                        )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">Recommended: 400×400px, PNG or JPG. Max 5MB.</p>
            </div>

            <div>
                <label className={labelClass}>Cover Image</label>
                <label className="block cursor-pointer group">
                    <div className={`relative rounded-2xl border-2 border-dashed transition-all overflow-hidden ${formData.coverImageUrl ? 'border-orange-300' : 'border-slate-200 hover:border-orange-300 bg-slate-50 hover:bg-orange-50/30'}`}>
                        {formData.coverImageUrl ? (
                            <img src={formData.coverImageUrl} alt="Preview" className="w-full h-56 object-cover" />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-14 gap-3 text-slate-400 group-hover:text-orange-400 transition-colors">
                                <ImagePlus className="w-10 h-10" />
                                <div className="text-center">
                                    <p className="font-black text-sm">Click to upload cover image</p>
                                    <p className="text-xs mt-0.5">Recommended: 1200 × 675px (16:9)</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
            </div>
        </div>
    );
};

