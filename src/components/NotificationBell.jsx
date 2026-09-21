import React, { useState, useEffect, useRef } from 'react';
import {
    Bell, CheckCheck, PlusCircle, Edit, Trash2,
    RefreshCw, Layers, FileText, Check
} from 'lucide-react';
import { journalNotificationApi } from '../api';
import './NotificationBell.css';

const CATEGORIES = [
    { id: 'TOUTES', label: 'Toutes' },
    { id: 'CREATION', label: 'Création', color: '#10b981' },
    { id: 'MODIFICATION', label: 'Modif', color: '#06b6d4' },
    { id: 'SUPPRESSION', label: 'Suppression', color: '#ef4444' },
    { id: 'STATUT', label: 'Statuts', color: '#8b5cf6' }
];

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState('TOUTES');
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Charger les notifications
    const loadNotifications = async () => {
        setLoading(true);
        try {
            const res = await journalNotificationApi.getAll(selectedCategory);
            setNotifications(res.data || []);
            setUnreadCount(res.unreadCount || 0);
        } catch (err) {
            console.error('Erreur chargement notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
        // Rafraîchissement automatique toutes les 45 secondes
        const interval = setInterval(loadNotifications, 45000);
        return () => clearInterval(interval);
    }, [selectedCategory]);

    // Fermer le panneau quand on clique à l'extérieur
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await journalNotificationApi.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu_par_admin: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await journalNotificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, lu_par_admin: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    // Icône selon la catégorie
    const getCategoryIcon = (cat) => {
        switch (cat) {
            case 'CREATION':
                return <PlusCircle size={15} style={{ color: '#10b981' }} />;
            case 'MODIFICATION':
                return <Edit size={15} style={{ color: '#06b6d4' }} />;
            case 'SUPPRESSION':
                return <Trash2 size={15} style={{ color: '#ef4444' }} />;
            case 'STATUT':
                return <RefreshCw size={15} style={{ color: '#8b5cf6' }} />;
            default:
                return <Layers size={15} style={{ color: '#94a3b8' }} />;
        }
    };

    // Formater la date en relatif (ex: "Il y a 10 min" ou "14/09 10:30")
    const formatTime = (dStr) => {
        if (!dStr) return '';
        const date = new Date(dStr);
        const now = new Date();
        const diffMin = Math.floor((now - date) / (1000 * 60));
        if (diffMin < 1) return "À l'instant";
        if (diffMin < 60) return `Il y a ${diffMin} min`;
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="notification-wrapper" ref={dropdownRef}>
            {/* Bouton Cloche */}
            <button
                type="button"
                className={`notification-bell-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Journal des actions & Notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="notification-badge-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Menu Déroulant */}
            {isOpen && (
                <div className="notification-dropdown">
                    {/* En-tête */}
                    <div className="notification-header">
                        <div className="notification-title">
                            <strong>Journal des Actions</strong>
                            {unreadCount > 0 && (
                                <span className="unread-counter">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                className="btn-mark-all"
                                onClick={handleMarkAllAsRead}
                                title="Tout marquer comme lu"
                            >
                                <CheckCheck size={14} />
                                <span>Tout marquer lu</span>
                            </button>
                        )}
                    </div>

                    {/* Filtres par Catégorie */}
                    <div className="notification-categories">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                className={`cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Liste des Notifications */}
                    <div className="notification-list">
                        {loading ? (
                            <div className="notif-empty">Chargement des notifications...</div>
                        ) : notifications.length === 0 ? (
                            <div className="notif-empty">Aucune action enregistrée dans cette catégorie.</div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`notif-item ${!n.lu_par_admin ? 'unread' : ''}`}
                                >
                                    <div className="notif-icon-col">
                                        {getCategoryIcon(n.categorie_action)}
                                    </div>
                                    <div className="notif-content">
                                        <div className="notif-top">
                                            <span className="notif-entity-tag">
                                                {n.entite_concernee} • {n.reference_entite}
                                            </span>
                                            <span className="notif-time">{formatTime(n.date_action)}</span>
                                        </div>
                                        <p className="notif-message">{n.message_notification}</p>
                                        {n.nom_utilisateur && (
                                            <span className="notif-author">Par : {n.nom_utilisateur}</span>
                                        )}
                                    </div>
                                    {!n.lu_par_admin && (
                                        <button
                                            type="button"
                                            className="btn-mark-one"
                                            title="Marquer comme lu"
                                            onClick={(e) => handleMarkAsRead(n.id, e)}
                                        >
                                            <Check size={13} />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
