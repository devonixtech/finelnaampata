"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, RefreshCw, Loader2, Trash2, Edit2,
    MapPin, Globe, Building2, Star, XCircle,
    CheckCircle2, Navigation, MapIcon, AlertTriangle,
    Eye, EyeOff, Download, ChevronDown, Globe2
} from 'lucide-react';
import { api, getImageUrl } from '../../../lib/api';
import { City } from '../../../types/api';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';

const COUNTRY_FLAGS: Record<string, string> = {
    'Pakistan': '🇵🇰',
    'India': '🇮🇳',
    'UAE': '🇦🇪',
    'Saudi Arabia': '🇸🇦',
    'UK': '🇬🇧',
    'USA': '🇺🇸',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
};

export default function AdminCitiesPage() {
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(10);

    // Modals
    const [isGoogleImportOpen, setIsGoogleImportOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCity, setSelectedCity] = useState<City | null>(null);

    // Supported countries for bulk import
    const [supportedCountries, setSupportedCountries] = useState<{ country: string; cityCount: number }[]>([]);
    const [selectedBulkCountry, setSelectedBulkCountry] = useState('Pakistan');
    const [isBulkImporting, setIsBulkImporting] = useState(false);

    const [quickImportData, setQuickImportData] = useState({
        name: '',
        state: '',
        country: 'Pakistan',
        isPopular: false,
        displayOrder: 0,
    });

    // Create / Edit form
    const [formData, setFormData] = useState({
        name: '',
        state: '',
        country: 'Pakistan',
        description: '',
        isPopular: false,
        displayOrder: 0,
        heroImageUrl: '',
    });

    const fetchCities = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.cities.adminList(page, limit, search) as any;
            setCities(response.data || []);
            setTotal(response.total || 0);
        } catch (err) {
            console.error('Failed to fetch cities', err);
        } finally {
            setLoading(false);
        }
    }, [page, limit, search]);

    useEffect(() => { fetchCities(); }, [fetchCities]);

    // Load supported countries on mount
    useEffect(() => {
        api.cities.getSupportedCountries().then(setSupportedCountries).catch(() => {});
    }, []);

    // ---- Handlers ----

    const handleGoogleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickImportData.name.trim()) return;
        setActionLoading('google-import');
        try {
            await api.cities.adminCreate({
                name: quickImportData.name.trim(),
                state: quickImportData.state.trim(),
                country: quickImportData.country.trim() || 'Pakistan',
                isPopular: quickImportData.isPopular,
                displayOrder: quickImportData.displayOrder,
                heroImageUrl: '',
            });
            await fetchCities();
            setIsGoogleImportOpen(false);
            setQuickImportData({ name: '', state: '', country: 'Pakistan', isPopular: false, displayOrder: 0 });
        } catch (err: any) {
            alert(err.message || 'Failed to import city');
        } finally {
            setActionLoading(null);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setActionLoading('upload');
        try {
            const response = await api.listings.uploadImage(file);
            setFormData(prev => ({ ...prev, heroImageUrl: response.url }));
        } catch (err: any) {
            alert(err.message || 'Failed to upload image');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading('create');
        try {
            await api.cities.adminCreate(formData);
            await fetchCities();
            setIsCreateModalOpen(false);
            resetForm();
        } catch (err: any) {
            alert(err.message || 'Failed to create city');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCity) return;
        setActionLoading('update');
        try {
            await api.cities.adminUpdate(selectedCity.id, formData);
            await fetchCities();
            setIsEditModalOpen(false);
            resetForm();
        } catch (err: any) {
            alert(err.message || 'Failed to update city');
        } finally {
            setActionLoading(null);
        }
    };

    const handleTogglePopular = async (city: City) => {
        setActionLoading(city.id);
        try {
            await api.cities.adminUpdate(city.id, { isPopular: !city.isPopular });
            setCities(prev => prev.map(c => c.id === city.id ? { ...c, isPopular: !c.isPopular } : c));
        } catch (err: any) {
            alert(err.message || 'Failed to update city');
        } finally {
            setActionLoading(null);
        }
    };

    const handleBulkImport = async () => {
        setIsBulkImporting(true);
        try {
            const result = await api.cities.bulkImport(selectedBulkCountry);
            alert(`✅ Successfully imported ${result.count} new cities from ${selectedBulkCountry}! (${result.total} total in dataset, ${result.total - result.count} already existed)`);
            await fetchCities();
            setIsBulkImportOpen(false);
        } catch (err: any) {
            alert(err.message || 'Bulk import failed');
        } finally {
            setIsBulkImporting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedCity) return;
        setActionLoading('delete');
        try {
            await api.cities.adminDelete(selectedCity.id);
            await fetchCities();
            setIsDeleteModalOpen(false);
            setSelectedCity(null);
        } catch (err: any) {
            alert(err.message || 'Failed to delete city');
        } finally {
            setActionLoading(null);
        }
    };

    const openEditModal = (city: City) => {
        setSelectedCity(city);
        setFormData({
            name: city.name,
            state: city.state || '',
            country: city.country || 'Pakistan',
            description: city.description || '',
            isPopular: city.isPopular || false,
            displayOrder: city.displayOrder || 0,
            heroImageUrl: city.heroImageUrl || '',
        });
        setIsEditModalOpen(true);
    };

    const resetForm = () => {
        setFormData({ name: '', state: '', country: 'Pakistan', description: '', isPopular: false, displayOrder: 0, heroImageUrl: '' });
        setSelectedCity(null);
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cities Management</h1>
                    <p className="text-slate-400 font-medium mt-1">
                        Import and manage cities available for business listings.
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={fetchCities}
                        className="flex items-center justify-center p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-600 transition-all"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    {/* Bulk Import */}
                    <button
                        onClick={() => setIsBulkImportOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-2xl font-bold transition-all"
                    >
                        <Download className="w-5 h-5" />
                        Bulk Import
                    </button>
                    {/* Google Import */}
                    <button
                        onClick={() => setIsGoogleImportOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-2xl font-bold transition-all"
                    >
                        <MapIcon className="w-5 h-5" />
                        Google Import
                    </button>
                    {/* Add City */}
                    <button
                        onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl font-bold transition-all shadow-slate-900/20 active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Add City
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                    <Search className="w-5 h-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search cities by name..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-14 pr-6 h-16 rounded-[24px] border border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-4 focus:ring-slate-100 placeholder:text-slate-400 text-base shadow-sm transition-all"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400">City</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400">State / Region</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Country</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Popular</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Created</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode='popLayout'>
                                {loading && cities.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-24 text-center">
                                            <Loader2 className="w-10 h-10 animate-spin text-slate-200 mx-auto" />
                                        </td>
                                    </tr>
                                ) : cities.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-24 text-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                                <MapPin className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900">No cities found</h3>
                                            <p className="text-slate-400 font-medium mt-2">Use Bulk Import or Add City to get started.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    cities.map((city, idx) => (
                                        <motion.tr
                                            key={city.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                                        >
                                            {/* City */}
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0">
                                                        {city.heroImageUrl ? (
                                                            <img src={getImageUrl(city.heroImageUrl) || ""} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <Building2 className="w-6 h-6" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-base">{city.name}</p>
                                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{city.slug}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* State */}
                                            <td className="px-8 py-6">
                                                <span className="text-sm text-slate-600 font-bold">{city.state || <span className="text-slate-300">—</span>}</span>
                                            </td>
                                            {/* Country */}
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{COUNTRY_FLAGS[city.country] || '🌍'}</span>
                                                    <span className="text-sm text-slate-600 font-bold">{city.country}</span>
                                                </div>
                                            </td>
                                            {/* Popular toggle */}
                                            <td className="px-8 py-6">
                                                <button
                                                    onClick={() => handleTogglePopular(city)}
                                                    disabled={actionLoading === city.id}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${city.isPopular
                                                        ? 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
                                                        : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'}`}
                                                >
                                                    {actionLoading === city.id ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Star className={`w-3 h-3 ${city.isPopular ? 'fill-current' : ''}`} />
                                                            {city.isPopular ? 'Popular' : 'Normal'}
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            {/* Created At */}
                                            <td className="px-8 py-6">
                                                <span className="text-sm text-slate-500 font-medium">
                                                    {city.createdAt ? new Date(city.createdAt).toLocaleDateString() : '—'}
                                                </span>
                                            </td>
                                            {/* Actions */}
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEditModal(city)}
                                                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedCity(city); setIsDeleteModalOpen(true); }}
                                                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-600 transition-all shadow-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-8 py-6 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-sm text-slate-500 font-medium">
                            Showing <span className="text-slate-900 font-bold">{(page - 1) * limit + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(page * limit, total)}</span> of <span className="text-slate-900 font-bold">{total}</span> cities
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all">
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                    .map((p, i, arr) => (
                                        <React.Fragment key={p}>
                                            {i > 0 && arr[i - 1] !== p - 1 && <span className="text-slate-400">...</span>}
                                            <button onClick={() => setPage(p)}
                                                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${page === p ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                                {p}
                                            </button>
                                        </React.Fragment>
                                    ))}
                            </div>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all">
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ============================================================ */}
            {/* BULK IMPORT MODAL — Country Dropdown                         */}
            {/* ============================================================ */}
            <AnimatePresence>
                {isBulkImportOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[28px] p-8 max-w-lg w-full shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                        <Download className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bulk Import Cities</h2>
                                        <p className="text-sm text-slate-400 font-medium">Import all cities for a country at once</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsBulkImportOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                                    <XCircle className="w-8 h-8" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Country</label>
                                    <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                                        <SearchableSelect
                                            value={selectedBulkCountry}
                                            onChange={val => setSelectedBulkCountry(val)}
                                            options={(supportedCountries.length > 0 ? supportedCountries : Object.keys(COUNTRY_FLAGS).map(c => ({ country: c, cityCount: 0 }))).map(({ country, cityCount }) => ({
                                                label: `${COUNTRY_FLAGS[country] || '🌍'} ${country} ${cityCount > 0 ? `(${cityCount} cities)` : ''}`,
                                                value: country
                                            }))}
                                        />
                                    </div>
                                </div>

                                {/* Preview */}
                                {supportedCountries.find(c => c.country === selectedBulkCountry) && (
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
                                        <Globe2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-black text-blue-900">
                                                {supportedCountries.find(c => c.country === selectedBulkCountry)?.cityCount} cities will be imported
                                            </p>
                                            <p className="text-xs text-blue-600 font-medium mt-0.5">
                                                Already-existing cities will be skipped automatically.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleBulkImport}
                                    disabled={isBulkImporting}
                                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-600/20"
                                >
                                    {isBulkImporting
                                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Importing cities...</>
                                        : <><Download className="w-5 h-5" /> Import All {selectedBulkCountry} Cities</>
                                    }
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ============================================================ */}
            {/* GOOGLE IMPORT MODAL                                          */}
            {/* ============================================================ */}
            <AnimatePresence>
                {isGoogleImportOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[28px] p-8 max-w-lg w-full shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                        <MapIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Quick City Import</h2>
                                        <p className="text-sm text-slate-400 font-medium">Add city metadata without map dependency</p>
                                    </div>
                                </div>
                                <button onClick={() => { setIsGoogleImportOpen(false); setQuickImportData({ name: '', state: '', country: 'Pakistan', isPopular: false, displayOrder: 0 }); }} className="text-slate-400 hover:text-slate-900 transition-colors">
                                    <XCircle className="w-8 h-8" />
                                </button>
                            </div>

                            <form onSubmit={handleGoogleImport} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">City Name</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="text"
                                            value={quickImportData.name}
                                            onChange={(e) => setQuickImportData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Enter city name..."
                                            className="w-full h-16 pl-14 pr-6 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 font-bold transition-all text-base"
                                        />
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2">
                                            <Search className="w-5 h-5 text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">State / Province</label>
                                        <input type="text" value={quickImportData.state}
                                            onChange={e => setQuickImportData(prev => ({ ...prev, state: e.target.value }))}
                                            className="w-full h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 font-bold transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Country</label>
                                        <input type="text" value={quickImportData.country}
                                            onChange={e => setQuickImportData(prev => ({ ...prev, country: e.target.value }))}
                                            className="w-full h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 font-bold transition-all" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Display Order</label>
                                        <input type="number" value={quickImportData.displayOrder}
                                            onChange={e => setQuickImportData(prev => ({ ...prev, displayOrder: Number(e.target.value) }))}
                                            className="w-full h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 font-bold transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Promote</label>
                                        <button type="button"
                                            onClick={() => setQuickImportData(prev => ({ ...prev, isPopular: !prev.isPopular }))}
                                            className={`w-full h-14 px-5 rounded-2xl border flex items-center justify-center gap-2 font-bold transition-all ${quickImportData.isPopular ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                            <Star className={`w-4 h-4 ${quickImportData.isPopular ? 'fill-current' : ''}`} />
                                            {quickImportData.isPopular ? 'Popular' : 'Mark Popular'}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" disabled={!quickImportData.name.trim() || !!actionLoading}
                                    className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10">
                                    {actionLoading === 'google-import' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                                    Import City to Database
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ============================================================ */}
            {/* CREATE / EDIT MODAL                                          */}
            {/* ============================================================ */}
            <AnimatePresence>
                {(isCreateModalOpen || isEditModalOpen) && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[28px] p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black text-slate-900">
                                    {isEditModalOpen ? 'Edit City' : 'Add New City'}
                                </h2>
                                <button onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); resetForm(); }} className="text-slate-300 hover:text-slate-900 transition-colors">
                                    <XCircle className="w-8 h-8" />
                                </button>
                            </div>

                            <form onSubmit={isEditModalOpen ? handleUpdate : handleCreate} className="space-y-5">
                                {/* City Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">City Name *</label>
                                    <input required type="text" placeholder="e.g., Lahore"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 font-bold transition-all" />
                                </div>

                                {/* Hero Image Upload */}
                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">City Image</label>
                                    <div className="flex gap-4 items-start">
                                        {formData.heroImageUrl && (
                                            <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-100 flex-shrink-0 group">
                                                <img
                                                    src={getImageUrl(formData.heroImageUrl) || ""}
                                                    className="w-full h-full object-cover"
                                                    alt="Preview"
                                                />
                                                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                    <RefreshCw className="w-5 h-5 text-white" />
                                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                                </label>
                                            </div>
                                        )}
                                        <label className={`flex-1 flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${formData.heroImageUrl ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300'}`}>
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                            {actionLoading === 'upload' ? (
                                                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                    <Plus className="w-6 h-6" />
                                                    <p className="text-[10px] font-black uppercase tracking-wider">
                                                        {formData.heroImageUrl ? 'Change Image' : 'Upload City Image'}
                                                    </p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold ml-1 uppercase tracking-wider">Recommended: 1200×600px (2:1), PNG/JPG, max 5MB.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* State */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">State / Province</label>
                                        <input type="text" placeholder="e.g., Punjab"
                                            value={formData.state}
                                            onChange={e => setFormData({ ...formData, state: e.target.value })}
                                            className="w-full h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 font-bold transition-all" />
                                    </div>
                                    {/* Country */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Country</label>
                                        <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 focus-within:ring-4 focus-within:ring-slate-100 transition-all">
                                            <SearchableSelect
                                                value={formData.country}
                                                onChange={val => setFormData({ ...formData, country: val })}
                                                options={[
                                                    ...Object.keys(COUNTRY_FLAGS).map(c => ({
                                                        label: `${COUNTRY_FLAGS[c]} ${c}`,
                                                        value: c
                                                    })),
                                                    { label: "🌍 Other", value: "Other" }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Description</label>
                                    <textarea rows={3} placeholder="Brief description of this city..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full p-5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 font-bold transition-all resize-none" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Display Order */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Display Order</label>
                                        <input type="number" value={formData.displayOrder}
                                            onChange={e => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                                            className="w-full h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 font-bold transition-all" />
                                    </div>
                                    {/* Popular */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Popular City</label>
                                        <button type="button"
                                            onClick={() => setFormData({ ...formData, isPopular: !formData.isPopular })}
                                            className={`w-full h-14 px-5 rounded-2xl border flex items-center justify-center gap-2 font-bold transition-all ${formData.isPopular ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                            <Star className={`w-4 h-4 ${formData.isPopular ? 'fill-current' : ''}`} />
                                            {formData.isPopular ? 'Popular' : 'Mark Popular'}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button type="submit" disabled={!!actionLoading}
                                        className="w-full h-16 bg-slate-900 text-white rounded-[20px] font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50">
                                        {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : isEditModalOpen ? 'Save Changes' : 'Add City'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ============================================================ */}
            {/* DELETE MODAL                                                  */}
            {/* ============================================================ */}
            <AnimatePresence>
                {isDeleteModalOpen && selectedCity && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[28px] p-10 max-w-md w-full shadow-2xl text-center"
                        >
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Remove City?</h3>
                            <p className="text-slate-500 font-medium mt-3 leading-relaxed">
                                You are about to remove <span className="text-slate-900 font-black">"{selectedCity.name}"</span>.
                                Businesses listed in this city may become harder to find.
                            </p>
                            <div className="flex gap-4 mt-10">
                                <button onClick={() => { setIsDeleteModalOpen(false); setSelectedCity(null); }}
                                    className="flex-1 h-14 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95">
                                    Cancel
                                </button>
                                <button onClick={handleDelete} disabled={!!actionLoading}
                                    className="flex-1 h-14 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50">
                                    {actionLoading === 'delete' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Yes, Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
