import React from 'react';
import { StepProps } from '../types';
import { BUSINESS_TYPES, CORE_BUSINESS_NATURE, OPERATIONAL_STRUCTURE_SECTIONS, TARGET_MARKET, AMENITIES, EMPLOYEE_COUNT_OPTIONS } from '../../../../lib/constants/listing-options';

const inputClass = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all placeholder:text-slate-400";
const labelClass = "block text-xs font-black uppercase tracking-widest text-slate-400 mb-2";

// Helper for multi-select arrays
const toggleArrayItem = (arr: string[], item: string) => 
    arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

export const Step1NameTagline = ({ formData, setFormData }: StepProps) => (
    <div className="space-y-6">
        <div>
            <label className={labelClass}>Business Name</label>
            <input 
                type="text" 
                className={inputClass} 
                placeholder="e.g., Al-Madina Super Store"
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
            />
            <p className="text-xs text-slate-500 mt-2">Enter the exact name as it appears on your storefront or official documents.</p>
        </div>
        <div>
            <label className={labelClass}>Tagline / Short Description (Optional)</label>
            <input 
                type="text" 
                className={inputClass} 
                placeholder="e.g., Your daily fresh grocery hub"
                value={formData.shortDescription}
                onChange={e => setFormData(p => ({ ...p, shortDescription: e.target.value }))}
                maxLength={100}
            />
            <p className="text-xs text-slate-500 mt-2">A catchy one-liner to display in search results.</p>
        </div>
    </div>
);

export const Step2BusinessType = ({ formData, setFormData }: StepProps) => (
    <div className="space-y-4">
        <label className={labelClass}>Select Business Type(s)</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {BUSINESS_TYPES.map(type => (
                <label key={type} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${formData.businessType.includes(type) ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-200'}`}>
                    <input 
                        type="checkbox" 
                        className="w-5 h-5 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
                        checked={formData.businessType.includes(type)}
                        onChange={() => setFormData(p => ({ ...p, businessType: toggleArrayItem(p.businessType, type) }))}
                    />
                    <span className="ml-3 text-sm font-semibold text-slate-800">{type}</span>
                </label>
            ))}
        </div>
    </div>
);

export const Step3BusinessNature = ({ formData, setFormData }: StepProps) => (
    <div className="space-y-4">
        <label className={labelClass}>Core Business Nature</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CORE_BUSINESS_NATURE.map(nature => (
                <label key={nature} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${formData.coreBusinessNature.includes(nature) ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-200'}`}>
                    <input 
                        type="checkbox" 
                        className="w-5 h-5 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
                        checked={formData.coreBusinessNature.includes(nature)}
                        onChange={() => setFormData(p => ({ ...p, coreBusinessNature: toggleArrayItem(p.coreBusinessNature, nature) }))}
                    />
                    <span className="ml-3 text-sm font-semibold text-slate-800">{nature}</span>
                </label>
            ))}
        </div>
    </div>
);

export const Step4OperationalStructure = ({ formData, setFormData }: StepProps) => (
    <div className="space-y-8">
        {Object.entries(OPERATIONAL_STRUCTURE_SECTIONS).map(([key, section]) => (
            <div key={key}>
                <h3 className="text-sm font-black text-slate-900 mb-3">{section.label}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.options.map(struct => (
                        <label key={struct} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${formData.operationalStructure.includes(struct) ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-200'}`}>
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
                                checked={formData.operationalStructure.includes(struct)}
                                onChange={() => setFormData(p => ({ ...p, operationalStructure: toggleArrayItem(p.operationalStructure, struct) }))}
                            />
                            <span className="ml-3 text-sm font-semibold text-slate-800">{struct}</span>
                        </label>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

// We will implement more complex steps directly in the page or dedicated files due to their size (e.g. Map, Category).

export const Step6TargetMarket = ({ formData, setFormData }: StepProps) => (
    <div className="space-y-4">
        <label className={labelClass}>Target Market</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TARGET_MARKET.map(market => (
                <label key={market} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${formData.targetMarket.includes(market) ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-200'}`}>
                    <input 
                        type="checkbox" 
                        className="w-5 h-5 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
                        checked={formData.targetMarket.includes(market)}
                        onChange={() => setFormData(p => ({ ...p, targetMarket: toggleArrayItem(p.targetMarket, market) }))}
                    />
                    <span className="ml-3 text-sm font-semibold text-slate-800">{market}</span>
                </label>
            ))}
        </div>
    </div>
);

export const Step11Description = ({ formData, setFormData }: StepProps) => (
    <div className="space-y-6">
        <div>
            <label className={labelClass}>Business Description</label>
            <textarea 
                rows={6}
                className={inputClass} 
                placeholder="Tell your story. What makes your business unique?"
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            />
        </div>
    </div>
);

export const Step12Experience = ({ formData, setFormData }: StepProps) => (
    <div className="space-y-6">
        <div>
            <label className={labelClass}>Year Established</label>
            <input 
                type="number" 
                className={inputClass} 
                placeholder="e.g., 2015"
                value={formData.yearEstablished}
                onChange={e => setFormData(p => ({ ...p, yearEstablished: e.target.value }))}
            />
        </div>
        <div>
            <label className={labelClass}>Employee Count</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EMPLOYEE_COUNT_OPTIONS.map(opt => (
                    <label key={opt} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${formData.employeeCount === opt ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-200'}`}>
                        <input 
                            type="radio" 
                            name="employeeCount"
                            className="w-5 h-5 text-orange-500 rounded-full border-slate-300 focus:ring-orange-500"
                            checked={formData.employeeCount === opt}
                            onChange={() => setFormData(p => ({ ...p, employeeCount: opt }))}
                        />
                        <span className="ml-3 text-sm font-semibold text-slate-800">{opt}</span>
                    </label>
                ))}
            </div>
        </div>
        <div>
            <label className={labelClass}>Business Languages</label>
            <input 
                type="text" 
                className={inputClass} 
                placeholder="e.g., English, Urdu, Arabic (comma-separated)"
                value={Array.isArray(formData.businessLanguages) ? formData.businessLanguages.join(', ') : ''}
                onChange={e => {
                    const langs = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    setFormData(p => ({ ...p, businessLanguages: langs }));
                }}
            />
        </div>
    </div>
);
