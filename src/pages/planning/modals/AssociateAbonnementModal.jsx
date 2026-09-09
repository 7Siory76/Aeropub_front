import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import { abonnementsApi } from '../../../api';
import SearchableClientSelect from '../components/SearchableClientSelect';

export default function AssociateAbonnementModal({
    targetEmp,
    clients = [],
    abonnements = [],
    selectedDate,
    onClose,
    onSuccess
}) {
    // 1. États internes propres au formulaire
    const [clientId, setClientId] = useState(clients[0]?.id || '');
    const [startDate, setStartDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);

    // Date de fin par défaut (+1 an)
    const defaultEnd = () => {
        const d = new Date(selectedDate || new Date());
        d.setFullYear(d.getFullYear() + 1);
        return d.toISOString().split('T')[0];
    }
    const [endDate, setEndDate] = useState(defaultEnd());
    const [duree, setDuree] = useState('1 an');
    const [dureeValeur, setDureeValeur] = useState(1);
    const [dureeUnite, setDureeUnite] = useState('an');
    const [facture, setFacture] = useState('');
    const [loading, setLoanding] = useState(false);

    const getDureeContratText = (val, unite) => {
        const n = parseInt(val, 10) || 1;
        if (unite === 'an') {
            return `${n} ${n > 1 ? 'ans' : 'an'}`;
        }
        return `${n} mois`;
    };

    useEffect(() => {
        if (!startDate) return;

        // Décomposition pour éviter tout problème de décalage de fuseau horaire
        const [year, month, day] = startDate.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        const val = parseInt(dureeValeur, 10) || 1;
        if (dureeUnite === 'an') {
            d.setFullYear(d.getFullYear() + val);
        } else if (dureeUnite === 'mois') {
            d.setMonth(d.getMonth() + val);
        }
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        setEndDate(`${y}-${m}-${dayStr}`);
    }, [startDate, dureeValeur, dureeUnite]);

    //2. Soumission du formulaire
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!clientId || !startDate || !endDate) {
            toast.error('Veuillez remplir tous les champs du formulaire.');
            return;
        }
        setLoanding(true);
        try {
            if (new Date(startDate) > new Date(endDate)) {
                toast.error('La date de fin doit etre posterieure a la date de debut.');
                return;
            }

            const targetRef = String(targetEmp.reference).trim().toUpperCase();
            const newStart = new Date(startDate).getTime();
            const newEnd = new Date(endDate).getTime();

            const conflictAbo = abonnements.find(abo => {
                const aboRef = String(abo.reference_emplacement || abo.reference_support || '').trim().toUpperCase();
                if (aboRef !== targetRef) return false;
                if (abo.statut === 'Résilié' || abo.statut === 'Annulé') return false;

                const existStart = new Date(abo.date_debut).getTime();
                const existEnd = new Date(abo.date_fin || abo.date_echeance).getTime();

                if (isNaN(existStart) || isNaN(existEnd)) return false;

                //verifier le chevauchement
                return newStart <= existEnd && newEnd >= existStart;
            });

            if (conflictAbo) {
                const dDebut = new Date(conflictAbo.date_debut).toLocaleDateString('fr-Fr');
                const dFin = new Date(conflictAbo.date_fin || conflictAbo.date_echeance).toLocaleDateString('fr-Fr');
                const clientNom = conflictAbo.nom_client || conflictAbo.raison_sociale || 'un client';
                toast.error(
                    `❌ Conflit de période : cet emplacement est déjà réservé du ${dDebut} au ${dFin} par ${clientNom}.`
                );
                return;
            }

            await abonnementsApi.create({
                reference_emplacement: targetEmp.reference,
                reference: targetEmp.reference,
                id_client: parseInt(clientId, 10),
                date_debut: startDate,
                date_fin: endDate,
                duree_contrat: duree,
                ref_facture: facture
            });

            toast.success(`Nouvel abonnement associe a ${targetEmp.refence} avec succes !`);
            onClose();
            if (onSuccess) onSuccess(); // Rafraîchit les données du planning
        } catch (err) {
            console.error(`Erreur association abonnement:`, err);
            const msg = err.response?.data?.message || "Erreur lors de la creation de l'abonnement.";
            toast.error(`${msg}`);
        } finally {
            setLoanding(false);
        }
    };
    // 3. Téléportation dans le <body> avec createPortal
    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose} type="button">
                    <X size={20} />
                </button>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    📝 Associer un Abonnement
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Emplacement sélectionné : <strong style={{ color: '#6366f1' }}>{targetEmp.reference}</strong> ({targetEmp.nom_type_support || 'Support Standard'} - {targetEmp.ref_format || targetEmp.caracteristiques || 'Format N/A'})
                </p>
                <form onSubmit={handleSubmit}>
                    {/* Sélection Client */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                            Sélectionner un Client :
                        </label>
                        <SearchableClientSelect
                            clients={clients}
                            selectedClientId={clientId}
                            onChange={(val) => setClientId(val)}
                        />
                    </div>
                    {/* Durée & Facture */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                                Durée du contrat :
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {/* Choix du nombre : 1, 2, 3, etc. */}
                                <input
                                    type="number"
                                    min="1"
                                    max="120"
                                    className="search-input"
                                    style={{ borderRadius: '10px', padding: '0.65rem 0.85rem', width: '80px', textAlign: 'center' }}
                                    value={dureeValeur}
                                    onChange={(e) => setDureeValeur(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                />
                                {/* Choix de l'unité : An(s) ou Mois */}
                                <select
                                    className="search-input"
                                    style={{ borderRadius: '10px', padding: '0.65rem 0.85rem', flex: 1 }}
                                    value={dureeUnite}
                                    onChange={(e) => setDureeUnite(e.target.value)}
                                >
                                    <option value="an">An(s)</option>
                                    <option value="mois">Mois</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                                Référence Facture / Cde :
                            </label>
                            <input
                                type="text"
                                className="search-input"
                                style={{ borderRadius: '10px', padding: '0.65rem 0.85rem' }}
                                placeholder="ex: FA 240"
                                value={facture}
                                onChange={(e) => setFacture(e.target.value)}
                            />
                        </div>
                    </div>
                    {/* Dates Début / Fin */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                                Date de début :
                            </label>
                            <input
                                type="date"
                                className="search-input"
                                style={{ borderRadius: '10px', padding: '0.65rem 0.85rem' }}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                                Date de fin :
                            </label>
                            <input
                                type="date"
                                className="search-input"
                                style={{ borderRadius: '10px', padding: '0.65rem 0.85rem' }}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                    {/* Boutons d'action */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
                            Annuler
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Validation en cours...' : "Valider l'Abonnement"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}