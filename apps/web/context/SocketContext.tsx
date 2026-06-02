"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { api } from '@/lib/api';
import { resolveApiOrigin, resolveSocketOrigin } from '@/lib/runtime-url';

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
    notifications: any[];
    unreadCount: number;
    unreadChatCount: number;
    newEnquiryCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    refreshCounts: () => Promise<void>;
    markChatAsRead: (id: string) => Promise<void>;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    connected: false,
    notifications: [],
    unreadCount: 0,
    unreadChatCount: 0,
    newEnquiryCount: 0,
    markAsRead: async () => {},
    markAllAsRead: async () => {},
    deleteNotification: async () => {},
    refreshCounts: async () => {},
    markChatAsRead: async () => {},
});

const envSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ||
    resolveApiOrigin(process.env.NEXT_PUBLIC_API_URL) ||
    resolveApiOrigin(process.env.NEXT_PUBLIC_API_BASE_URL);

const SOCKET_URL = resolveSocketOrigin(envSocketUrl).replace(/\/+$/, '');

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, syncProfile } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [newEnquiryCount, setNewEnquiryCount] = useState(0);

    const fetchCounts = async () => {
        if (!user) return;
        try {
            const [notifRes, chatRes, leadStats] = await Promise.all([
                api.notifications.getAll() as any,
                api.get('/chat/unread-count') as any,
                (user.role === 'vendor') 
                    ? api.leads.getStats().catch(() => ({ new: 0 }))
                    : Promise.resolve({ new: 0 })
            ]);
            setNotifications(notifRes.notifications || []);
            setUnreadCount(notifRes.unreadCount || 0);
            setUnreadChatCount(chatRes.count || 0);
            setNewEnquiryCount(leadStats?.new || 0);
        } catch (err) {
            console.error('[SocketContext] Failed to fetch counts:', err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchCounts();
        } else {
            setNotifications([]);
            setUnreadCount(0);
            setUnreadChatCount(0);
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setConnected(false);
            }
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        const cleanUrl = SOCKET_URL.endsWith('/') ? SOCKET_URL.slice(0, -1) : SOCKET_URL;
        const newSocket = io(`${cleanUrl}/notifications`, {
            auth: { token: `Bearer ${token}` },
            transports: ['polling', 'websocket'],
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            withCredentials: true,
        });

        newSocket.on('connect', () => {
            setConnected(true);
            newSocket.emit('authenticate');
        });

        // Real-time notification listener
        newSocket.on('notification', (notif: any) => {
            console.log('[SocketContext] New notification received:', notif);
            setNotifications(prev => [notif, ...prev].slice(0, 50));
            setUnreadCount(prev => prev + 1);
            
            if (notif.type === 'CHAT_MESSAGE') {
                setUnreadChatCount(prev => prev + 1);
            }
        });

        // Real-time subscription sync
        newSocket.on('subscription_updated', async (data: any) => {
            console.log('[SocketContext] Real-time subscription update received');
            try {
                await syncProfile();
            } catch (err) {
                console.error('[SocketContext] Profile sync failed:', err);
            }
        });

        newSocket.on('disconnect', () => setConnected(false));
        newSocket.on('connect_error', () => setConnected(false));

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user, syncProfile]);

    const markAsRead = async (id: string) => {
        try {
            await api.notifications.markRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.notifications.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const notif = notifications.find(n => n.id === id);
            await api.notifications.delete(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (notif && !notif.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    };

    const markChatAsRead = async (conversationId: string) => {
        try {
            await api.post(`/chat/conversations/${conversationId}/read`, {});
            // Refresh counts to be sure we have the latest from server
            await fetchCounts();
        } catch (err) {
            console.error('Failed to mark chat as read:', err);
        }
    };

    return (
        <SocketContext.Provider value={{ 
            socket, 
            connected, 
            notifications, 
            unreadCount, 
            unreadChatCount,
            newEnquiryCount,
            markAsRead, 
            markAllAsRead, 
            deleteNotification,
            refreshCounts: fetchCounts,
            markChatAsRead
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
