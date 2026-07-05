"use client";

import React, { useState, useEffect } from 'react';
import {
    Settings, Save, Globe, Info, Mail, Phone,
    Share2, Facebook, Twitter, Instagram, Linkedin,
    Shield, Bell, Database, RefreshCw, Loader2,
    CheckCircle2, AlertCircle, Zap
} from 'lucide-react';
import { api } from '../../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';

export default function AdminSettingsPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<Record<string, string>>({
        site_name: 'Local Directory',
        site_description: 'Discover the best local businesses in your city.',
        contact_email: '',
        contact_phone: '',
        address: '',
        fb_url: '',
        tw_url: '',
        ig_url: '',
        li_url: '',
        auto_approve_reviews: 'true',
        auto_approve_broadcasts: 'false',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'social' | 'approvals'>('general');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await api.admin.getSettings();
            if (Object.keys(data).length > 0) {
                setSettings(prev => ({ ...prev, ...data }));
            }
        } catch (err) {
            console.error('Failed to fetch settings', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await api.admin.updateSettings(settings);
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update settings' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
            </div>
        );
    }

    const tabs = [
        { id: 'general', name: 'General', icon: Globe },
        { id: 'contact', name: 'Contact Info', icon: Mail },
        { id: 'social', name: 'Social Links', icon: Share2 },
        { id: 'approvals', name: 'Auto-Approvals', icon: Zap },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Settings</h1>
                    <p className="text-slate-400 font-bold mt-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-500" />
                        Global configurations for the entire platform.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="group relative px-8 py-4 bg-slate-900 hover:bg-black text-white rounded-[10px] font-black text-sm flex items-center gap-3 shadow-2xl shadow-slate-900/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Save All Changes
                        </>
                    )}
                </button>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-3xl flex items-center gap-3 font-bold text-sm ${message.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-red-50 text-red-700 border border-red-100'
                        }`}
                >
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-[16px] transition-all group ${activeTab === tab.id
                                ? 'bg-white text-slate-900  shadow-slate-200/50 translate-x-1 font-black'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 font-bold'
                                }`}
                        >
                            <tab.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-red-500' : ''}`} />
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* Settings Panel */}
                <div className="lg:col-span-3">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-[16px] p-10  shadow-slate-200/40 border border-slate-50"
                    >
                        <form onSubmit={handleSave} className="space-y-8">
                            {activeTab === 'general' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                                            <Globe className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900">General Information</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Site Name</label>
                                            <input
                                                type="text"
                                                value={settings.site_name}
                                                onChange={e => handleChange('site_name', e.target.value)}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-200 font-bold text-slate-900 transition-all"
                                                placeholder="e.g. Local Business Directory"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Meta Description</label>
                                            <textarea
                                                rows={4}
                                                value={settings.site_description}
                                                onChange={e => handleChange('site_description', e.target.value)}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-200 font-bold text-slate-900 transition-all resize-none"
                                                placeholder="Describe your platform for SEO..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'contact' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                                            <Mail className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900">Contact Details</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Support Email</label>
                                            <input
                                                type="email"
                                                value={settings.contact_email}
                                                onChange={e => handleChange('contact_email', e.target.value)}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-200 font-bold text-slate-900 transition-all"
                                                placeholder="support@example.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Support Phone</label>
                                            <input
                                                type="text"
                                                value={settings.contact_phone}
                                                onChange={e => handleChange('contact_phone', e.target.value)}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-200 font-bold text-slate-900 transition-all"
                                                placeholder="+1 234 567 890"
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Physical Address</label>
                                            <input
                                                type="text"
                                                value={settings.address}
                                                onChange={e => handleChange('address', e.target.value)}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-200 font-bold text-slate-900 transition-all"
                                                placeholder="123 Business Way, City, Country"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'social' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                                            <Share2 className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900">Social Presence</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[
                                            { key: 'fb_url', icon: Facebook, color: 'text-blue-600', label: 'Facebook URL' },
                                            { key: 'tw_url', icon: Twitter, color: 'text-sky-400', label: 'Twitter / X URL' },
                                            { key: 'ig_url', icon: Instagram, color: 'text-pink-600', label: 'Instagram URL' },
                                            { key: 'li_url', icon: Linkedin, color: 'text-blue-700', label: 'LinkedIn URL' },
                                        ].map(item => (
                                            <div key={item.key} className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                                    <item.icon className={`w-3 h-3 ${item.color}`} /> {item.label}
                                                </label>
                                                <input
                                                    type="url"
                                                    value={settings[item.key]}
                                                    onChange={e => handleChange(item.key, e.target.value)}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-200 font-bold text-slate-900 transition-all"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'approvals' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center">
                                            <Zap className="w-5 h-5 text-violet-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900">Auto-Approval Rules</h3>
                                            <p className="text-xs text-slate-400 font-bold mt-1">Control whether new content is published instantly or held for manual review.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {[
                                            {
                                                key: 'auto_approve_reviews',
                                                title: 'Customer Reviews',
                                                description: 'When ON, new reviews appear on business profiles right away. When OFF, reviews wait for admin moderation.',
                                                badge: 'On by default',
                                            },
                                            {
                                                key: 'auto_approve_broadcasts',
                                                title: 'Customer Broadcasts',
                                                description: 'When ON, customer broadcast requests are sent to all matching businesses instantly. When OFF, broadcasts are queued for admin review first.',
                                                badge: 'Manual review recommended',
                                            },
                                        ].map(item => {
                                            const isOn = (settings[item.key] || 'false') === 'true';
                                            return (
                                                <div key={item.key} className="p-6 bg-slate-50/60 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-black text-slate-900 text-sm">{item.title}</h4>
                                                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full ${isOn ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                {isOn ? 'Auto-Approved' : 'Manual Review'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.description}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleChange(item.key, isOn ? 'false' : 'true')}
                                                        className={`relative w-16 h-9 rounded-full transition-all flex-shrink-0 ${isOn ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                        aria-label={`Toggle ${item.title}`}
                                                    >
                                                        <span className={`absolute top-1 left-1 w-7 h-7 bg-white rounded-full shadow-md transition-transform ${isOn ? 'translate-x-7' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-start gap-3">
                                        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-blue-700 font-semibold leading-relaxed">
                                            Listing publishing is automatic now. These controls only affect review and broadcast moderation that still remains on the platform.
                                        </p>
                                    </div>
                                </div>
                            )}


                            <div className="pt-10 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-12 py-5 bg-slate-900 hover:bg-black text-white rounded-[10px] font-black text-sm shadow-2xl shadow-slate-900/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
