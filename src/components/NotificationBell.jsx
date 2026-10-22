import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Bell, CheckCheck, PlusCircle, Edit, Trash2,
    RefreshCw, Layers, Check, Loader2, Filter,
    ChevronDown, Clock, Mail, FileSpreadsheet,
    ShieldAlert, User, X
} from 'lucide-react';
import { journalNotificationApi } from '../api';
import './NotificationBell.css';

// Métadonnées d'affichage convivial pour les catégories
const CATEGORY_META = {
    'CREATION': { label: 'Création', color: '#10b981', icon: PlusCircle },
    'MODIFICATION': { label: 'Modification', color: '#06b6d4', icon: Edit },
    'SUPPRESSION': { label: 'Suppression', color: '#ef4444', icon: Trash2 },
    'STATUT': { label: 'Statuts & Cycles de vie', color: '#8b5cf6', icon: RefreshCw },
    'ECHEANCE': { label: 'Échéances de contrat', color: '#ec4899', icon: Clock },
    'EMAIL_ECHEANCE': { label: 'Courriels d’échéance', color: '#d946ef', icon: Mail },
    'IMPORT': { label: 'Import de données CSV', color: '#3b82f6', icon: FileSpreadsheet },
    'RENOUVELLEMENT': { label: 'Renouvellement', color: '#14b8a6', icon: RefreshCw },
    'SECURITE': { label: 'Sécurité & Accès', color: '#ef4444', icon: ShieldAlert },
    'SYSTEME': { label: 'Système', color: '#64748b', icon: Layers }
};

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState('TOUTES');
    const [dbCategories, setDbCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);
    const [markingId, setMarkingId] = useState(null);
    const dropdownRef = useRef(null);

    // Charge les catégories distinctes depuis la base de données
    const loadCategories = async () => {
        try {
            const list = await journalNotificationApi.getCategories();
            if (Array.isArray(list)) {
                setDbCategories(list);
            }
        } catch {
            // Échec silencieux
        }
    };

    // Charge les notifications selon la catégorie sélectionnée
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

    // Chargement initial des catégories et notifications
    useEffect(() => {
        loadCategories();
        loadNotifications();
        // Rafraîchissement automatique toutes les 45 secondes
        const interval = setInterval(() => {
            loadNotifications();
            loadCategories();
        }, 45000);
        return () => clearInterval(interval);
    }, [selectedCategory]);

    // Recharger catégories et notifications à l'ouverture du menu
    useEffect(() => {
        if (isOpen) {
            loadCategories();
            loadNotifications();
        }
    }, [isOpen]);

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

    // Marquer une notification comme lue
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

    // Marquer toutes les notifications comme lues
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

    // Obtenir le libellé utilisateur d'une catégorie
    const getCategoryLabel = (catCode) => {
        if (!catCode) return 'Général';
        if (CATEGORY_META[catCode]?.label) return CATEGORY_META[catCode].label;
        return catCode.charAt(0).toUpperCase() + catCode.slice(1).toLowerCase().replace(/_/g, ' ');
    };

    // Icône stylisée selon la catégorie
    const getCategoryIcon = (catCode) => {
        const meta = CATEGORY_META[catCode];
        if (meta) {
            const IconComponent = meta.icon;
            return <IconComponent size={18} style={{ color: meta.color }} />;
        }
        return <Layers size={18} style={{ color: '#94a3b8' }} />;
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

    // Liste dédupliquée et triée des catégories issues de la base
    const categoryOptions = useMemo(() => {
        const set = new Set();
        (dbCategories || []).forEach(c => {
            if (c && typeof c === 'string') set.add(c.trim().toUpperCase());
        });
        (notifications || []).forEach(n => {
            if (n.categorie_action && typeof n.categorie_action === 'string') {
                set.add(n.categorie_action.trim().toUpperCase());
            }
        });
        if (set.size === 0) {
            ['CREATION', 'MODIFICATION', 'SUPPRESSION', 'STATUT', 'ECHEANCE', 'EMAIL_ECHEANCE', 'IMPORT'].forEach(c => set.add(c));
        }

        const list = Array.from(set).map(catId => ({
            id: catId,
            label: getCategoryLabel(catId)
        }));

        list.sort((a, b) => a.label.localeCompare(b.label, 'fr'));
        return list;
    }, [dbCategories, notifications]);

    return (
        <div className="notification-wrapper" ref={dropdownRef}>
            {/* Bouton cloche */}
            <button
                type="button"
                className={`notification-bell-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Journal des actions et notifications"
                aria-label="Ouvrir les notifications"
            >
                <Bell size={19} />
                {unreadCount > 0 && (
                    <span className="notification-badge-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Menu déroulant de notifications agrandi */}
            {isOpen && (
                <div className="notification-dropdown">
                    {/* En-tête du panneau */}
                    <div className="notification-header">
                        <div className="notification-title">
                            <strong>Journal des notifications</strong>
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
                                {markingAll ? <Loader2 size={14} className="btn-spinner" /> : <CheckCheck size={15} />}
                                <span>{markingAll ? 'Traitement...' : 'Tout marquer comme lu'}</span>
                            </button>
                        )}
                    </div>

                    {/* Filtre par Catégorie (Select déroulant dynamique de la base) */}
                    <div className="notification-filter-bar">
                        <div className="notification-filter-label">
                            <Filter size={15} />
                            <span>Catégorie :</span>
                        </div>
                        <div className="notification-select-wrapper">
                            <select
                                className="notification-category-select"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                title="Filtrer les notifications par catégorie"
                            >
                                <option value="TOUTES">Toutes les catégories</option>
                                {categoryOptions.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="notification-select-chevron" />
                        </div>
                        {selectedCategory !== 'TOUTES' && (
                            <button
                                type="button"
                                className="btn-reset-category"
                                onClick={() => setSelectedCategory('TOUTES')}
                                title="Réinitialiser le filtre"
                            >
                                <X size={13} />
                                <span>Toutes</span>
                            </button>
                        )}
                    </div>

                    {/* Liste des Notifications (Affichage agrandi) */}
                    <div className="notification-list">
                        {loading ? (
                            <div className="notif-empty">
                                <Loader2 size={24} className="btn-spinner" style={{ marginBottom: '0.5rem' }} />
                                <p>Chargement des notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="notif-empty">
                                <Layers size={36} className="notif-empty-icon" />
                                <p>Aucune action enregistrée dans cette catégorie.</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`notif-item ${!n.lu_par_admin ? 'unread' : ''}`}
                                >
                                    <div className="notif-icon-col">
                                        <div className="notif-icon-circle">
                                            {getCategoryIcon(n.categorie_action)}
                                        </div>
                                    </div>
                                    <div className="notif-content">
                                        <div className="notif-top">
                                            <span className="notif-entity-tag">
                                                {n.entite_concernee || 'SYSTÈME'} • {n.reference_entite || 'GÉNÉRAL'}
                                            </span>
                                            <span className="notif-time">{formatTime(n.date_action)}</span>
                                        </div>
                                        <p className="notif-message">{n.message_notification}</p>
                                        <div className="notif-footer-meta">
                                            {n.nom_utilisateur && (
                                                <span className="notif-author">
                                                    <User size={13} />
                                                    <span>{n.nom_utilisateur}</span>
                                                </span>
                                            )}
                                            <span className="notif-cat-badge">
                                                {getCategoryLabel(n.categorie_action)}
                                            </span>
                                        </div>
                                    </div>
                                    {!n.lu_par_admin && (
                                        <button
                                            type="button"
                                            className="btn-mark-one"
                                            title="Marquer comme lu"
                                            disabled={markingId === n.id}
                                            onClick={(e) => handleMarkAsRead(n.id, e)}
                                        >
                                            {markingId === n.id ? <Loader2 size={14} className="btn-spinner" /> : <Check size={14} />}
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
