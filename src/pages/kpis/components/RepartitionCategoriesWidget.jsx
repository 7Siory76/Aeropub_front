import React, { useMemo } from 'react';
import { PieChart, Layers } from 'lucide-react';

const PALETTE = [
    { fill: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' }, // Cyan
    { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' }, // Émeraude
    { fill: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' }, // Violet
    { fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' }, // Ambre
    { fill: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)' }, // Rose
    { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' }, // Bleu
    { fill: '#14b8a6', glow: 'rgba(20, 184, 166, 0.4)' }  // Turquoise
];

export default function RepartitionCategoriesWidget({
    emplacements = []
}) {
    const stats = useMemo(() => {
        const total = emplacements.length || 1;
        const map = {};

        emplacements.forEach((emp) => {
            const cat = emp.nom_categorie || 'Non catégorisé';
            if (!map[cat]) {
                map[cat] = { count: 0, occupes: 0 };
            }
            map[cat].count += 1;
            const st = (emp.statut || emp.etat || '').toLowerCase();
            if (st === 'occupé' || st === 'occupe' || emp.id_type_etat === 3) {
                map[cat].occupes += 1;
            }
        });

        const items = Object.entries(map).map(([nom, d], idx) => {
            const color = PALETTE[idx % PALETTE.length];
            const pourcentage = Math.round((d.count / total) * 100);
            return {
                nom,
                count: d.count,
                occupes: d.occupes,
                disponibles: d.count - d.occupes,
                pourcentage,
                color: color.fill,
                glow: color.glow
            };
        }).sort((a, b) => b.count - a.count);
        return { total: emplacements.length, items };
    }, [emplacements])

    // calccul du tracé circulaire du Donut SVG (circonference = 2* pi *r)
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
            {/* En-tête du widget */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <PieChart size={20} style={{ color: '#06b6d4' }} />
                <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                        Répartition par Catégorie de Support
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Inventaire des faces publicitaires selon leur nature
                    </span>
                </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', justifyContent: 'center' }}>
                {/* Donut SVG interactif */}
                <div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: 'rotate(-90deg)' }}>
                        {/* Anneau d'arrière-plan */}
                        <circle
                            cx="75"
                            cy="75"
                            r={radius}
                            fill="transparent"
                            stroke="rgba(255, 255, 255, 0.06)"
                            strokeWidth="16"
                        />
                        {/* Segments du Donut */}
                        {stats.items.map((item, idx) => {
                            const strokeDasharray = `${(item.pourcentage / 100) * circumference} ${circumference}`;
                            const strokeDashoffset = -accumulatedOffset;
                            accumulatedOffset += (item.pourcentage / 100) * circumference;
                            return (
                                <circle
                                    key={idx}
                                    cx="75"
                                    cy="75"
                                    r={radius}
                                    fill="transparent"
                                    stroke={item.color}
                                    strokeWidth="16"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    style={{ transition: 'all 0.5s ease' }}
                                />
                            );
                        })}
                    </svg>
                    {/* Centre du Donut */}
                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', display: 'block', lineHeight: 1 }}>
                            {stats.total}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Supports
                        </span>
                    </div>
                </div>
                {/* Liste détaillée des catégories */}
                <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {stats.items.map((item, idx) => (
                        <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#f8fafc', fontWeight: 600 }}>
                                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: item.color, display: 'inline-block' }} />
                                    {item.nom}
                                </span>
                                <span style={{ color: 'var(--text-muted)' }}>
                                    <strong style={{ color: '#fff' }}>{item.count}</strong> ({item.pourcentage}%)
                                </span>
                            </div>
                            {/* Barre de proportion */}
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{ width: `${item.pourcentage}%`, height: '100%', background: item.color, borderRadius: '999px' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}