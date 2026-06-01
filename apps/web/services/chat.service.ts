import { api } from '../lib/api';

export const chatApi = {
    getOrCreateConversation: async (businessId: string) => {
        return api.post('/chat/conversations', { businessId });
    },
    getUserConversations: async () => {
        return api.get('/chat/conversations/user');
    },
    getBusinessConversations: async () => {
        return api.get('/chat/conversations/business');
    },
    /** @deprecated use getBusinessConversations */
    getVendorConversations: async () => {
        return api.get('/chat/conversations/business');
    },
    getMessages: async (conversationId: string) => {
        return api.get(`/chat/conversations/${conversationId}/messages`);
    },
    getUnreadCount: async () => {
        return api.get('/chat/unread-count');
    },
    markAsRead: async (conversationId: string) => {
        return api.post(`/chat/conversations/${conversationId}/mark-as-read`, {});
    },
    sendMessage: async (conversationId: string, content: string) => {
        return api.post(`/chat/conversations/${conversationId}/messages`, { content, conversationId });
    },
    getNotes: async (conversationId: string) => {
        return api.get(`/chat/conversations/${conversationId}/notes`);
    },
    createNote: async (conversationId: string, content: string) => {
        return api.post(`/chat/conversations/${conversationId}/notes`, { content });
    },
};
