"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, Search, RefreshCw, Loader2, Shield, ShieldAlert,
    ShieldCheck, ShieldOff, UserCheck, UserX, ChevronLeft,
    ChevronRight, Mail, Calendar, Chrome, KeyRound, MoreVertical,
    Briefcase, User as UserIcon, Crown, Trash2, Eye, X,
    Banknote, MapPin, Building2, Phone, Star, MessageSquare,
    Link as LinkIcon, BadgeCheck, Zap, AlertTriangle, CreditCard,
    Store, CheckCircle2, LayoutGrid
} from 'lucide-react';
import { api, getImageUrl } from '../../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';

type Role = 'user' | 'vendor' | 'superadmin';

const ROLE_CONFIG: Record<Role, { label: string; cls: string; Icon: any }> = {
    user: { label: 'User', cls: 'bg-slate-100 text-slate-600 border-slate-200', Icon: UserIcon },
    vendor: { label: 'Business', cls: 'bg-blue-50 text-blue-700 border-blue-200', Icon: Briefcase },
    // admin: { label: 'Admin', cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Shield },
    superadmin: { label: 'Superadmin', cls: 'bg-red-50 text-red-700 border-red-200', Icon: Crown },
};

const RolePill = ({ role }: { role: string }) => {
    const r = ROLE_CONFIG[role as Role] || ROLE_CONFIG.user;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${r.cls}`}>
            <r.Icon className="w-3 h-3" /> {r.label}
        </span>
    );
};

const StatusBadge = ({ active }: { active: boolean }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${active
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-red-50 text-red-600 border-red-200'
        }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
        {active ? 'Active' : 'Inactive'}
    </span>
);

const ProviderBadge = ({ provider }: { provider?: string }) => {
    if (!provider || provider === 'local') return (
        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-bold">
            <KeyRound className="w-3 h-3" /> Password
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 text-[10px] text-blue-500 font-bold">
            <Chrome className="w-3 h-3" /> Google
        </span>
    );
};

const formatDate = (d: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

function getInitials(name: string) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const ROLE_COLORS: Record<string, string> = {
    user: 'from-slate-400 to-slate-500',
    vendor: 'from-blue-400 to-blue-600',
    admin: 'from-amber-400 to-orange-500',
    superadmin: 'from-red-500 to-red-700',
};

export default function AdminUsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<any>({ total: 0, totalPages: 1 });
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const LIMIT = 15;

    const fetchUsers = useCallback(async (p = page) => {
        setLoading(true);
        try {
            const res = await api.admin.getUsers(p, LIMIT);
            setUsers(res.data || []);
            setMeta(res.meta || { total: 0, totalPages: 1 });
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchUsers(page); }, [page, fetchUsers]);

    const fetchUserDetails = async (user: any) => {
        setSelectedUser(user);
        setIsDetailsModalOpen(true);
        setIsLoadingDetails(true);
        setSelectedUserDetails(null);
        try {
            if (currentUser?.role === 'superadmin') {
                const res = await api.admin.getUserDetails(user.id);
                setSelectedUserDetails(res);
            }
        } catch (err) {
            console.error('Failed to fetch user details', err);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const changeRole = async (userId: string, role: Role) => {
        setActionLoading(userId + '-role');
        try {
            await api.admin.updateUserRole(userId, role);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
        } catch (err: any) {
            alert(err.message || 'Failed to change role');
        } finally {
            setActionLoading(null);
            setOpenMenu(null);
        }
    };

    const toggleStatus = async (userId: string, isActive: boolean) => {
        setActionLoading(userId + '-status');
        try {
            await api.admin.toggleUserStatus(userId, !isActive);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !isActive } : u));
        } catch (err: any) {
            alert(err.message || 'Failed to update status');
        } finally {
            setActionLoading(null);
            setOpenMenu(null);
        }
    };

    const handleScheduleDeletion = async (userId: string) => {
        if (!window.confirm('Are you sure you want to schedule this account for deletion? The user will have 30 days to cancel before their businesses and all related data are permanently removed.')) {
            return;
        }

        setActionLoading(userId + '-schedule');
        try {
            await api.admin.scheduleUserDeletion(userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, deletionScheduledAt: new Date().toISOString() } : u));
            alert('User scheduled for deletion (30 days)');
        } catch (err: any) {
            alert(err.message || 'Failed to schedule deletion');
        } finally {
            setActionLoading(null);
            setOpenMenu(null);
        }
    };

    const handleCancelDeletion = async (userId: string) => {
        setActionLoading(userId + '-cancel');
        try {
            await api.admin.cancelUserDeletion(userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, deletionScheduledAt: null } : u));
            alert('Scheduled deletion cancelled');
        } catch (err: any) {
            alert(err.message || 'Failed to cancel deletion');
        } finally {
            setActionLoading(null);
            setOpenMenu(null);
        }
    };

    const handleHardDelete = async (userId: string) => {
        if (!window.confirm('CRITICAL WARNING: This will PERMANENTLY and IMMEDIATELY delete this user and all their data. This bypasses the 30-day grace period. Continue?')) {
            return;
        }

        setActionLoading(userId + '-delete');
        try {
            await api.admin.deleteUser(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
            alert('User PERMANENTLY deleted');
        } catch (err: any) {
            alert(err.message || 'Failed to delete user');
        } finally {
            setActionLoading(null);
            setOpenMenu(null);
        }
    };

    // Client-side filtering
    const filtered = users.filter(u => {
        const matchesSearch = !search || [u.fullName, u.email, u.city, u.country]
            .some(v => v?.toLowerCase().includes(search.toLowerCase()));
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        const matchesStatus = statusFilter === 'all'
            || (statusFilter === 'active' ? u.isActive : !u.isActive);
        return matchesSearch && matchesRole && matchesStatus;
    });

    const roleCounts: Record<string, number> = { all: users.length };
    users.forEach(u => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1; });

    return (
        <div className="space-y-8 pb-20" onClick={() => setOpenMenu(null)}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
                    <p className="text-slate-400 font-medium mt-1">
                        {meta.total} total users — manage roles, permissions, and accounts.
                    </p>
                </div>
                <button
                    onClick={() => fetchUsers(page)}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-slate-600 transition-all"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Overview mini-stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['all', 'user', 'vendor'] as const).map((r) => {
                    const cfg = r === 'all'
                        ? { label: 'All Users', cls: 'from-slate-700 to-slate-900', Icon: Users }
                        : { label: ROLE_CONFIG[r].label + 's', cls: ROLE_COLORS[r], Icon: ROLE_CONFIG[r].Icon };
                    return (
                        <button
                            key={r}
                            onClick={() => setRoleFilter(r as any)}
                            className={`group rounded-3xl p-5 text-left transition-all border-2 ${roleFilter === r
                                ? 'border-slate-900 bg-slate-900 text-white '
                                : 'border-transparent bg-white hover:border-slate-200 text-slate-700 shadow-sm'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${cfg.cls} flex items-center justify-center mb-3 shadow-md`}>
                                <cfg.Icon className="w-5 h-5 text-white" />
                            </div>
                            <p className={`text-2xl font-black mb-0.5 ${roleFilter === r ? 'text-white' : 'text-slate-900'}`}>
                                {roleCounts[r] ?? 0}
                            </p>
                            <p className={`text-xs font-bold uppercase tracking-widest ${roleFilter === r ? 'text-white/60' : 'text-slate-400'}`}>
                                {cfg.label}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* Search + Status filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, city..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-slate-400 text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'active', 'inactive'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-4 py-3 rounded-2xl font-bold text-sm transition-all border capitalize ${statusFilter === s
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
                    <Users className="w-12 h-12 opacity-20" />
                    <p className="font-black uppercase tracking-widest text-sm">No users found</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm relative">
                    {/* Table Header */}
                    <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-4 border-b border-slate-50 bg-slate-50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">User</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</p>
                    </div>

                    <AnimatePresence>
                        {filtered.map((user, idx) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: idx * 0.02 }}
                                className={`grid md:grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 items-center px-6 py-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors ${openMenu === user.id ? 'relative z-50' : ''}`}
                            >
                                {/* User Info */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${ROLE_COLORS[user.role] || ROLE_COLORS.user} flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden`}>
                                        {user.avatarUrl ? (
                                            <img src={getImageUrl(user.avatarUrl) || ''} alt={user.fullName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white font-black text-sm">{getInitials(user.fullName)}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-slate-900 text-sm truncate">{user.fullName || '—'}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <ProviderBadge provider={user.provider} />
                                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(user.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <Mail className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                                    <span className="text-sm text-slate-600 font-medium truncate">{user.email}</span>
                                </div>

                                {/* Role */}
                                <div>
                                    <RolePill role={user.role} />
                                </div>

                                {/* Status */}
                                <div className="flex flex-col gap-1">
                                    <StatusBadge active={user.isActive} />
                                    {user.deletionScheduledAt && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border bg-rose-50 text-rose-700 border-rose-200">
                                            <AlertTriangle className="w-2.5 h-2.5" /> Pending Deletion
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                {user.role !== 'superadmin' && (
                                    <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                        <div className="relative flex-shrink-0">
                                            <button
                                                onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-900"
                                            >
                                                <MoreVertical className="w-5 h-5" />
                                            </button>

                                            <AnimatePresence>
                                                {openMenu === user.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                        className="absolute right-0 top-11 z-50 bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100 py-2 w-52 overflow-hidden"
                                                    >
                                                        <button
                                                            onClick={() => { fetchUserDetails(user); setOpenMenu(null); }}
                                                            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50"
                                                        >
                                                            <Eye className="w-4 h-4 text-slate-400" />
                                                            View Full Details
                                                        </button>

                                                        <button
                                                            onClick={() => { toggleStatus(user.id, user.isActive); setOpenMenu(null); }}
                                                            className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-bold transition-colors border-b border-slate-50 ${user.isActive ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'
                                                                }`}
                                                        >
                                                            {user.isActive ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                                            {user.isActive ? 'Block User' : 'Unblock User'}
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400 font-medium">
                        Page {page} of {meta.totalPages} · {meta.total} users
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-sm hover:border-slate-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" /> Prev
                        </button>
                        {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                            const p = Math.max(1, Math.min(meta.totalPages - 4, page - 2)) + i;
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-10 h-10 rounded-xl font-black text-sm transition-all border ${page === p
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                                        }`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                        <button
                            disabled={page === meta.totalPages}
                            onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                            className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-sm hover:border-slate-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
            {/* User Details Modal */}
            <AnimatePresence>
                {isDetailsModalOpen && selectedUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDetailsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
                        >
                            {/* Modal Header */}
                            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">User Profile</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Account Identification: {selectedUser.id.slice(0, 8)}...</p>
                                </div>
                                <button
                                    onClick={() => setIsDetailsModalOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="px-8 py-8 space-y-8 max-h-[70vh] overflow-y-auto">
                                <div className="flex items-center gap-8">
                                    <div className={`w-28 h-28 rounded-[2rem] bg-gradient-to-br ${ROLE_COLORS[selectedUser.role] || ROLE_COLORS.user} flex items-center justify-center shadow-xl overflow-hidden ring-4 ring-slate-50`}>
                                        {selectedUser.avatarUrl ? (
                                            <img src={getImageUrl(selectedUser.avatarUrl) || ''} alt={selectedUser.fullName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white font-black text-4xl">{getInitials(selectedUser.fullName)}</span>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{selectedUser.fullName || '—'}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <RolePill role={selectedUser.role} />
                                            <StatusBadge active={selectedUser.isActive} />
                                            {selectedUserDetails?.vendor?.isVerified && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                    <BadgeCheck className="w-3.5 h-3.5" /> Trusted Business
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {isLoadingDetails ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                                        <p className="text-sm font-bold text-slate-400 animate-pulse">Fetching complete data vault...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {/* Core Stats if Superadmin */}
                                        {selectedUserDetails?.stats && (
                                            <div className="grid grid-cols-4 gap-4">
                                                {[
                                                    { label: 'Revenue', val: `Rs ${selectedUserDetails.stats.totalSpent}`, icon: Banknote, color: 'text-emerald-600' },
                                                    { label: 'Businesses', val: selectedUserDetails.stats.businessCount, icon: Building2, color: 'text-blue-600' },
                                                    { label: 'Reviews', val: selectedUserDetails.stats.reviewCount, icon: Star, color: 'text-amber-500' },
                                                    { label: 'Leads', val: selectedUserDetails.stats.leadCount, icon: Zap, color: 'text-indigo-600' }
                                                ].map((s, i) => (
                                                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                                        <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
                                                        <div className="text-lg font-black text-slate-900">{s.val}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                    <Mail className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Email Address</span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-700 break-all">{selectedUser.email}</p>
                                            </div>
                                            <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                    <Phone className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Phone Number</span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-700">{selectedUser.phone || 'Not Provided'}</p>
                                            </div>
                                            <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Joined On</span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-700">{formatDate(selectedUser.createdAt)}</p>
                                            </div>
                                            <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                    <KeyRound className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Auth Provider</span>
                                                </div>
                                                <div className="pt-1">
                                                    <ProviderBadge provider={selectedUser.provider} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Business Profile Section */}
                                        {selectedUserDetails?.vendor && (
                                            <div className="space-y-4">
                                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-blue-500 pl-3">Business Profile</h4>
                                                <div className="grid grid-cols-2 gap-6 p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Business Name</span>
                                                        <p className="text-sm font-black text-slate-900">{selectedUserDetails.vendor.businessName || '—'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Stripe Customer ID</span>
                                                        <p className="text-xs font-mono font-bold text-slate-600">{selectedUserDetails.vendor.stripeCustomerId || '—'}</p>
                                                    </div>
                                                    <div className="col-span-2 space-y-1 border-t border-blue-100/50 pt-4">
                                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Bio / Description</span>
                                                        <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                                                            "{selectedUserDetails.vendor.bio || 'No business description provided yet.'}"
                                                        </p>
                                                    </div>
                                                    {selectedUserDetails.vendor.gstNumber && (
                                                        <div className="space-y-1 pt-2">
                                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">GST Number</span>
                                                            <p className="text-sm font-black text-slate-900">{selectedUserDetails.vendor.gstNumber}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Location */}
                                        {(selectedUser.city || selectedUser.country || selectedUserDetails?.vendor?.businessAddress) && (
                                            <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0">
                                                        <MapPin className="w-6 h-6" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Contact & Location</h4>
                                                        <p className="text-sm font-bold leading-relaxed">{selectedUserDetails?.vendor?.businessAddress || 'No official business address'}</p>
                                                        <p className="text-xs font-black text-indigo-400 flex items-center gap-2">
                                                            {selectedUser.city && <>{selectedUser.city},</>} {selectedUser.state && <>{selectedUser.state},</>} {selectedUser.country || 'Not Specified'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Business Setup Intelligence */}
                            {(selectedUserDetails as any)?.setupData && (
                                <div className="px-8 pb-8 space-y-6">
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Business Setup Intelligence</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Amenities + Service + Payments (Doc3 merged) */}
                                        <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                                    <Zap className="w-4 h-4" />
                                                </div>
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Amenities & Facilities</span>
                                            </div>
                                            <div className="space-y-2">
                                                {Array.from(new Set([
                                                    ...((selectedUserDetails as any).setupData['Amenities & Facilities'] || []),
                                                    ...((selectedUserDetails as any).setupData['Business Features'] || []),
                                                    ...((selectedUserDetails as any).setupData['Service Mode'] || (selectedUserDetails as any).setupData['srv-1'] || []),
                                                    ...((selectedUserDetails as any).setupData['Payment Methods'] || (selectedUserDetails as any).setupData['pay-1'] || []),
                                                ])).map((val: string) => (
                                                    <div key={val} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                                        <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                                                        {val}
                                                    </div>
                                                )) || <p className="text-[10px] font-bold text-slate-400 italic">Not set</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Modal Footer */}
                            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Clearance: {currentUser?.role}</p>
                                <button
                                    onClick={() => setIsDetailsModalOpen(false)}
                                    className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-2xl transition-all shadow-lg active:scale-95"
                                >
                                    Dismiss Detailed View
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
