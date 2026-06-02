"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../services/chat.service';
import { resolveApiOrigin, resolveSocketOrigin } from '../lib/runtime-url';

const getSocketUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL ||
        resolveApiOrigin(process.env.NEXT_PUBLIC_API_URL) ||
        resolveApiOrigin(process.env.NEXT_PUBLIC_API_BASE_URL);

    return resolveSocketOrigin(envUrl);
};

const SOCKET_URL = getSocketUrl().replace(/\/+$/, '');

let sharedSocket: Socket | null = null;
let currentToken: string | null = null;

function getSocket(token: string): Socket {
    // If we have a socket but the token has changed, disconnect it
    if (sharedSocket && currentToken !== token) {
        console.log('[useChat] Token changed, reconnecting socket...');
        sharedSocket.disconnect();
        sharedSocket = null;
    }

    if (!sharedSocket) {
        currentToken = token;
        
        // Normalize the socket base URL so namespace connections resolve consistently.
        const cleanUrl = SOCKET_URL.endsWith('/') ? SOCKET_URL.slice(0, -1) : SOCKET_URL;
        
        console.log(`[useChat] Connecting to socket at: ${cleanUrl}/chat`);
        
        sharedSocket = io(`${cleanUrl}/chat`, {
            auth: { token: `Bearer ${token}` },
            // Prefer polling first to avoid flaky websocket/CORS handshakes on some setups.
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            withCredentials: true,
            forceNew: false, // Ensure we reuse the connection
        });

        sharedSocket.on('connect', () => {
            console.log('[useChat] Socket connection established successfully');
        });

        sharedSocket.on('connect_error', (err) => {
            console.error('[useChat] Socket connection error:', err.message);
        });
    } else if (!sharedSocket.connected && !sharedSocket.active) {
        console.log('[useChat] Reconnecting existing chat socket...');
        sharedSocket.connect();
    }

    return sharedSocket;
}

