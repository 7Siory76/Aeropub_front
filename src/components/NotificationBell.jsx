import React, { useState, useEffect, useRef } from 'react';
import {
    Bell, CheckCheck, PlusCircle, Edit, Trash2,
    RefreshCw, Layers, Check, Loader2
} from 'lucide-react';
import { journalNotificationApi } from '../api';
import './NotificationBell.css';

const CATEGORIES = [
    { id: 'TOUTES', label: 'Toutes' },
    { id: 'CREATION', label: 'Création', color: '#10b981' },
    { id: 'MODIFICATION', label: 'Modification', color: '#06b6d4' },
    { id: 'SUPPRESSION', label: 'Suppression', color: '#ef4444' },
    { id: 'STATUT', label: 'Statuts', color: '#8b5cf6' },
    { id: 'ECHEANCE', label: 'Échéance', color: '#dc5cf6ff' },
    { id: 'EMAIL_ECHEANCE', label: 'Échéance courriel', color: '#dc5cf6ff' }
];

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState('TOUTES');
    const [loading, setLoading] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);
    const [markingId, setMarkingId] = useState(null);
    const dropdownRef = useRef(null);

    // Charge les notifications
    const loadNotifications = async () => {
        setLoading(true);
        try {
            const reponseNotifications = await journalNotificationApi.getAll(selectedCategory);
            setNotifications(reponseNotifications.data || []);
            setUnreadCount(reponseNotifications.unreadCount || 0);
        } catch {
            // Échec silencieux lors du rafraîchissement
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

    // Ferme le panneau en cliquant à l'extérieur
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
            setMarkingId(id);
            await journalNotificationApi.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu_par_admin: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {
            // Erreur ignorée
        } finally {
            setMarkingId(null);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            setMarkingAll(true);
            await journalNotificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, lu_par_admin: true })));
            setUnreadCount(0);
        } catch {
            // Erreur ignorée
        } finally {
            setMarkingAll(false);
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

    // Formate la date en format relatif
    const formatTime = (dStr) => {
        if (!dStr) return '';
        const date = new Date(dStr);
        const now = new Date();
        const diffMin = Math.floor((now - date) / (1000 * 60));
        if (diffMin < 1) return "À l'instant";
        if (diffMin < 60) return `Il y a ${diffMin} min`;
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours < 24) return `Il y a ${diffHours} h`;
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="notification-wrapper" ref={dropdownRef}>
            {/* Bouton cloche */}
            <button
                type="button"
                className={`notification-bell-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Journal des actions et notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="notification-badge-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Menu déroulant */}
            {isOpen && (
                <div className="notification-dropdown">
                    {/* En-tête */}
                    <div className="notification-header">
                        <div className="notification-title">
                            <strong>Journal des actions</strong>
                            {unreadCount > 0 && (
                                <span className="unread-counter">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                className="btn-mark-all"
                                onClick={handleMarkAllAsRead}
                                disabled={markingAll}
                                title="Tout marquer comme lu"
                            >
                                {markingAll ? <Loader2 size={13} className="btn-spinner" /> : <CheckCheck size={14} />}
                                <span>{markingAll ? 'Traitement...' : 'Tout marquer comme lu'}</span>
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
                                            disabled={markingId === n.id}
                                            onClick={(e) => handleMarkAsRead(n.id, e)}
                                        >
                                            {markingId === n.id ? <Loader2 size={13} className="btn-spinner" /> : <Check size={13} />}
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
