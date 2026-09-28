import React, { useState, useMemo } from 'react';
import { MapPin, Flame } from 'lucide-react';

export default function OccupationParZoneWidget({
    emplacements = [],
    userContracts = []
}) {
    const [vueOnglet, setVueOnglet] = useState('occupation'); // 'occupation' | 'popularite'

    // 1. Calcul du taux d'occupation par zone
    const statsParZone = useMemo(() => {
        const map = {};

        emplacements.forEach((s) => {
            const zone = s.nom_zone || s.nom_lieu || 'Zone Générale';
            if (!map[zone]) {
                map[zone] = { total: 0, occupes: 0, disponibles: 0 };
            }
            map[zone].total += 1;
            const st = (s.statut || s.etat || '').toLowerCase();
            if (st === 'occupé' || st === 'occupe' || s.id_type_etat === 3) {
                map[zone].occupes += 1;
            } else {
                map[zone].disponibles += 1;
            }
        });

        return Object.entries(map).map(([zone, d]) => ({
            zone,
            total: d.total,
            occupes: d.occupes,
            disponibles: d.disponibles,
            taux: Math.round((d.occupes / d.total) * 100)
        })).sort((a, b) => b.taux - a.taux);
    }, [emplacements]);

    // 2. Calcul de popularité (nombre total de réservations / contrats par zone)
    const populariteZones = useMemo(() => {
        const map = {};

        userContracts.forEach((c) => {
            const statut = (c.nom_statut || c.statut || '').toLowerCase();
            if (statut.includes('archiv') || statut.includes('resili')) return;

            const direct = (c.reference_emplacement || '').trim();
            const associes = (c.supports_associes || '')
                .split(/[,;]+/)
                .map((s) => s.trim())
                .filter(Boolean);

            const allRefs = new Set([direct, ...associes].filter(Boolean));

            allRefs.forEach((ref) => {
                const emp = emplacements.find((e) => e.reference === ref);
                const zone = emp?.nom_zone || emp?.nom_lieu || 'Zone Principale';
                map[zone] = (map[zone] || 0) + 1;
            });
        });

        const maxOccur = Math.max(...Object.values(map), 1);
        return Object.entries(map)
            .map(([zone, count]) => ({
                zone,
                count,
                pourcentageRelatif: Math.round((count / maxOccur) * 100)
            }))
            .sort((a, b) => b.count - a.count);
    }, [emplacements, userContracts]);

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
            {/* En-tête et Bascule d'affichage */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {vueOnglet === 'occupation' ? (
                        <MapPin size={20} style={{ color: '#10b981' }} />
                    ) : (
                        <Flame size={20} style={{ color: '#f59e0b' }} />
                    )}
                    <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                            {vueOnglet === 'occupation' ? "Taux d'Occupation par Zone" : "Indice de Popularité des Zones"}
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {vueOnglet === 'occupation'
                                ? "Rapport des supports occupés sur la capacité de chaque zone"
                                : "Zones les plus demandées par les annonceurs"}
                        </span>
                    </div>
                </div>

                {/* Boutons d'onglets */}
                <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '3px' }}>
                    <button
                        type="button"
                        onClick={() => setVueOnglet('occupation')}
                        style={{
                            background: vueOnglet === 'occupation' ? 'var(--accent-primary, #06b6d4)' : 'transparent',
                            color: vueOnglet === 'occupation' ? '#fff' : 'var(--text-muted)',
                            border: 'none',
                            borderRadius: '7px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.3rem 0.75rem',
                            cursor: 'pointer'
                        }}
                    >
                        Occupation
                    </button>
                    <button
                        type="button"
                        onClick={() => setVueOnglet('popularite')}
                        style={{
                            background: vueOnglet === 'popularite' ? '#f59e0b' : 'transparent',
                            color: vueOnglet === 'popularite' ? '#000' : 'var(--text-muted)',
                            border: 'none',
                            borderRadius: '7px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.3rem 0.75rem',
                            cursor: 'pointer'
                        }}
                    >
                        Popularité 🔥
                    </button>
                </div>
            </div>

            {/* Vue 1 : Taux d'Occupation par Zone (Diagramme en bâtons) */}
            {vueOnglet === 'occupation' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {statsParZone.map((z) => {
                        const color = z.taux >= 70 ? '#10b981' : z.taux >= 40 ? '#06b6d4' : '#ef4444';
                        return (
                            <div key={z.zone} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>{z.zone}</span>
                                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>
                                            Occupés : <strong style={{ color: '#fff' }}>{z.occupes}</strong>/{z.total}
                                        </span>
                                        <strong style={{ color }}>{z.taux}%</strong>
                                    </div>
                                </div>

                                <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${z.taux}%`,
                                        height: '100%',
                                        background: color,
                                        borderRadius: '999px',
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Vue 2 : Popularité des Zones (Volume de contrats) */}
            {vueOnglet === 'popularite' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {populariteZones.map((z, idx) => (
                        <div key={z.zone} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#f8fafc' }}>
                                    <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>#{idx + 1}</span>
                                    {z.zone}
                                </span>
                                <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.8rem' }}>
                                    {z.count} contrat{z.count > 1 ? 's' : ''}
                                </span>
                            </div>

                            <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${z.pourcentageRelatif}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                                    borderRadius: '999px',
                                    transition: 'width 0.5s ease'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
