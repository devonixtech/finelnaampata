"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { MessageCircle } from 'lucide-react';
import ChatWindow from './ChatWindow';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export interface ChatTriggerHandle {
    open: () => void;
}

interface ChatTriggerProps {
    businessId: string;
    businessName: string;
    variant?: 'button' | 'icon';
    className?: string;
}

const ChatTrigger = forwardRef<ChatTriggerHandle, ChatTriggerProps>(({ businessId, businessName, variant = 'button', className = '' }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [vendorHasChat, setVendorHasChat] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;
        api.listings.getById(businessId)
            .then((b: any) => {
                if (!cancelled) {
                    setVendorHasChat(!!b?.planFeatures?.showChat);
                }
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [businessId]);

    useImperativeHandle(ref, () => ({
        open: () => {
            if (!user) {
                router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                return;
            }
            if (!vendorHasChat) {
                console.warn('In-App Chat requires a paid plan. Upgrade to access this feature.');
                return;
            }
            setIsOpen(true);
        }
    }));

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!user) {
            router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
            return;
        }
        
        if (!vendorHasChat) {
            console.warn('In-App Chat requires a paid plan. Upgrade to access this feature.');
            return;
        }
        
        setIsOpen(!isOpen);
    };

    return (
        <>
            {variant === 'button' ? (
                <button
                    onClick={handleToggle}
                    className={`flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold transition-all active:scale-95 ${className}`}
                >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat</span>
                </button>
            ) : (
                <button
                    onClick={handleToggle}
                    className={`p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md transition-all text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary active:scale-95 ${className}`}
                    title="Live Chat"
                >
                    <MessageCircle className="w-5 h-5" />
                </button>
            )}

            <ChatWindow
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                businessId={businessId}
                businessName={businessName}
            />
        </>
    );
});

ChatTrigger.displayName = 'ChatTrigger';

export default ChatTrigger;