export function useChat(conversationId?: string) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    // Initialize socket and join appropriate rooms
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !user) return;

        const socket = getSocket(token);
        socketRef.current = socket;

        const onConnect = () => {
            console.log('[useChat] Connected to socket as:', user.email);

            // Join the specific conversation room
            if (conversationId) {
                console.log('[useChat] Joining conversation room:', conversationId);
                socket.emit('joinRoom', { conversationId });
            }

            // ALWAYS join personal user room for general notifications/updates
            console.log('[useChat] Joining personal user room');
            socket.emit('joinUserRoom');

            // Also join vendor room if applicable
            if (user.role === 'vendor' && user.vendor?.id) {
                console.log('[useChat] Joining vendor room:', user.vendor.id);
                socket.emit('joinVendorRoom', { vendorId: user.vendor.id });
            }
        };

        socket.on('connect', onConnect);

        // If already connected, join rooms immediately
        if (socket.connected) {
            onConnect();
        }

        return () => {
            socket.off('connect', onConnect);
        };
    }, [conversationId, user]);

    // Listen to messages for this conversation
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !user) return;

        const socket = getSocket(token);

        const onNewMessage = (message: any) => {
            if (message.conversationId === conversationId) {
                setMessages(prev => {
                    if (prev.some(existing => existing.id === message.id)) {
                        return prev;
                    }

                    const optimisticIdx = prev.findIndex(existing =>
                        existing.isOptimistic &&
                        existing.conversationId === message.conversationId &&
                        existing.senderId === message.senderId &&
                        existing.content.trim() === message.content.trim()
                    );

                    if (optimisticIdx > -1) {
                        const next = [...prev];
                        next[optimisticIdx] = message;
                        return next;
                    }

                    return [...prev, message];
                });
                setIsTyping(false);
                // Mark as read immediately if the conversation is active
                if (conversationId) {
                    chatApi.markAsRead(conversationId).catch(() => { });
                }
            }
        };

        const onUserTyping = (data: any) => {
            if (data.conversationId === conversationId && data.userId !== user.id) {
                setIsTyping(true);
                setTimeout(() => setIsTyping(false), 3000);
            }
        };

        socket.on('newMessage', onNewMessage);
        socket.on('userTyping', onUserTyping);

        socket.on('error', (err: any) => {
            console.error('[useChat] Socket error:', err);
        });

        return () => {
            socket.off('newMessage', onNewMessage);
            socket.off('userTyping', onUserTyping);
        };
    }, [conversationId, user]);

    // Fetch message history when conversation opens
    useEffect(() => {
        if (!conversationId) return;

        const fetchHistory = async () => {
            setIsLoading(true);
            try {
                const history = await chatApi.getMessages(conversationId) as any[];
                // Merge history with existing messages (like optimistic ones)
                setMessages(prev => {
                    // Filter out any messages from prev that are already in history (by ID or content match for optimistic)
                    const filteredPrev = prev.filter(m => {
                        const isInHistory = history.some(h => h.id === m.id);
                        if (isInHistory) return false;
                        
                        // Also check for optimistic matches that might have arrived as real messages in history
                        if (m.isOptimistic) {
                            return !history.some(h => h.content === m.content && h.senderId === m.senderId);
                        }
                        return true;
                    });
                    return [...history, ...filteredPrev];
                });
                // Mark conversation as read
                await chatApi.markAsRead(conversationId).catch(() => { });
            } catch (error) {
                console.error('[useChat] Failed to fetch history:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [conversationId]);

    const sendMessage = useCallback(async (content: string) => {
        const trimmedContent = content.trim();
        if (!socketRef.current || !conversationId || !trimmedContent || !user) return;

        const tempId = `temp-${Date.now()}`;
        const optimisticMessage = {
            id: tempId,
            conversationId,
            senderId: user.id,
            content: trimmedContent,
            createdAt: new Date().toISOString(),
            isOptimistic: true,
        };

        // Optimistically add message
        setMessages(prev => [...prev, optimisticMessage]);

        socketRef.current.emit(
            'sendMessage',
            {
                conversationId,
                content: trimmedContent,
            },
            (response?: { status?: string; message?: any }) => {
                if (response?.status !== 'success' || !response.message) return;

                setMessages(prev => prev.map(message =>
                    message.id === tempId ? response.message : message
                ));
            }
        );
    }, [conversationId, user]);

    const sendTyping = useCallback(() => {
        if (!socketRef.current || !conversationId) return;
        socketRef.current.emit('typing', { conversationId });
    }, [conversationId]);

    return {
        messages: messages.reduce((acc: any[], current) => {
            // Find if a version of this message already exists in acc
            const duplicateIdx = acc.findIndex(m => {
                // Exact ID match (both real or both identical temp)
                if (m.id === current.id) return true;

                // Content match between optimistic and real
                const isOp1 = !!m.isOptimistic;
                const isOp2 = !!current.isOptimistic;
                if (isOp1 !== isOp2 && m.content === current.content) {
                    // Check timestamp proximity to be safe (within 10 seconds)
                    const mTime = new Date(m.createdAt).getTime();
                    const cTime = new Date(current.createdAt).getTime();
                    if (Math.abs(mTime - cTime) < 10000) return true;
                }
                return false;
            });

            if (duplicateIdx > -1) {
                // If the new one is real and the existing one is optimistic, replace it
                if (!current.isOptimistic && acc[duplicateIdx].isOptimistic) {
                    acc[duplicateIdx] = current;
                }
                // Otherwise, keep the one already in acc
            } else {
                acc.push(current);
            }
            return acc;
        }, []),
        isLoading,
        isTyping,
        sendMessage,
        sendTyping,
        socket: socketRef.current,
    };
}

/**
 * Lightweight hook to get the shared chat socket for listening to
 * real-time conversation list events (newConversation, conversationUpdated).
 */
export function useChatSocket() {
    const { user } = useAuth();
    const socketRef = useRef<Socket | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !user) return;

        const socket = getSocket(token);
        socketRef.current = socket;

        const onConnect = () => {
            setReady(true);
            console.log('[useChatSocket] Socket connected, joining personal rooms');
            
            // Always join user room
            socket.emit('joinUserRoom');
            
            if (user.role === 'vendor' && user.vendor?.id) {
                socket.emit('joinVendorRoom', { vendorId: user.vendor.id });
            }
        };

        socket.on('connect', onConnect);
        if (socket.connected) onConnect();

        return () => {
            socket.off('connect', onConnect);
        };
    }, [user]);

    return { socket: socketRef.current, ready };
}
