"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { resolveApiOrigin, resolveSocketOrigin } from '../lib/runtime-url';

const SOCKET_URL = resolveSocketOrigin(
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    resolveApiOrigin(process.env.NEXT_PUBLIC_API_URL) ||
    resolveApiOrigin(process.env.NEXT_PUBLIC_API_BASE_URL)
);

let notificationSocket: Socket | null = null;
let currentToken: string | null = null;

export function useNotifications() {
    const { user } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !user) return;

        // Singleton pattern for notification socket
        if (notificationSocket && currentToken !== token) {
            notificationSocket.disconnect();
            notificationSocket = null;
        }

        if (!notificationSocket || !notificationSocket.connected) {
            currentToken = token;
            notificationSocket = io(`${SOCKET_URL}/notifications`, {
                auth: { token: `Bearer ${token}` },
                transports: ['polling', 'websocket'],
            });

            notificationSocket.on('connect', () => {
                console.log('[useNotifications] Connected, authenticating...');
                notificationSocket?.emit('authenticate');
            });

            notificationSocket.on('userOnline', ({ userId }) => {
                setOnlineUsers(prev => new Set(prev).add(userId));
            });

            notificationSocket.on('userOffline', ({ userId }) => {
                setOnlineUsers(prev => {
                    const next = new Set(prev);
                    next.delete(userId);
                    return next;
                });
            });
        }

        socketRef.current = notificationSocket;

        return () => {
            // We don't disconnect the singleton, just remove listeners if needed
            // but for online status, we might want to keep them global
        };
    }, [user]);

    return {
        socket: socketRef.current,
        onlineUsers,
        isUserOnline: (userId: string) => onlineUsers.has(userId)
    };
}
