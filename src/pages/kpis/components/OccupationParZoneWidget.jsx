import React, { useState, useMemo } from 'react';
import { MapPin, Flame } from 'lucide-react';

// Nettoie les encodages mal convertis (ex: 'arriv‚e' -> 'arrivée')
const sanitizeText = (txt) => {
    if (!txt) return '';
    return String(txt).replace(/‚/g, 'é').replace(/Ext‚rieur/g, 'Extérieur');
};

export default function OccupationParZoneWidget({
    emplacements = [],
    userContracts = [],
    onSelectZone
}) {
    const [vueOnglet, setVueOnglet] = useState('occupation'); // 'occupation' | 'popularite'

    // 1. Calcul du taux d'occupation par zone
    const statsParZone = useMemo(() => {
        const map = {};

        emplacements.forEach((s) => {
            const rawZone = s.nom_zone || s.nom_lieu || s.type_zone || 'Zone Générale';
            const zone = sanitizeText(rawZone);
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
            taux: d.total > 0 ? Math.round((d.occupes / d.total) * 100) : 0
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
                const rawZone = emp?.nom_zone || emp?.nom_lieu || emp?.type_zone || 'Zone Principale';
                const zone = sanitizeText(rawZone);
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
        <div
            className="glass-panel"
            style={{
                padding: '1rem',
                borderRadius: '16px',
                border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.1))',
                width: '100%',
                boxSizing: 'border-box'
            }}
        >
            {/* En-tête et Bascule d'affichage responsive */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: '1 1 200px' }}>
                    {vueOnglet === 'occupation' ? (
                        <MapPin size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                    ) : (
                        <Flame size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    )}
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', lineHeight: 1.3 }}>
                            {vueOnglet === 'occupation' ? "Taux d'Occupation par Zone" : "Indice de Popularité des Zones"}
                        </h3>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, display: 'block' }}>
                            {vueOnglet === 'occupation'
                                ? "Rapport des supports occupés sur la capacité de chaque zone"
                                : "Zones les plus demandées par les annonceurs"}
                        </span>
                    </div>
                </div>

                {/* Boutons d'onglets tactiles (>= 44px hauteur, espacement >= 8px) */}
                <div style={{
                    display: 'flex',
                    background: 'var(--bg-glass, rgba(148, 163, 184, 0.12))',
                    borderRadius: '10px',
                    padding: '4px',
                    gap: '4px',
                    flexShrink: 0,
                    border: '1px solid var(--border-glass, rgba(148, 163, 184, 0.2))'
                }}>
                    <button
                        type="button"
                        onClick={() => setVueOnglet('occupation')}
                        style={{
                            background: vueOnglet === 'occupation' ? 'var(--accent-primary, #2563eb)' : 'transparent',
                            color: vueOnglet === 'occupation' ? '#ffffff' : 'var(--text-muted)',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            padding: '0.5rem 0.95rem',
                            minHeight: '44px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        Occupation
                    </button>
                    <button
                        type="button"
                        onClick={() => setVueOnglet('popularite')}
                        style={{
                            background: vueOnglet === 'popularite' ? '#f59e0b' : 'transparent',
                            color: vueOnglet === 'popularite' ? '#0f172a' : 'var(--text-muted)',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            padding: '0.5rem 0.95rem',
                            minHeight: '44px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        Popularité 🔥
                    </button>
                </div>
            </div>

            {/* Vue 1 : Taux d'Occupation par Zone (Diagramme en bâtons) */}
            {vueOnglet === 'occupation' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
                    {statsParZone.length === 0 ? (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                            Aucune zone répertoriée pour le moment.
                        </div>
                    ) : (
                        statsParZone.map((z) => {
                            const color = z.taux >= 70 ? '#10b981' : z.taux >= 40 ? '#06b6d4' : '#ef4444';
                            return (
                                <div
                                    key={z.zone}
                                    onClick={() => onSelectZone && onSelectZone(z.zone)}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.35rem',
                                        width: '100%',
                                        cursor: onSelectZone ? 'pointer' : 'default',
                                        padding: '0.15rem 0'
                                    }}
                                    title={onSelectZone ? `Filtrer par zone ${z.zone}` : undefined}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{z.zone}</span>
                                        <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.8rem', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>
                                                Occupés : <strong style={{ color: 'var(--text-main)' }}>{z.occupes}</strong>/{z.total}
                                            </span>
                                            <strong style={{ color, fontSize: '0.85rem' }}>{z.taux}%</strong>
                                        </div>
                                    </div>

                                    {/* Barre de progression avec contraste Dark & Light */}
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        background: 'var(--border-glass, rgba(148, 163, 184, 0.2))',
                                        borderRadius: '999px',
                                        overflow: 'hidden'
                                    }}>
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
                        })
                    )}
                </div>
            )}

            {/* Vue 2 : Popularité des Zones (Volume de contrats) */}
            {vueOnglet === 'popularite' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
                    {populariteZones.length === 0 ? (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                            Aucun contrat associé à une zone pour le moment.
                        </div>
                    ) : (
                        populariteZones.map((z, idx) => (
                            <div
                                key={z.zone}
                                onClick={() => onSelectZone && onSelectZone(z.zone)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.35rem',
                                    width: '100%',
                                    cursor: onSelectZone ? 'pointer' : 'default',
                                    padding: '0.15rem 0'
                                }}
                                title={onSelectZone ? `Filtrer par zone ${z.zone}` : undefined}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                        <span style={{ color: '#f59e0b', fontSize: '0.84rem' }}>#{idx + 1}</span>
                                        <span>{z.zone}</span>
                                    </span>
                                    <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.82rem' }}>
                                        {z.count} contrat{z.count > 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Barre de progression avec contraste Dark & Light */}
                                <div style={{
                                    width: '100%',
                                    height: '8px',
                                    background: 'var(--border-glass, rgba(148, 163, 184, 0.2))',
                                    borderRadius: '999px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${z.pourcentageRelatif}%`,
                                        height: '100%',
                                        background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                                        borderRadius: '999px',
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
