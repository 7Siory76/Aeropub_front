import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    Trash2,
    AlertTriangle,
    ShieldCheck,
    Loader2,
    Layers,
    CalendarCheck,
    Building2,
    Database,
    MapPin,
    Tag,
    Bell,
    Mail
} from 'lucide-react';
import {
    abonnementsApi,
    clientsApi,
    supportsApi,
    zonesApi,
    categoriesApi,
    typeSupportsApi,
    journalNotificationApi,
    actionsCommercialesApi
} from '../../../api';
import { useFeedback } from '../../../context/FeedbackContext';

import './PurgeDataModal.css';

export default function PurgeDataModal({ isOpen, onClose, onPurgeSuccess }) {
    const { showSuccess, showError, showInfo } = useFeedback();

    const [loadingCounts, setLoadingCounts] = useState(true);
    const [counts, setCounts] = useState({
        abonnements: 0,
        supports: 0,
        clients: 0,
        zones: 0,
        categories: 0,
        types: 0,
        notifications: 0,
        actionsCommerciales: 0
    });

    const [selectedKeys, setSelectedKeys] = useState(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [progressStatus, setProgressStatus] = useState('');
    const [confirmationChecked, setConfirmationChecked] = useState(false);

    // Définition des modules de données purgeables
    const purgeModules = [
        {
            key: 'abonnements',
            title: 'Abonnements & Contrats',
            desc: 'Abonnement, Abonnement_Support, Statut_Abonnement, Actions Commerciales',
            icon: <CalendarCheck size={18} />,
            count: counts.abonnements,
            execute: async (onProgress) => {
                const items = await abonnementsApi.getAll();
                let deleted = 0;
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    onProgress(`Suppression des abonnements (${i + 1}/${items.length})...`);
                    await abonnementsApi.delete(item.reference || item.id);
                    deleted++;
                }
                return { label: 'Abonnements', count: deleted };
            }
        },
        {
            key: 'supports',
            title: 'Supports & Emplacements Publicitaires',
            desc: 'Support, Etat_Support, Historique des états physiques',
            icon: <Database size={18} />,
            count: counts.supports,
            execute: async (onProgress) => {
                const items = await supportsApi.getAll();
                let deleted = 0;
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    onProgress(`Suppression des supports (${i + 1}/${items.length})...`);
                    await supportsApi.delete(item.reference);
                    deleted++;
                }
                return { label: 'Supports', count: deleted };
            }
        },
        {
            key: 'clients',
            title: 'Clients Partenaires & Annonceurs',
            desc: 'Client, Contacts multiples (Email, Téléphone)',
            icon: <Building2 size={18} />,
            count: counts.clients,
            execute: async (onProgress) => {
                const items = await clientsApi.getAll();
                let deleted = 0;
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    onProgress(`Suppression des clients (${i + 1}/${items.length})...`);
                    await clientsApi.delete(item.id);
                    deleted++;
                }
                return { label: 'Clients', count: deleted };
            }
        },
        {
            key: 'zones',
            title: "Zones & Terminaux d'Aéroport",
            desc: 'Zone_Terminal (Hall départ, arrivée, parking, etc.)',
            icon: <MapPin size={18} />,
            count: counts.zones,
            execute: async (onProgress) => {
                const items = await zonesApi.getAll();
                let deleted = 0;
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    onProgress(`Suppression des zones (${i + 1}/${items.length})...`);
                    await zonesApi.delete(item.id);
                    deleted++;
                }
                return { label: 'Zones', count: deleted };
            }
        },
        {
            key: 'categories',
            title: 'Catégories de Supports',
            desc: 'Categorie_Support (Statique, Numérique, Événementiel...)',
            icon: <Layers size={18} />,
            count: counts.categories,
            execute: async (onProgress) => {
                const items = await categoriesApi.getAll();
                let deleted = 0;
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    onProgress(`Suppression des catégories (${i + 1}/${items.length})...`);
                    await categoriesApi.delete(item.id);
                    deleted++;
                }
                return { label: 'Catégories', count: deleted };
            }
        },
        {
            key: 'types',
            title: 'Types de Supports Publicitaires',
            desc: 'Type_Support (Panneau 4x3, Caisson lumineux, Écran LED...)',
            icon: <Tag size={18} />,
            count: counts.types,
            execute: async (onProgress) => {
                const items = await typeSupportsApi.getAll();
                let deleted = 0;
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    onProgress(`Suppression des types (${i + 1}/${items.length})...`);
                    await typeSupportsApi.delete(item.id);
                    deleted++;
                }
                return { label: 'Types de Support', count: deleted };
            }
        },
        {
            key: 'actions_commerciales',
            title: 'Actions Commerciales & Alertes',
            desc: 'Historique des relances, préavis et courriels envoyés',
            icon: <Mail size={18} />,
            count: counts.actionsCommerciales,
            execute: async (onProgress) => {
                const res = await actionsCommercialesApi.getAll();
                const items = Array.isArray(res) ? res : (res?.data || []);
                let deleted = 0;
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    onProgress(`Suppression des actions commerciales (${i + 1}/${items.length})...`);
                    await actionsCommercialesApi.delete(item.id);
                    deleted++;
                }
                return { label: 'Actions Commerciales', count: deleted };
            }
        },
        {
            key: 'journal_notification',
            title: 'Journal et Audit',
            desc: 'Notifications, alertes et journal d’audit des actions',
            icon: <Bell size={18} />,
            count: counts.notifications,
            execute: async (onProgress) => {
                const res = await journalNotificationApi.getAll();
                const items = Array.isArray(res) ? res : (res?.data || []);
                let deleted = 0;
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    onProgress(`Suppression des notifications (${i + 1}/${items.length})...`);
                    await journalNotificationApi.delete(item.id);
                    deleted++;
                }
                return { label: 'Journal & Notifications', count: deleted };
            }
        }
    ];

    // Charger les compteurs réels en base de données
    const loadCounts = async () => {
        setLoadingCounts(true);
        try {
            const [abos, supps, clis, zns, cats, typs, notifs, acts] = await Promise.allSettled([
                abonnementsApi.getAll(),
                supportsApi.getAll(),
                clientsApi.getAll(),
                zonesApi.getAll(),
                categoriesApi.getAll(),
                typeSupportsApi.getAll(),
                journalNotificationApi.getAll(),
                actionsCommercialesApi.getAll()
            ]);

            const notifItems = notifs.status === 'fulfilled'
                ? (Array.isArray(notifs.value) ? notifs.value : notifs.value?.data || [])
                : [];
            const actItems = acts.status === 'fulfilled'
                ? (Array.isArray(acts.value) ? acts.value : acts.value?.data || [])
                : [];

            setCounts({
                abonnements: abos.status === 'fulfilled' && Array.isArray(abos.value) ? abos.value.length : 0,
                supports: supps.status === 'fulfilled' && Array.isArray(supps.value) ? supps.value.length : 0,
                clients: clis.status === 'fulfilled' && Array.isArray(clis.value) ? clis.value.length : 0,
                zones: zns.status === 'fulfilled' && Array.isArray(zns.value) ? zns.value.length : 0,
                categories: cats.status === 'fulfilled' && Array.isArray(cats.value) ? cats.value.length : 0,
                types: typs.status === 'fulfilled' && Array.isArray(typs.value) ? typs.value.length : 0,
                notifications: notifItems.length,
                actionsCommerciales: actItems.length
            });
        } catch (err) {
            console.error('[PURGE MODAL] Erreur de chargement des compteurs :', err);
        } finally {
            setLoadingCounts(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadCounts();
            setSelectedKeys(new Set());
            setConfirmationChecked(false);
            setProgressStatus('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Gestion de la sélection
    const toggleKey = (key) => {
        if (isDeleting) return;
        setSelectedKeys(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const handleSelectAll = () => {
        if (isDeleting) return;
        const allKeys = purgeModules.filter(m => m.count > 0).map(m => m.key);
        setSelectedKeys(new Set(allKeys));
    };

    const handleDeselectAll = () => {
        if (isDeleting) return;
        setSelectedKeys(new Set());
    };

    // Exécution de la suppression dans l'ordre strict des dépendances
    const handleExecutePurge = async () => {
        if (selectedKeys.size === 0) {
            showInfo('Veuillez sélectionner au moins une table à vider.');
            return;
        }

        if (!confirmationChecked) {
            showInfo('Veuillez cocher la case de confirmation pour continuer.');
            return;
        }

        setIsDeleting(true);
        const results = [];
        const errors = [];

        try {
            // Ordre obligatoire d'exécution pour respecter les clés étrangères
            const executionOrder = [
                'actions_commerciales',
                'journal_notification',
                'abonnements',
                'supports',
                'clients',
                'zones',
                'categories',
                'types'
            ];

            for (const key of executionOrder) {
                if (selectedKeys.has(key)) {
                    const mod = purgeModules.find(m => m.key === key);
                    if (mod) {
                        try {
                            const res = await mod.execute(setProgressStatus);
                            results.push(res);

                            // Enregistrer la notification récapitulative dans le journal d'audit
                            if (res && res.count > 0 && key !== 'journal_notification') {
                                try {
                                    await journalNotificationApi.create({
                                        categorie_action: 'SUPPRESSION',
                                        entite_concernee: key.toUpperCase(),
                                        reference_entite: key,
                                        valeur_apres: { count: res.count, label: res.label },
                                        message_notification: `Suppression de ${res.count} ${res.label.toLowerCase()} (Purge des données).`
                                    });
                                } catch (notifErr) {
                                    console.warn('[PURGE] Notification journal non enregistrée :', notifErr);
                                }
                            }
                        } catch (err) {
                            console.error(`[PURGE] Erreur suppression ${key}:`, err);
                            const errMsg = err.response?.data?.message || err.message || 'Erreur inconnue';
                            errors.push(`${mod.title} : ${errMsg}`);
                        }
                    }
                }
            }

            const totalDeleted = results.reduce((acc, r) => acc + r.count, 0);

            if (errors.length > 0) {
                showError(`Suppression partielle (${totalDeleted} supprimés). Erreurs : ${errors.join(' | ')}`);
            } else {
                showSuccess(`Nettoyage réussi : ${totalDeleted} enregistrement(s) supprimé(s) au total.`);
            }

            if (onPurgeSuccess) {
                onPurgeSuccess();
            }

            onClose();

        } catch (globalErr) {
            showError("Une erreur inattendue est survenue pendant l'opération.");
        } finally {
            setIsDeleting(false);
            setProgressStatus('');
        }
    };

    const totalSelectedRecords = purgeModules
        .filter(m => selectedKeys.has(m.key))
        .reduce((acc, m) => acc + m.count, 0);

    return createPortal(
        <div className="purge-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !isDeleting) onClose(); }}>
            <div className="purge-modal-card">

                {/* En-tête de la modale */}
                <div className="purge-modal-header">
                    <div className="purge-modal-title-group">
                        <div className="purge-modal-icon-badge">
                            <Trash2 size={22} />
                        </div>
                        <div>
                            <h2 className="purge-modal-title">Purge & Nettoyage Sélectif des Données</h2>
                            <p className="purge-modal-subtitle">
                                Supprimez proprement les données de test ou réinitialisez vos tables via les APIs dédiées.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="purge-modal-close-btn"
                        onClick={onClose}
                        disabled={isDeleting}
                        title="Fermer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Corps de la modale */}
                <div className="purge-modal-body">

                    {/* Badge tables protégées */}
                    <div className="purge-protected-banner">
                        <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                        <span>
                            <strong>Sécurité garantie :</strong> Les tables <strong>Utilisateur</strong> (comptes, rôles) et <strong>Paramétrage</strong> sont strictement protégées et ne seront jamais supprimées.
                        </span>
                    </div>

                    {/* Avertissement */}
                    <div className="purge-warning-banner">
                        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            Cette action est <strong>irréversible</strong>. Les enregistrements sélectionnés seront définitivement supprimés de la base de données PostgreSQL en respectant les contraintes d'intégrité référentielle.
                        </div>
                    </div>

                    {/* Barre d'outils de sélection */}
                    <div className="purge-selection-toolbar">
                        <span>
                            {loadingCounts ? (
                                <span>Calcul des enregistrements en cours...</span>
                            ) : (
                                <span>{selectedKeys.size} module(s) sélectionné(s) ({totalSelectedRecords} lignes)</span>
                            )}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                type="button"
                                className="purge-select-btn"
                                onClick={handleSelectAll}
                                disabled={isDeleting || loadingCounts}
                            >
                                Tout sélectionner
                            </button>
                            <span style={{ color: 'var(--border-color, rgba(255,255,255,0.1))' }}>|</span>
                            <button
                                type="button"
                                className="purge-select-btn"
                                onClick={handleDeselectAll}
                                disabled={isDeleting || selectedKeys.size === 0}
                            >
                                Tout désélectionner
                            </button>
                        </div>
                    </div>

                    {/* Liste des tables sélectionnables */}
                    <div className="purge-tables-list">
                        {purgeModules.map((mod) => {
                            const isSelected = selectedKeys.has(mod.key);
                            return (
                                <div
                                    key={mod.key}
                                    className={`purge-table-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => toggleKey(mod.key)}
                                >
                                    <div className="purge-item-left">
                                        <input
                                            type="checkbox"
                                            className="purge-checkbox"
                                            checked={isSelected}
                                            onChange={() => { }} // Géré par le div parent
                                            disabled={isDeleting}
                                        />
                                        <div className="purge-item-icon">
                                            {mod.icon}
                                        </div>
                                        <div>
                                            <div className="purge-item-title">{mod.title}</div>
                                            <div className="purge-item-desc">{mod.desc}</div>
                                        </div>
                                    </div>

                                    <div className="purge-item-badge">
                                        {loadingCounts ? (
                                            <Loader2 size={12} className="btn-spinner" />
                                        ) : (
                                            `${mod.count} en base`
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Indicateur de progression en cours */}
                    {isDeleting && (
                        <div className="purge-progress-box">
                            <div className="purge-progress-label">
                                <Loader2 size={16} className="btn-spinner" />
                                <span>{progressStatus || 'Suppression en cours...'}</span>
                            </div>
                        </div>
                    )}

                    {/* Case de confirmation explicite */}
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        fontSize: '0.86rem',
                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                        <input
                            type="checkbox"
                            checked={confirmationChecked}
                            onChange={(e) => setConfirmationChecked(e.target.checked)}
                            disabled={isDeleting}
                            style={{ width: '16px', height: '16px', accentColor: '#ef4444' }}
                        />
                        <span>Je confirme vouloir supprimer définitivement les données sélectionnées.</span>
                    </label>

                </div>

                {/* Pied de page */}
                <div className="purge-modal-footer">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={isDeleting}
                        style={{ padding: '0.65rem 1.25rem', borderRadius: '10px' }}
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        className="btn-purge-danger"
                        onClick={handleExecutePurge}
                        disabled={isDeleting || selectedKeys.size === 0 || !confirmationChecked}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 size={16} className="btn-spinner" />
                                <span>Suppression en cours...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} />
                                <span>
                                    Purger les données ({totalSelectedRecords})
                                </span>
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
}
