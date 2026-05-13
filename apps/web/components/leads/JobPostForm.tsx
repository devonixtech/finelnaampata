'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Category, City } from '../../types/api';
import CategorySearchSelect from '../CategorySearchSelect';
import CitySearchSelect from '../CitySearchSelect';

interface JobPostFormProps {
    onSuccess?: () => void;
}

export default function JobPostForm({ onSuccess }: JobPostFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [categories, setCategories] = useState<Category[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        categoryId: '',
        city: '',
        budget: '',
    });

    useEffect(() => {
        const loadSearchData = async () => {
            try {
                const [catsData, citiesData] = await Promise.all([
                    api.categories.getAll(),
                    api.cities.getAll()
                ]);
                setCategories(catsData || []);
                setCities(citiesData || []);
            } catch (err) {
                console.error('Failed to load form data', err);
            }
        };
        loadSearchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.broadcasts.create({
                ...formData,
                budget: formData.budget ? parseFloat(formData.budget) : undefined,
            });
            setSuccess(true);
            setFormData({
                title: '',
                description: '',
                categoryId: '',
                city: '',
                budget: '',
            });
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to post job lead');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-green-50 p-6 rounded-xl border border-green-100 text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Job Posted Successfully!</h3>
                <p className="text-gray-600 mb-6">Your request has been broadcasted to relevant businesses. You will be notified when they respond.</p>
                <button
                    onClick={() => setSuccess(false)}
                    className="text-primary-600 font-semibold hover:underline"
                >
                    Post another job
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">What service do you need?</label>
                <input
                    type="text"
                    required
                    placeholder="e.g. Emergency Plumbing, Web Development"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <CategorySearchSelect
                        categories={categories}
                        value={formData.categoryId}
                        onChange={(id) => setFormData({ ...formData, categoryId: id })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <CitySearchSelect
                        cities={cities}
                        value={formData.city}
                        onChange={(cityName) => setFormData({ ...formData, city: cityName })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description & Requirements</label>
                <textarea
                    required
                    rows={4}
                    placeholder="Provide details like scope of work, timeline, and any specific requirements..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Budget (Optional)</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">PKR</span>
                    <input
                        type="number"
                        placeholder="0.00"
                        className="w-full pl-14 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    />
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary-200 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
                {loading ? (
                    <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                    <>
                        <span>Broadcast Job Request</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    </>
                )}
            </button>
        </form>
    );
}
