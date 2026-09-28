import React, { useState, useMemo } from 'react';
import {
    Calendar, AlertTriangle, AlertCircle, Percent,
    DollarSign, Clock, CheckCircle2, TrendingUp, ChevronRight,
    RefreshCw, ArrowUpRight, ShieldAlert, Sparkles,
    FileCheck, FileEdit
} from 'lucide-react';

export default function DashboardKpisOverview({
    userContracts = [],
    emplacements = [],
    actionsCommerciales = [],
    user = null,
    onSelectKpiFilter
}) {
    const [periodeOccupation, setPeriodeOccupation] = useState('mois'); // 'mois' | 'trimestre' | 'annee'
    const now = new Date();

    // =========================================================================
    // 1. DÉTECTION DES RENOUVELLEMENTS VIA id_abonnement_precedent
    // =========================================================================
    // Tout contrat enfant possède le champ id_abonnement_precedent qui pointe vers son parent.
    // L'ensemble renewedParentRefs contient toutes les références de contrats ayant déjà été renouvelés.
    const renewedParentRefs = useMemo(() => {
        const set = new Set();
        userContracts.forEach(c => {
            if (c.id_abonnement_precedent) {
                set.add(String(c.id_abonnement_precedent).trim());
            }
        });
        return set;
    }, [userContracts]);

    // Un contrat est renouvelé s'il a été référencé comme parent par un autre contrat
    const isContratRenouvele = (c) => renewedParentRefs.has(String(c.reference).trim());

    // Helper calcul écart en jours
    const getDiffJours = (dateStr) => {
        if (!dateStr) return -9999;
        const target = new Date(dateStr);
        return Math.ceil((target - now) / 86400000);
    };

    // =========================================================================
    // 2. ÉCHÉANCES DANS 7, 30, 60 ET 90 JOURS (Contrats actifs non encore renouvelés)
    // =========================================================================
    const echeances = useMemo(() => {
        const actifsNonRenouveles = userContracts.filter(c => {
            const statut = (c.nom_statut || c.statut || '').toLowerCase();
            if (statut === 'résilié' || statut === 'resilie') return false;
            if (isContratRenouvele(c)) return false; // Déjà renouvelé -> pas besoin d'alerte
            const diff = getDiffJours(c.date_echeance || c.date_fin);
            return diff >= 0 && diff <= 90;
        });

        const j7 = actifsNonRenouveles.filter(c => {
            const diff = getDiffJours(c.date_echeance || c.date_fin);
            return diff >= 0 && diff <= 7;
        });

        const j30 = actifsNonRenouveles.filter(c => {
            const diff = getDiffJours(c.date_echeance || c.date_fin);
            return diff > 7 && diff <= 30;
        });

        const j60 = actifsNonRenouveles.filter(c => {
            const diff = getDiffJours(c.date_echeance || c.date_fin);
            return diff > 30 && diff <= 60;
        });

        const j90 = actifsNonRenouveles.filter(c => {
            const diff = getDiffJours(c.date_echeance || c.date_fin);
            return diff > 60 && diff <= 90;
        });

        return { j7, j30, j60, j90, total: actifsNonRenouveles.length };
    }, [userContracts, renewedParentRefs]);

    // =========================================================================
    // 3. ALERTES CRITIQUES : Échus non renouvelés & Sans action commerciale
    // =========================================================================
    const alertesCritiques = useMemo(() => {
        // A. Contrats échus non renouvelés
        // Date dépassée ET non présent dans renewedParentRefs ET non résilié explicitement
        const echusNonRenouveles = userContracts.filter(c => {
            const diff = getDiffJours(c.date_echeance || c.date_fin);
            const statut = (c.nom_statut || c.statut || '').toLowerCase();
            const estEchu = diff < 0;
            const aEteRenouvele = isContratRenouvele(c);
            const estResilie = statut === 'résilié' || statut === 'resilie';
            return estEchu && !aEteRenouvele && !estResilie;
        });

        // B. Contrats sans action commerciale planifiée (à échéance <= 90j ou actifs)
        const sansAction = userContracts.filter(c => {
            const diff = getDiffJours(c.date_echeance || c.date_fin);
            const statut = (c.nom_statut || c.statut || '').toLowerCase();
            if (statut === 'résilié' || statut === 'resilie') return false;
            if (isContratRenouvele(c)) return false;

            // Concerne les contrats actifs arrivant à terme sous 90j ou déjà échus récents
            const estSousTension = diff >= -15 && diff <= 90;
            if (!estSousTension) return false;

            const hasAction = actionsCommerciales.some(a =>
                String(a.id_abonnement || '').trim() === String(c.reference || '').trim()
            );
            return !hasAction;
        });

        return { echusNonRenouveles, sansAction };
    }, [userContracts, actionsCommerciales, renewedParentRefs]);

    // =========================================================================
    // 4. TAUX D'OCCUPATION DES SUPPORTS SUR UNE PÉRIODE DONNÉE
    // =========================================================================
    const statsOccupation = useMemo(() => {
        const totalSupports = emplacements.length || 1;
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        let dateDebutPeriode = new Date(currentYear, currentMonth, 1);
        let dateFinPeriode = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

        if (periodeOccupation === 'trimestre') {
            const quarterMonth = Math.floor(currentMonth / 3) * 3;
            dateDebutPeriode = new Date(currentYear, quarterMonth, 1);
            dateFinPeriode = new Date(currentYear, quarterMonth + 3, 0, 23, 59, 59);
        } else if (periodeOccupation === 'annee') {
            dateDebutPeriode = new Date(currentYear, 0, 1);
            dateFinPeriode = new Date(currentYear, 11, 31, 23, 59, 59);
        }

        // Identifier tous les supports uniques occupés pendant cette fenêtre
        const occupiedRefs = new Set();
        userContracts.forEach(c => {
            const statut = (c.nom_statut || c.statut || '').toLowerCase();
            if (
                statut.includes('résilié') || statut.includes('resilie') ||
                statut.includes('archiv') ||
                statut.includes('annul') ||
                statut.includes('brouillon')
            ) return;

            const cDebut = new Date(c.date_debut);
            const cFin = new Date(c.date_echeance || c.date_fin);

            // Vérifie s'il y a intersection temporelle entre le contrat et la période choisie
            if (cDebut <= dateFinPeriode && cFin >= dateDebutPeriode) {
                // Extraire supports associés
                if (c.supports_associes) {
                    c.supports_associes.split(/[,;]+/).forEach(s => {
                        const ref = s.trim();
                        if (ref) occupiedRefs.add(ref);
                    });
                }
                if (c.reference_emplacement) {
                    occupiedRefs.add(c.reference_emplacement.trim());
                }
            }
        });

        const occupesCount = occupiedRefs.size;
        const taux = Math.min(100, Math.round((occupesCount / totalSupports) * 100));

        return {
            totalSupports,
            occupesCount,
            disponiblesCount: Math.max(0, totalSupports - occupesCount),
            taux
        };
    }, [emplacements, userContracts, periodeOccupation]);

    // =========================================================================
    // 5. MONTANTS FINANCIERS : Actifs, Renouvelés, À renouveler, Perdus
    // =========================================================================
    const montants = useMemo(() => {
        let actifs = 0;
        let renouveles = 0;
        let aValider = 0;
        let brouillons = 0;
        let aRenouveler = 0;
        let perdus = 0;

        let nbActifs = 0;
        let nbRenouveles = 0;
        let nbAValider = 0;
        let nbBrouillons = 0;
        let nbARenouveler = 0;
        let nbPerdus = 0;

        userContracts.forEach(c => {
            const tarif = parseFloat(c.tarif) || 0;
            const diff = getDiffJours(c.date_echeance || c.date_fin);
            const statut = (c.nom_statut || c.statut_abonnement || c.statut || '').trim().toLowerCase();

            const estFilsRenouvellement = Boolean(c.id_abonnement_precedent) || /-R\d+$/i.test(c.reference || '');
            const estParentRenouvele = isContratRenouvele(c);
            const isRenouvele = estFilsRenouvellement || estParentRenouvele;

            // 1. Actif : son dernier statut dans l'historique est STRICTEMENT 'actif'
            const isActif = statut === 'actif';
            if (isActif) {
                actifs += tarif;
                nbActifs += 1;
            }

            // 2. Renouvelé : reconduit via parent ou enfant -R
            if (isRenouvele) {
                renouveles += tarif;
                nbRenouveles += 1;
            }

            // 3. À Valider : dernier statut 'à valider'
            const isAValider = statut === 'à valider' || statut === 'a valider' || statut.includes('valid');
            if (isAValider) {
                aValider += tarif;
                nbAValider += 1;
            }

            // 4. Brouillon : dernier statut 'brouillon'
            const isBrouillon = statut === 'brouillon';
            if (isBrouillon) {
                brouillons += tarif;
                nbBrouillons += 1;
            }
            // 5. À Renouveler : actif, sous 90j, non encore renouvelé
            if (isActif && diff >= 0 && diff <= 90 && !estParentRenouvele) {
                aRenouveler += tarif;
                nbARenouveler += 1;
            }
        });

        return {
            actifs, nbActifs,
            renouveles, nbRenouveles,
            aValider, nbAValider,
            brouillons, nbBrouillons,
            aRenouveler, nbARenouveler
        };
    }, [userContracts, renewedParentRefs]);

    const formatMontant = (val) => new Intl.NumberFormat('fr-MG').format(Math.round(val)) + ' MGA';

    const triggerFilter = (filterKey) => {
        if (onSelectKpiFilter) {
            onSelectKpiFilter(filterKey);
        }
    };

    return (
        <div className="dashboard-kpi-container" style={{ marginBottom: '1.75rem' }}>
            {/* Titre & Info Portefeuille */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.75rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)'
                    }}>
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main, #fff)' }}>
                            Tableau de bord de pilotage des abonnements
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                            {user?.role === 'Commercial'
                                ? `Portefeuille personnel : ${userContracts.length} contrat(s) sous votre responsabilité`
                                : `Vision globale entreprise : ${userContracts.length} contrat(s) au total`
                            }
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        background: 'rgba(6, 182, 212, 0.12)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        color: '#06b6d4',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                    }}>
                        <Sparkles size={12} />
                        Rôles & Continuité (-R1, -R2) activés
                    </span>
                </div>
            </div>

            {/* GRILLE 1 : MONTANTS FINANCIERS DES CONTRATS */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: '1rem',
                marginBottom: '1.25rem'
            }}>
                {/* 1. Actifs */}
                <div
                    className="kpi-card-hover"
                    onClick={() => triggerFilter('montant_actifs')}
                    style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.02))',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        borderRadius: '12px',
                        padding: '1.1rem 1.15rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Contrats Actifs
                        </span>
                        <div style={{ background: 'rgba(16, 185, 129, 0.18)', padding: '0.45rem', borderRadius: '8px', color: '#10b981' }}>
                            <DollarSign size={18} />
                        </div>
                    </div>
                    {/* 1ER PLAN : NOMBRE */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.3rem' }}>
                        <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                            {montants.nbActifs}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
                            contrat{montants.nbActifs > 1 ? 's' : ''}
                        </span>
                    </div>
                    {/* 2E PLAN : MONTANT */}
                    <div style={{ marginTop: '0.4rem', padding: '0.3rem 0.5rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total :</span>
                        <strong style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 800 }}>{formatMontant(montants.actifs)}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.4rem' }}>
                        Dernier statut : <strong style={{ color: '#10b981' }}>Actif</strong>
                    </div>
                </div>

                {/* 2. Renouvelés (avec id_abonnement_precedent / -R) */}
                <div
                    className="kpi-card-hover"
                    onClick={() => triggerFilter('montant_renouveles')}
                    style={{
                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(168, 85, 247, 0.02))',
                        border: '1px solid rgba(168, 85, 247, 0.35)',
                        borderRadius: '12px',
                        padding: '1.1rem 1.15rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.78rem', color: '#c084fc', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Contrats Renouvelés
                        </span>
                        <div style={{ background: 'rgba(168, 85, 247, 0.18)', padding: '0.45rem', borderRadius: '8px', color: '#c084fc' }}>
                            <RefreshCw size={18} />
                        </div>
                    </div>
                    {/* 1ER PLAN : NOMBRE */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.3rem' }}>
                        <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                            {montants.nbRenouveles}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase' }}>
                            reconduit{montants.nbRenouveles > 1 ? 's' : ''}
                        </span>
                    </div>
                    {/* 2E PLAN : MONTANT */}
                    <div style={{ marginTop: '0.4rem', padding: '0.3rem 0.5rem', background: 'rgba(168, 85, 247, 0.08)', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total :</span>
                        <strong style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 800 }}>{formatMontant(montants.renouveles)}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.4rem' }}>
                        Reconduits (-R1, -R2...)
                    </div>
                </div>

                {/* 3. À Valider */}
                <div
                    className="kpi-card-hover"
                    onClick={() => triggerFilter('a_valider')}
                    style={{
                        background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12), rgba(234, 179, 8, 0.02))',
                        border: '1px solid rgba(234, 179, 8, 0.35)',
                        borderRadius: '12px',
                        padding: '1.1rem 1.15rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.78rem', color: '#eab308', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Contrats À Valider
                        </span>
                        <div style={{ background: 'rgba(234, 179, 8, 0.18)', padding: '0.45rem', borderRadius: '8px', color: '#eab308' }}>
                            <FileCheck size={18} />
                        </div>
                    </div>
                    {/* 1ER PLAN : NOMBRE */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.3rem' }}>
                        <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                            {montants.nbAValider}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#eab308', textTransform: 'uppercase' }}>
                            contrat{montants.nbAValider > 1 ? 's' : ''}
                        </span>
                    </div>
                    {/* 2E PLAN : MONTANT */}
                    <div style={{ marginTop: '0.4rem', padding: '0.3rem 0.5rem', background: 'rgba(234, 179, 8, 0.08)', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total :</span>
                        <strong style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 800 }}>{formatMontant(montants.aValider)}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.4rem' }}>
                        Dernier statut : <strong style={{ color: '#eab308' }}>À valider</strong>
                    </div>
                </div>

                {/* 4. Brouillons */}
                <div
                    className="kpi-card-hover"
                    onClick={() => triggerFilter('brouillon')}
                    style={{
                        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(6, 182, 212, 0.02))',
                        border: '1px solid rgba(6, 182, 212, 0.35)',
                        borderRadius: '12px',
                        padding: '1.1rem 1.15rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.78rem', color: '#06b6d4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Contrats Brouillons
                        </span>
                        <div style={{ background: 'rgba(6, 182, 212, 0.18)', padding: '0.45rem', borderRadius: '8px', color: '#06b6d4' }}>
                            <FileEdit size={18} />
                        </div>
                    </div>
                    {/* 1ER PLAN : NOMBRE */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.3rem' }}>
                        <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                            {montants.nbBrouillons}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase' }}>
                            brouillon{montants.nbBrouillons > 1 ? 's' : ''}
                        </span>
                    </div>
                    {/* 2E PLAN : MONTANT */}
                    <div style={{ marginTop: '0.4rem', padding: '0.3rem 0.5rem', background: 'rgba(6, 182, 212, 0.08)', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total :</span>
                        <strong style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 800 }}>{formatMontant(montants.brouillons)}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.4rem' }}>
                        Dernier statut : <strong style={{ color: '#06b6d4' }}>Brouillon</strong>
                    </div>
                </div>

                {/* 5. À renouveler (≤ 90 jours non encore renouvelés) */}
                <div
                    className="kpi-card-hover"
                    onClick={() => triggerFilter('montant_a_renouveler')}
                    style={{
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.02))',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        borderRadius: '12px',
                        padding: '1.1rem 1.15rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            À Renouveler (≤ 90j)
                        </span>
                        <div style={{ background: 'rgba(245, 158, 11, 0.18)', padding: '0.45rem', borderRadius: '8px', color: '#f59e0b' }}>
                            <Clock size={18} />
                        </div>
                    </div>
                    {/* 1ER PLAN : NOMBRE */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.3rem' }}>
                        <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                            {montants.nbARenouveler}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>
                            contrat{montants.nbARenouveler > 1 ? 's' : ''}
                        </span>
                    </div>
                    {/* 2E PLAN : MONTANT */}
                    <div style={{ marginTop: '0.4rem', padding: '0.3rem 0.5rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total :</span>
                        <strong style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 800 }}>{formatMontant(montants.aRenouveler)}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.4rem' }}>
                        En attente d'action commerciale
                    </div>
                </div>
            </div>

            {/* GRILLE 2 : ÉCHÉANCES & ALERTES CRITIQUES & TAUX D'OCCUPATION */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '1.25rem'
            }}>
                {/* BLOC A : ÉCHÉANCES À 7, 30, 60, 90 JOURS */}
                <div className="glass-panel" style={{ padding: '1.2rem', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={18} style={{ color: '#06b6d4' }} />
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                                Échéances des contrats (non renouvelés)
                            </h3>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {echeances.total} à traiter
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
                        {/* J-7 */}
                        <div
                            className="kpi-mini-card"
                            onClick={() => triggerFilter('echeance_7')}
                            style={{
                                background: echeances.j7.length > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                                border: echeances.j7.length > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-glass)',
                                borderRadius: '10px',
                                padding: '0.75rem 0.5rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease'
                            }}
                        >
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444', display: 'block' }}>
                                ≤ 7 jours
                            </span>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: echeances.j7.length > 0 ? '#ef4444' : '#fff', marginTop: '0.2rem' }}>
                                {echeances.j7.length}
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                Urgence Max
                            </span>
                        </div>

                        {/* J-30 */}
                        <div
                            className="kpi-mini-card"
                            onClick={() => triggerFilter('echeance_30')}
                            style={{
                                background: echeances.j30.length > 0 ? 'rgba(249, 115, 22, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                                border: echeances.j30.length > 0 ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid var(--border-glass)',
                                borderRadius: '10px',
                                padding: '0.75rem 0.5rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease'
                            }}
                        >
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f97316', display: 'block' }}>
                                ≤ 30 jours
                            </span>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: echeances.j30.length > 0 ? '#f97316' : '#fff', marginTop: '0.2rem' }}>
                                {echeances.j30.length}
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                Relance J-30
                            </span>
                        </div>

                        {/* J-60 */}
                        <div
                            className="kpi-mini-card"
                            onClick={() => triggerFilter('echeance_60')}
                            style={{
                                background: echeances.j60.length > 0 ? 'rgba(234, 179, 8, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                                border: echeances.j60.length > 0 ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid var(--border-glass)',
                                borderRadius: '10px',
                                padding: '0.75rem 0.5rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease'
                            }}
                        >
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#eab308', display: 'block' }}>
                                ≤ 60 jours
                            </span>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: echeances.j60.length > 0 ? '#eab308' : '#fff', marginTop: '0.2rem' }}>
                                {echeances.j60.length}
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                Anticipation
                            </span>
                        </div>

                        {/* J-90 */}
                        <div
                            className="kpi-mini-card"
                            onClick={() => triggerFilter('echeance_90')}
                            style={{
                                background: echeances.j90.length > 0 ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                                border: echeances.j90.length > 0 ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-glass)',
                                borderRadius: '10px',
                                padding: '0.75rem 0.5rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease'
                            }}
                        >
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3b82f6', display: 'block' }}>
                                ≤ 90 jours
                            </span>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: echeances.j90.length > 0 ? '#3b82f6' : '#fff', marginTop: '0.2rem' }}>
                                {echeances.j90.length}
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                Prospection
                            </span>
                        </div>
                    </div>
                </div>

                {/* BLOC B : ALERTES CRITIQUES (Échus non renouvelés & Sans action) */}
                <div className="glass-panel" style={{ padding: '1.2rem', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldAlert size={18} style={{ color: '#f43f5e' }} />
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                                Alertes Commerciales Critiques
                            </h3>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {alertesCritiques.echusNonRenouveles.length + alertesCritiques.sansAction.length} alerte(s)
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {/* 1. Échus non renouvelés */}
                        <div
                            className="kpi-mini-card"
                            onClick={() => triggerFilter('echus_non_renouveles')}
                            style={{
                                background: alertesCritiques.echusNonRenouveles.length > 0 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                                border: alertesCritiques.echusNonRenouveles.length > 0 ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-glass)',
                                borderRadius: '10px',
                                padding: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f43f5e', marginBottom: '0.3rem' }}>
                                <AlertTriangle size={15} />
                                <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Échus non renouvelés</span>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: alertesCritiques.echusNonRenouveles.length > 0 ? '#f43f5e' : '#fff' }}>
                                {alertesCritiques.echusNonRenouveles.length}
                            </div>
                            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                Aucun contrat successeur lié via <code>id_precedent</code>
                            </p>
                        </div>

                        {/* 2. Sans action commerciale planifiée */}
                        <div
                            className="kpi-mini-card"
                            onClick={() => triggerFilter('sans_action')}
                            style={{
                                background: alertesCritiques.sansAction.length > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                                border: alertesCritiques.sansAction.length > 0 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-glass)',
                                borderRadius: '10px',
                                padding: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', marginBottom: '0.3rem' }}>
                                <Clock size={15} />
                                <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Sans action planifiée</span>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: alertesCritiques.sansAction.length > 0 ? '#f59e0b' : '#fff' }}>
                                {alertesCritiques.sansAction.length}
                            </div>
                            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                Zéro relance enregistrée pour l'échéance proche
                            </p>
                        </div>
                    </div>
                </div>

                {/* BLOC C : TAUX D'OCCUPATION DES SUPPORTS SUR LA PÉRIODE */}
                <div className="glass-panel" style={{ padding: '1.2rem', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Percent size={18} style={{ color: '#10b981' }} />
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                                Taux d'occupation des supports
                            </h3>
                        </div>

                        {/* Sélecteur de période */}
                        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '2px' }}>
                            {['mois', 'trimestre', 'annee'].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPeriodeOccupation(p)}
                                    style={{
                                        background: periodeOccupation === p ? 'var(--accent-primary, #06b6d4)' : 'transparent',
                                        color: periodeOccupation === p ? '#fff' : 'var(--text-muted)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        padding: '0.25rem 0.6rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {p === 'mois' ? 'Mois' : p === 'trimestre' ? 'Trimestre' : 'Année'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 900,
                            color: statsOccupation.taux >= 70 ? '#10b981' : statsOccupation.taux >= 40 ? '#f59e0b' : '#ef4444',
                            minWidth: '75px'
                        }}>
                            {statsOccupation.taux}%
                        </div>

                        <div style={{ flex: 1 }}>
                            {/* Barre de progression */}
                            <div style={{
                                width: '100%',
                                height: '10px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                borderRadius: '9999px',
                                overflow: 'hidden',
                                marginBottom: '0.4rem'
                            }}>
                                <div style={{
                                    width: `${statsOccupation.taux}%`,
                                    height: '100%',
                                    background: statsOccupation.taux >= 70
                                        ? 'linear-gradient(90deg, #06b6d4, #10b981)'
                                        : statsOccupation.taux >= 40
                                        ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                                        : 'linear-gradient(90deg, #ef4444, #f43f5e)',
                                    borderRadius: '9999px',
                                    transition: 'width 0.4s ease'
                                }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <span>Occupés : <strong style={{ color: '#fff' }}>{statsOccupation.occupesCount}</strong></span>
                                <span>Disponibles : <strong style={{ color: '#10b981' }}>{statsOccupation.disponiblesCount}</strong></span>
                                <span>Total : <strong>{statsOccupation.totalSupports}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}