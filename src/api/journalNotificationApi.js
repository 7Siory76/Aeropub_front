import api from './client';

export const journalNotificationApi = {
    // Récupérer les notifications avec filtre optionnel
    getAll: (categorie = null, nonLu = false) => {
        const params = new URLSearchParams();
        if (categorie && categorie !== 'TOUTES') params.append('categorie', categorie);
        if (nonLu) params.append('nonLu', 'true');
        return api.get(`/notifications?${params.toString()}`).then(res => res.data);
    },

    getUnreadCount: () => api.get('/notifications/unread-count').then(res => res.data.unreadCount),

    markAsRead: (id) => api.put(`/notifications/${id}/read`).then(res => res.data.data),

    markAllAsRead: () => api.put('/notifications/mark-all-read').then(res => res.data)

};