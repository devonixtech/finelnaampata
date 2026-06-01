"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, RefreshCw, Loader2, Edit2, Trash2,
    CheckCircle2, XCircle, Image as ImageIcon, PlusCircle,
    ChevronRight, FolderPlus, MoreVertical, LayoutGrid,
    List, AlertTriangle, Eye, EyeOff
} from 'lucide-react';
import { api, getImageUrl } from '../../../lib/api';
import { Category } from '../../../types/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(10);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        icon: '',
        imageUrl: '',
        description: '',
        parentId: '',
        displayOrder: 0,
        status: 'active' as 'active' | 'disabled'
    });

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.categories.adminGetAll(page, limit, search) as any;
            if (Array.isArray(response)) {
                // Handle legacy array response
                setCategories(response);
                setTotal(response.length);
            } else {
                // Handle new paginated response
                setCategories(response.data || []);
                setTotal(response.total || 0);
            }
        } catch (err) {
            console.error('Failed to fetch categories', err);
        } finally {
            setLoading(false);
        }
    }, [page, limit, search]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageUploading(true);
        try {
            const result = await api.cloudinary.uploadToCloudinary(file, 'categories');
            setFormData(prev => ({ ...prev, imageUrl: result.secure_url }));
        } catch (err: any) {
            alert(err.message || 'Image upload failed');
        } finally {
            setImageUploading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading('create');
        try {
            // Sanitize data: remove empty strings/null for optional fields
            const dataToSubmit: any = { ...formData };
            Object.keys(dataToSubmit).forEach(key => {
                if (dataToSubmit[key] === '' || dataToSubmit[key] === null) {
                    delete dataToSubmit[key];
                }
            });

            await api.categories.adminCreate(dataToSubmit);
            await fetchCategories();
            setIsCreateModalOpen(false);
            resetForm();
        } catch (err: any) {
            alert(err.message || 'Failed to create category');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory) return;
        setActionLoading('update');
        try {
            // Sanitize data: remove empty strings/null for optional fields
            const dataToSubmit: any = { ...formData };
            Object.keys(dataToSubmit).forEach(key => {
                if (dataToSubmit[key] === '' || dataToSubmit[key] === null) {
                    delete dataToSubmit[key];
                }
            });

            await api.categories.adminUpdate(selectedCategory.id, dataToSubmit);
            await fetchCategories();
            setIsEditModalOpen(false);
            resetForm();
        } catch (err: any) {
            alert(err.message || 'Failed to update category');
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleStatus = async (category: Category) => {
        const newStatus = category.status === 'active' ? 'disabled' : 'active';
        setActionLoading(category.id);
        try {
            await api.categories.adminUpdateStatus(category.id, newStatus);
            setCategories(prev => prev.map(c => c.id === category.id ? { ...c, status: newStatus } : c));
        } catch (err: any) {
            alert(err.message || 'Failed to update status');
        } finally {
            setActionLoading(null);
        }
    };


    const handleDelete = async () => {
        if (!selectedCategory) return;
        setActionLoading('delete');
        try {
            await api.categories.adminDelete(selectedCategory.id);
            await fetchCategories();
            setIsDeleteModalOpen(false);
            setSelectedCategory(null);
        } catch (err: any) {
            alert(err.message || 'Failed to delete category. Make sure it has no subcategories or active listings.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleBulkImport = async () => {
        if (!confirm('This will import over 80 common Google Place categories. Continue?')) return;
        setIsImporting(true);
        try {
            const result = await api.categories.bulkImportGoogle() as { count: number };
            alert(`Successfully imported/synced ${result.count} categories!`);
            await fetchCategories();
        } catch (err: any) {
            alert(err.message || 'Bulk import failed');
        } finally {
            setIsImporting(false);
        }
    };

    const openEditModal = (category: Category) => {
        setSelectedCategory(category);
        setFormData({
            name: category.name,
            slug: category.slug,
            icon: category.icon || '',
            imageUrl: category.imageUrl || '',
            description: category.description || '',
            parentId: category.parentId || '',
            displayOrder: category.displayOrder || 0,
            status: category.status
        });
        setIsEditModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            icon: '',
            imageUrl: '',
            description: '',
            parentId: '',
            displayOrder: 0,
            status: 'active'
        });
        setSelectedCategory(null);
    };

    // We no longer need client-side filtering as it's handled server-side
    const filteredCategories = categories;

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Category Management</h1>
                    <p className="text-slate-400 font-medium mt-1">
                        Control the business categories accessible to businesses and users.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchCategories}
                        className="flex items-center justify-center p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-600 transition-all"
                        title="Refresh categories"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleBulkImport}
                        disabled={isImporting}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-2xl font-bold transition-all disabled:opacity-50"
                    >
                        {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        Google Import
                    </button>
                    <button
                        onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl font-bold transition-all  shadow-slate-900/20 active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Add Category
                    </button>
                </div>
            </div>

            {/* toolbar */}
            <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <Search className="w-5 h-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search categories by name or slug..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-14 pr-6 h-16 rounded-[24px] border border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-4 focus:ring-slate-100 placeholder:text-slate-400 text-base shadow-sm transition-all"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-[28px] border border-slate-100  shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400 text-left">Category</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400 text-left">Slug</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400 text-left">Source</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400 text-left">Status</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400 text-left">Created At</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode='popLayout'>
                                {loading && categories.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center">
                                            <Loader2 className="w-10 h-10 animate-spin text-slate-200 mx-auto" />
                                        </td>
                                    </tr>
                                ) : filteredCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                                <LayoutGrid className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900">No categories found</h3>
                                            <p className="text-slate-400 font-medium mt-2">Try adjusting your search terms.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCategories.map((c, idx) => {
                                        const parent = categories.find(p => p.id === c.parentId);
                                        const isSubcategory = !!c.parentId;

                                        return (
                                            <motion.tr
                                                key={c.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className={`flex items-center gap-5 ${isSubcategory ? 'ml-12' : ''}`}>
                                                        {isSubcategory && (
                                                            <div className="flex items-center text-slate-300">
                                                                <div className="w-6 h-px bg-slate-200 mr-2" />
                                                                <div className="w-px h-10 bg-slate-200 -mt-10 mr-2 absolute left-[98px]" />
                                                            </div>
                                                        )}
                                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0">
                                                            {c.imageUrl ? (
                                                                <img src={c.imageUrl} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                <div className="text-xl text-slate-400 font-bold">{c.icon || <LayoutGrid className="w-6 h-6" />}</div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-black text-slate-900 text-base">{c.name}</p>
                                                                {parent && (
                                                                    <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-black uppercase text-slate-400 rounded-md">
                                                                        in {parent.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-400 font-medium mt-0.5 mt-1 line-clamp-1 max-w-[200px]">{c.description || 'No description'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <code className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">{c.slug}</code>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${c.source === 'google'
                                                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                        : 'bg-purple-50 text-purple-600 border-purple-100'
                                                        }`}>
                                                        {c.source === 'google' ? <Search className="w-3 h-3" /> : <PlusCircle className="w-3 h-3" />}
                                                        {c.source}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${c.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                                        }`}>
                                                        {c.status === 'active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-sm text-slate-500 font-medium">{new Date(c.createdAt).toLocaleDateString()}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleToggleStatus(c)}
                                                            disabled={actionLoading === c.id}
                                                            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all shadow-sm ${c.status === 'active'
                                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                                                : 'bg-white border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-600'
                                                                }`}
                                                            title={c.status === 'active' ? 'Hide from entire system' : 'Unhide in entire system'}
                                                        >
                                                            {actionLoading === c.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    {c.status === 'active' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-red-500" />}
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(c)}
                                                            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => { setSelectedCategory(c); setIsDeleteModalOpen(true); }}
                                                            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-600 transition-all shadow-sm"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-8 py-6 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-sm text-slate-500 font-medium">
                            Showing <span className="text-slate-900 font-bold">{(page - 1) * limit + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(page * limit, total)}</span> of <span className="text-slate-900 font-bold">{total}</span> categories
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all font-sans"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                    .map((p, i, arr) => (
                                        <React.Fragment key={p}>
                                            {i > 0 && arr[i - 1] !== p - 1 && (
                                                <span className="text-slate-400">...</span>
                                            )}
                                            <button
                                                onClick={() => setPage(p)}
                                                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all font-sans ${page === p
                                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        </React.Fragment>
                                    ))}
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all font-sans"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {(isCreateModalOpen || isEditModalOpen) && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[28px] p-8 max-w-lg w-full shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black text-slate-900">{isEditModalOpen ? 'Edit Category' : 'Create New Category'}</h2>
                                <button onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); resetForm(); }} className="text-slate-300 hover:text-slate-900 transition-colors">
                                    <XCircle className="w-8 h-8" />
                                </button>
                            </div>

                            <form onSubmit={isEditModalOpen ? handleUpdate : handleCreate} className="space-y-5">
                                {/* Category Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Category Name *</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g., Beauty Salon"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 font-bold transition-all"
                                    />
                                </div>

                                {/* Image Upload */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Category Image</label>
                                    <label className={`flex flex-col items-center justify-center w-full h-40 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${imageUploading ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                                        }`}>
                                        {imageUploading ? (
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <Loader2 className="w-8 h-8 animate-spin" />
                                                <span className="text-sm font-bold">Uploading...</span>
                                            </div>
                                        ) : formData.imageUrl ? (
                                            <div className="relative w-full h-full">
                                                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                                                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <span className="text-white font-bold text-sm">Click to change</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <ImageIcon className="w-8 h-8" />
                                                <span className="text-sm font-bold">Click to upload image</span>
                                                <span className="text-xs">PNG, JPG, WEBP up to 10MB</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                            disabled={imageUploading}
                                        />
                                    </label>
                                </div>

                                {/* Short Description */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Short Description</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Brief description of this category..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full p-5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 font-bold transition-all resize-none"
                                    />
                                </div>

                                {/* Parent Category Selection */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Parent Category</label>
                                    <div className="relative">
                                        <select
                                            value={formData.parentId || ''}
                                            onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                                            className="w-full h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 font-bold transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">None (Root Category)</option>
                                            {categories
                                                .filter(c => isEditModalOpen ? c.id !== selectedCategory?.id : true)
                                                .map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronRight className="w-5 h-5 rotate-90" />
                                        </div>
                                    </div>
                                </div>


                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={!!actionLoading}
                                        className="flex-1 h-16 bg-slate-900 text-white rounded-[20px] font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {actionLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            isEditModalOpen ? 'Save Changes' : 'Create Category'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Modal */}
            <AnimatePresence>
                {isDeleteModalOpen && selectedCategory && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[28px] p-10 max-w-md w-full shadow-2xl text-center"
                        >
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Are you sure?</h3>
                            <p className="text-slate-500 font-medium mt-3 leading-relaxed">
                                You are about to delete <span className="text-slate-900 font-black">"{selectedCategory.name}"</span>.
                                This action cannot be undone and will fail if the category has subcategories or active listings.
                            </p>
                            <div className="flex gap-4 mt-10">
                                <button
                                    onClick={() => { setIsDeleteModalOpen(false); setSelectedCategory(null); }}
                                    className="flex-1 h-14 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={!!actionLoading}
                                    className="flex-1 h-14 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all active:scale-95  shadow-red-600/20 disabled:opacity-50"
                                >
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
