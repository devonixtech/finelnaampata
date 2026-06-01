import React from 'react';
import { StepProps } from '../types';
import { ImagePlus } from 'lucide-react';
import { api } from '../../../../lib/api';

const inputClass = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all placeholder:text-slate-400";
const labelClass = "block text-xs font-black uppercase tracking-widest text-slate-400 mb-2";

const toggleArrayItem = (arr: string[], item: string) => 
    arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

export const Step10Hours = ({ formData, setFormData }: StepProps) => {
    // For simplicity in this demo component, we just render a placeholder. 
    // In production, this would use the BusinessHours arrays/controls similar to the old version.
    return (
        <div className="space-y-6">
            <label className={labelClass}>Business Hours</label>
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <p className="text-sm font-bold text-slate-500">Business Hours Component</p>
                <p className="text-xs text-slate-400 mt-2">Hours matrix will be rendered here.</p>
            </div>
        </div>
    );
};

const INDUSTRY_SUB_TYPES = [
    'Halal Certified', 'Organic', 'Vegan', 'Eco-Friendly', 'ISO Certified', 'Handmade / Artisan'
];

export const Step15Industry = ({ formData, setFormData }: StepProps) => (
    <div className="space-y-4">
        <label className={labelClass}>Industry Specific Tags</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INDUSTRY_SUB_TYPES.map(type => (
                <label key={type} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${formData.industrySubType.includes(type) ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-200'}`}>
                    <input 
                        type="checkbox" 
                        className="w-5 h-5 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
                        checked={formData.industrySubType.includes(type)}
                        onChange={() => setFormData(p => ({ ...p, industrySubType: toggleArrayItem(p.industrySubType, type) }))}
                    />
                    <span className="ml-3 text-sm font-semibold text-slate-800">{type}</span>
                </label>
            ))}
        </div>
    </div>
);

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
