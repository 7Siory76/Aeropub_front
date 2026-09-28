import React, { useState, useMemo } from 'react';
import { Trophy, Calendar, Award } from 'lucide-react';

const MOIS_NOMS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Fonction pour normaliser une date à minuit local
const parseDateOnly = (dateInput) => {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

// Calcule le nombre de jours calendaires d'activité d'un contrat dans une fenêtre [pStart, pEnd] (inclusif)
const getActiveDaysInPeriod = (cDebut, cFin, pStart, pEnd) => {
    if (!cDebut || !cFin || !pStart || !pEnd) return 0;
    const start = Math.max(cDebut.getTime(), pStart.getTime());
    const end = Math.min(cFin.getTime(), pEnd.getTime());
    if (start > end) return 0;
    return Math.round((end - start) / 86400000) + 1;
};

// Calcule la durée totale en jours d'un contrat
const getTotalContractDays = (cDebut, cFin) => {
    if (!cDebut || !cFin) return 1;
    const diff = Math.round((cFin.getTime() - cDebut.getTime()) / 86400000);
    return Math.max(1, diff);
};

export default function TopClientsWidget({ userContracts = [] }) {
    const currentMonthIndex = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const [modePeriode, setModePeriode] = useState('mois'); // 'mois' | 'annee' | 'general'
    const [selectedMonth, setSelectedMonth] = useState(currentMonthIndex);
    const [selectedYear, setSelectedYear] = useState(currentYear);

    const formatDevise = (val) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'MGA',
            maximumFractionDigits: 0
        }).format(val || 0).replace('MGA', 'Ar');
    };

    // Extraire dynamiquement les années disponibles dans les contrats
    const availableYears = useMemo(() => {
        const years = new Set([currentYear]);
        userContracts.forEach((c) => {
            if (c.date_debut) {
                const y = new Date(c.date_debut).getFullYear();
                if (!isNaN(y)) years.add(y);
            }
            if (c.date_echeance || c.date_fin) {
                const y = new Date(c.date_echeance || c.date_fin).getFullYear();
                if (!isNaN(y)) years.add(y);
            }
        });
        return Array.from(years).sort((a, b) => a - b);
    }, [userContracts, currentYear]);

    // Calcul de la Valeur Marchande par client au prorata temporis journalier
    const top10 = useMemo(() => {
        const map = {};

        // Définir les bornes de la période sélectionnée
        let pStart = null;
        let pEnd = null;

        if (modePeriode === 'mois') {
            pStart = new Date(selectedYear, selectedMonth, 1);
            pEnd = new Date(selectedYear, selectedMonth + 1, 0); // Dernier jour du mois
        } else if (modePeriode === 'annee') {
            pStart = new Date(selectedYear, 0, 1);
            pEnd = new Date(selectedYear, 11, 31);
        }

        userContracts.forEach((c) => {
            const statut = (c.nom_statut || c.statut || '').toLowerCase();
            if (statut.includes('archiv') || statut.includes('resili') || statut.includes('annul') || statut.includes('brouillon')) {
                return;
            }

            const cDebut = parseDateOnly(c.date_debut);
            const cFin = parseDateOnly(c.date_echeance || c.date_fin);
            if (!cDebut || !cFin) return;

            const tarifTotal = parseFloat(c.tarif) || 0;
            const dureeTotaleJours = getTotalContractDays(cDebut, cFin);
            const dailyRate = tarifTotal / dureeTotaleJours; // Valeur marchande par jour

            let valeurMarchandeContrat = 0;
            let joursActifsDansPeriode = 0;

            if (modePeriode === 'general') {
                valeurMarchandeContrat = tarifTotal;
                joursActifsDansPeriode = dureeTotaleJours;
            } else {
                // Calcul du nombre de jours réels d'activité dans la fenêtre choisie (ex: 15 sept au 30 sept = 16 jours)
                joursActifsDansPeriode = getActiveDaysInPeriod(cDebut, cFin, pStart, pEnd);

                if (joursActifsDansPeriode > 0) {
                    valeurMarchandeContrat = dailyRate * joursActifsDansPeriode;
                }
            }

            if (valeurMarchandeContrat > 0) {
                const clientNom = (c.nom_client || c.raison_sociale || `Client #${c.id_client || 'Inconnu'}`).trim();
                if (!map[clientNom]) {
                    map[clientNom] = {
                        nom: clientNom,
                        total: 0,
                        nbContrats: 0,
                        totalJoursActifs: 0
                    };
                }
                map[clientNom].total += valeurMarchandeContrat;
                map[clientNom].nbContrats += 1;
                map[clientNom].totalJoursActifs += joursActifsDansPeriode;
            }
        });

        const list = Object.values(map).sort((a, b) => b.total - a.total);
        const maxVal = list[0]?.total || 1;

        return {
            items: list.slice(0, 10).map((c, idx) => ({
                ...c,
                rang: idx + 1,
                pourcentageRelatif: Math.round((c.total / maxVal) * 100)
            })),
            totalTop: list.reduce((acc, c) => acc + c.total, 0)
        };
    }, [userContracts, modePeriode, selectedMonth, selectedYear]);

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
            {/* En-tête avec contrôles */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Trophy size={20} style={{ color: '#f59e0b' }} />
                    <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                            Top 10 Clients (Valeur Marchande)
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {modePeriode === 'mois'
                                ? `Valeur marchande prorata temporis (${MOIS_NOMS[selectedMonth]} ${selectedYear})`
                                : modePeriode === 'annee'
                                ? `Valeur marchande prorata temporis sur l'exercice ${selectedYear}`
                                : 'Valeur marchande cumulée des contrats actifs (tous exercices)'}
                        </span>
                    </div>
                </div>

                {/* Sélecteur de période et filtres temporels */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* Commutateur de mode */}
                    <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '3px' }}>
                        <button
                            type="button"
                            onClick={() => setModePeriode('mois')}
                            style={{
                                background: modePeriode === 'mois' ? 'var(--accent-primary, #06b6d4)' : 'transparent',
                                color: modePeriode === 'mois' ? '#fff' : 'var(--text-muted)',
                                border: 'none',
                                borderRadius: '7px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '0.3rem 0.75rem',
                                cursor: 'pointer'
                            }}
                        >
                            Mois
                        </button>
                        <button
                            type="button"
                            onClick={() => setModePeriode('annee')}
                            style={{
                                background: modePeriode === 'annee' ? 'var(--accent-primary, #06b6d4)' : 'transparent',
                                color: modePeriode === 'annee' ? '#fff' : 'var(--text-muted)',
                                border: 'none',
                                borderRadius: '7px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '0.3rem 0.75rem',
                                cursor: 'pointer'
                            }}
                        >
                            Année
                        </button>
                        <button
                            type="button"
                            onClick={() => setModePeriode('general')}
                            style={{
                                background: modePeriode === 'general' ? 'var(--accent-primary, #06b6d4)' : 'transparent',
                                color: modePeriode === 'general' ? '#fff' : 'var(--text-muted)',
                                border: 'none',
                                borderRadius: '7px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '0.3rem 0.75rem',
                                cursor: 'pointer'
                            }}
                        >
                            Général
                        </button>
                    </div>

                    {/* Sélecteur de Mois (uniquement si mode === 'mois') */}
                    {modePeriode === 'mois' && (
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: '#fff',
                                border: '1px solid var(--border-glass)',
                                borderRadius: '8px',
                                padding: '0.3rem 0.6rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            {MOIS_NOMS.map((m, idx) => (
                                <option key={idx} value={idx} style={{ background: '#1e293b', color: '#fff' }}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Sélecteur d'Année (si mode === 'mois' ou mode === 'annee') */}
                    {(modePeriode === 'mois' || modePeriode === 'annee') && (
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: '#fff',
                                border: '1px solid var(--border-glass)',
                                borderRadius: '8px',
                                padding: '0.3rem 0.6rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            {availableYears.map((y) => (
                                <option key={y} value={y} style={{ background: '#1e293b', color: '#fff' }}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Liste des Bâtons du Top 10 */}
            {top10.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                    Aucun contrat actif facturable pour la période sélectionnée ({modePeriode === 'mois' ? `${MOIS_NOMS[selectedMonth]} ${selectedYear}` : selectedYear}).
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    {top10.items.map((client) => {
                        const isPodium = client.rang <= 3;
                        const podiumColor = client.rang === 1 ? '#f59e0b' : client.rang === 2 ? '#94a3b8' : '#d97706';

                        return (
                            <div key={client.nom} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '6px',
                                            background: isPodium ? podiumColor : 'rgba(255, 255, 255, 0.08)',
                                            color: isPodium ? '#000' : 'var(--text-muted)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 800,
                                            fontSize: '0.75rem'
                                        }}>
                                            {client.rang}
                                        </span>
                                        <strong style={{ color: '#fff' }}>{client.nom}</strong>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            ({client.nbContrats} contrat{client.nbContrats > 1 ? 's' : ''}{modePeriode !== 'general' ? ` · ${client.totalJoursActifs}j` : ''})
                                        </span>
                                    </div>

                                    <strong style={{ color: isPodium ? podiumColor : '#06b6d4', fontSize: '0.85rem' }}>
                                        {formatDevise(client.total)}
                                        {modePeriode === 'mois' ? (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}> (sur {client.totalJoursActifs}j)</span>
                                        ) : modePeriode === 'annee' ? (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}> /an</span>
                                        ) : (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}> total</span>
                                        )}
                                    </strong>
                                </div>

                                {/* Bâton horizontal */}
                                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${client.pourcentageRelatif}%`,
                                        height: '100%',
                                        background: client.rang === 1
                                            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                            : client.rang === 2
                                                ? 'linear-gradient(90deg, #94a3b8, #cbd5e1)'
                                                : client.rang === 3
                                                    ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                                                    : 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                                        borderRadius: '999px',
                                        transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
