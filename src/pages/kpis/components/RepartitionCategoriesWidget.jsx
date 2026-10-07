import React, { useMemo } from 'react';
import { PieChart } from 'lucide-react';

const PALETTE = [
    { fill: '#2563eb', glow: 'rgba(37, 99, 235, 0.4)' }, // Bleu Royal AeroPub
    { fill: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' }, // Cyan
    { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' }, // Émeraude
    { fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' }, // Ambre
    { fill: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' }, // Violet
    { fill: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)' }, // Rose
    { fill: '#14b8a6', glow: 'rgba(20, 184, 166, 0.4)' }  // Turquoise
];

// Nettoie les encodages mal convertis (ex: 'arriv‚e' -> 'arrivée')
const sanitizeText = (txt) => {
    if (!txt) return '';
    return String(txt).replace(/‚/g, 'é').replace(/Ext‚rieur/g, 'Extérieur');
};

export default function RepartitionCategoriesWidget({
    emplacements = [],
    onSelectCategory
}) {
    const stats = useMemo(() => {
        const total = emplacements.length || 0;
        if (total === 0) {
            return { total: 0, items: [] };
        }

        const map = {};

        emplacements.forEach((emp) => {
            const rawCat = emp.nom_categorie || emp.categorie || emp.nom_type_support || emp.nom_type || 'Statique';
            const cat = sanitizeText(rawCat);
            if (!map[cat]) {
                map[cat] = { count: 0, occupes: 0 };
            }
            map[cat].count += 1;
            const st = (emp.statut || emp.etat || '').toLowerCase();
            if (st === 'occupé' || st === 'occupe' || emp.id_type_etat === 3) {
                map[cat].occupes += 1;
            }
        });

        // Circonférence du Donut SVG (2 * PI * 54 = 339.292)
        const radius = 54;
        const circumference = 2 * Math.PI * radius;
        let runningOffset = 0;

        const entries = Object.entries(map).sort((a, b) => b[1].count - a[1].count);

        const items = entries.map(([nom, d], idx) => {
            const color = PALETTE[idx % PALETTE.length];
            const pct = Math.max(1, Math.round((d.count / total) * 100));
            const arcLength = (d.count / total) * circumference;
            const dashArray = `${arcLength} ${circumference}`;
            const dashOffset = -runningOffset;
            runningOffset += arcLength;

            return {
                nom,
                count: d.count,
                occupes: d.occupes,
                disponibles: d.count - d.occupes,
                pourcentage: pct,
                color: color.fill,
                glow: color.glow,
                dashArray,
                dashOffset
            };
        });

        return { total, items, circumference, radius };
    }, [emplacements]);

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
            {/* En-tête du widget */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <PieChart size={20} style={{ color: 'var(--accent-primary, #2563eb)', flexShrink: 0 }} />
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', lineHeight: 1.3 }}>
                        Répartition par Catégorie de Support
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, display: 'block' }}>
                        Inventaire des faces publicitaires selon leur nature
                    </span>
                </div>
            </div>

            {stats.total === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    Aucun support répertorié pour le moment.
                </div>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.25rem', justifyContent: 'center', width: '100%' }}>
                    {/* Donut SVG 100% compatible Firefox, Chrome, Safari */}
                    <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="130" height="130" viewBox="0 0 130 130">
                            {/* Rotation au centre (65, 65) via <g> standardisé pour Firefox */}
                            <g transform="rotate(-90 65 65)">
                                {/* Anneau d'arrière-plan */}
                                <circle
                                    cx="65"
                                    cy="65"
                                    r={stats.radius || 54}
                                    fill="transparent"
                                    stroke="var(--border-glass, rgba(148, 163, 184, 0.2))"
                                    strokeWidth="14"
                                />
                                {/* Segments du Donut */}
                                {stats.items.map((item, idx) => (
                                    <circle
                                        key={idx}
                                        cx="65"
                                        cy="65"
                                        r={stats.radius || 54}
                                        fill="transparent"
                                        stroke={item.color}
                                        strokeWidth="14"
                                        strokeDasharray={item.dashArray}
                                        strokeDashoffset={item.dashOffset}
                                        style={{ transition: 'stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease' }}
                                    />
                                ))}
                            </g>
                        </svg>

                        {/* Centre du Donut */}
                        <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                            <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', display: 'block', lineHeight: 1 }}>
                                {stats.total}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Supports
                            </span>
                        </div>
                    </div>

                    {/* Liste détaillée des catégories avec barres de progression */}
                    <div style={{ flex: '1 1 200px', width: '100%', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {stats.items.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => onSelectCategory && onSelectCategory(item.nom)}
                                style={{
                                    width: '100%',
                                    cursor: onSelectCategory ? 'pointer' : 'default',
                                    padding: '0.2rem 0'
                                }}
                                title={onSelectCategory ? `Filtrer par ${item.nom}` : undefined}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '0.3rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-main)', fontWeight: 600 }}>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color, display: 'inline-block', flexShrink: 0 }} />
                                        <span>{item.nom}</span>
                                    </span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                        <strong style={{ color: 'var(--text-main)' }}>{item.count}</strong> ({item.pourcentage}%)
                                    </span>
                                </div>

                                {/* Barre de proportion fluide */}
                                <div style={{
                                    width: '100%',
                                    height: '7px',
                                    background: 'var(--border-glass, rgba(148, 163, 184, 0.2))',
                                    borderRadius: '999px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${item.pourcentage}%`,
                                        height: '100%',
                                        background: item.color,
                                        borderRadius: '999px',
                                        transition: 'width 0.4s ease'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}