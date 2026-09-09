import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { emplacementsApi } from '../../../api';
import './ChangeEmplacementModal.css';

const PAGE_SIZE = 5;

export default function ChangeEmplacementModal({
  aeroports = [],
  zones = [],
  emplacements = [],
  onClose,
  onSuccess
}) {
  // 1. Colonne de Gauche (Source)
  const [sourceAeroIndex, setSourceAeroIndex] = useState(0);
  const [sourceZoneIndex, setSourceZoneIndex] = useState(0);
  const [sourcePage, setSourcePage] = useState(1);

  // 2. Colonne de Droite (Destination)
  const [targetAeroIndex, setTargetAeroIndex] = useState(0);
  const [targetZoneIndex, setTargetZoneIndex] = useState(1);
  const [targetPage, setTargetPage] = useState(1);

  // État de survol Drag & Drop
  const [isDragOverTarget, setIsDragOverTarget] = useState(false);
  const [isDragOverSource, setIsDragOverSource] = useState(false);

  // État de confirmation (NON / OUI)
  const [pendingTransfer, setPendingTransfer] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- FILTRAGE COLONNE GAUCHE ---
  const sourceAero = aeroports[sourceAeroIndex] || null;

  useEffect(() => {
    setSourceZoneIndex(0);
    setSourcePage(1);
  }, [sourceAeroIndex]);

  const sourceAeroZones = useMemo(() => {
    return zones.filter(zone => {
      if (!sourceAero) return true;
      return (
        (zone.id_aeroport && sourceAero.id && Number(zone.id_aeroport) === Number(sourceAero.id)) ||
        (zone.nom_aeroport && sourceAero.nom && zone.nom_aeroport.toLowerCase() === sourceAero.nom.toLowerCase())
      );
    });
  }, [zones, sourceAero]);

  const sourceZone = sourceAeroZones[sourceZoneIndex] || null;

  useEffect(() => {
    setSourcePage(1);
  }, [sourceZoneIndex]);

  const sourceEmplacements = useMemo(() => {
    return emplacements.filter(emp => {
      if (!sourceZone) {
        if (!sourceAero) return true;
        return (
          (emp.id_aeroport && sourceAero.id && Number(emp.id_aeroport) === Number(sourceAero.id)) ||
          (emp.nom_aeroport && sourceAero.nom && emp.nom_aeroport.toLowerCase() === sourceAero.nom.toLowerCase())
        );
      }
      return (
        (emp.id_zone && sourceZone.id && Number(emp.id_zone) === Number(sourceZone.id)) ||
        (emp.nom_zone && sourceZone.nom_zone && emp.nom_zone.toLowerCase() === sourceZone.nom_zone.toLowerCase()) ||
        (emp.id_localisation && sourceZone.id && Number(emp.id_localisation) === Number(sourceZone.id))
      );
    });
  }, [emplacements, sourceZone, sourceAero]);

  const totalSourcePages = Math.max(1, Math.ceil(sourceEmplacements.length / PAGE_SIZE));
  const paginatedSourceEmps = useMemo(() => {
    const start = (sourcePage - 1) * PAGE_SIZE;
    return sourceEmplacements.slice(start, start + PAGE_SIZE);
  }, [sourceEmplacements, sourcePage]);

  // Set des références présentes dans la colonne de gauche pour les exclure de droite
  const sourceRefsSet = useMemo(() => {
    return new Set(sourceEmplacements.map(e => e.reference));
  }, [sourceEmplacements]);

  // --- FILTRAGE COLONNE DROITE ---
  const targetAero = aeroports[targetAeroIndex] || null;

  useEffect(() => {
    setTargetPage(1);
  }, [targetAeroIndex]);

  const targetAeroZones = useMemo(() => {
    return zones.filter(zone => {
      if (!targetAero) return true;
      return (
        (zone.id_aeroport && targetAero.id && Number(zone.id_aeroport) === Number(targetAero.id)) ||
        (zone.nom_aeroport && targetAero.nom && zone.nom_aeroport.toLowerCase() === targetAero.nom.toLowerCase())
      );
    });
  }, [zones, targetAero]);

  // Si même aéroport et plusieurs zones, faire pointer targetZoneIndex sur une zone différente
  useEffect(() => {
    if (targetAeroIndex === sourceAeroIndex && targetAeroZones.length > 1) {
      if (targetZoneIndex === sourceZoneIndex) {
        setTargetZoneIndex((sourceZoneIndex + 1) % targetAeroZones.length);
      }
    }
  }, [targetAeroIndex, sourceAeroIndex, sourceZoneIndex, targetAeroZones.length]);

  const safeTargetZoneIndex = targetAeroZones.length > 0 ? (targetZoneIndex % targetAeroZones.length) : 0;
  const targetZone = targetAeroZones[safeTargetZoneIndex] || null;

  useEffect(() => {
    setTargetPage(1);
  }, [targetZoneIndex]);

  // La colonne de droite n'affiche JAMAIS les emplacements de gauche
  const targetEmplacements = useMemo(() => {
    return emplacements.filter(emp => {
      // 1. Exclure tout emplacement affiché dans la colonne de gauche
      if (sourceRefsSet.has(emp.reference)) return false;

      // 2. Filtrer selon la zone cible
      if (!targetZone) {
        if (!targetAero) return true;
        return (
          (emp.id_aeroport && targetAero.id && Number(emp.id_aeroport) === Number(targetAero.id)) ||
          (emp.nom_aeroport && targetAero.nom && emp.nom_aeroport.toLowerCase() === targetAero.nom.toLowerCase())
        );
      }
      return (
        (emp.id_zone && targetZone.id && Number(emp.id_zone) === Number(targetZone.id)) ||
        (emp.nom_zone && targetZone.nom_zone && emp.nom_zone.toLowerCase() === targetZone.nom_zone.toLowerCase()) ||
        (emp.id_localisation && targetZone.id && Number(emp.id_localisation) === Number(targetZone.id))
      );
    });
  }, [emplacements, targetZone, targetAero, sourceRefsSet]);

  const totalTargetPages = Math.max(1, Math.ceil(targetEmplacements.length / PAGE_SIZE));
  const paginatedTargetEmps = useMemo(() => {
    const start = (targetPage - 1) * PAGE_SIZE;
    return targetEmplacements.slice(start, start + PAGE_SIZE);
  }, [targetEmplacements, targetPage]);

  // --- GESTION DU DRAG & DROP ---
  const handleDragStart = (e, emp, fromCol) => {
    const payload = {
      reference: emp.reference,
      originZoneId: emp.id_zone || emp.id_localisation || (fromCol === 'source' ? sourceZone?.id : targetZone?.id),
      originZoneName: emp.nom_zone || (fromCol === 'source' ? sourceZone?.nom_zone : targetZone?.nom_zone),
      fromCol
    };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.setData('text/plain', emp.reference);
  };

  const handleDropOnTarget = (e) => {
    e.preventDefault();
    setIsDragOverTarget(false);

    let dragData = null;
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) dragData = JSON.parse(raw);
    } catch {
      // fallback
    }

    const ref = dragData?.reference || e.dataTransfer.getData('text/plain');
    if (!ref) return;

    if (!targetZone) {
      toast.error('❌ Veuillez sélectionner une zone cible à droite.');
      return;
    }

    // Si on remet la référence dans la même colonne d'où on l'a prise -> aucune confirmation
    if (dragData?.fromCol === 'target') {
      return;
    }

    // Si la zone de destination est la même que la zone d'origine du support -> aucune confirmation
    const originZoneId = dragData?.originZoneId;
    if (originZoneId && targetZone?.id && Number(targetZone.id) === Number(originZoneId)) {
      return;
    }

    // Si les deux zones sélectionnées sont identiques -> aucune confirmation
    if (sourceZone && targetZone && Number(sourceZone.id) === Number(targetZone.id)) {
      return;
    }

    // Déclenche la modale de confirmation UNIQUEMENT si le déplacement est réel
    setPendingTransfer({
      reference: ref,
      fromZone: sourceZone,
      toZone: targetZone
    });
  };

  const handleDropOnSource = (e) => {
    e.preventDefault();
    setIsDragOverSource(false);

    let dragData = null;
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) dragData = JSON.parse(raw);
    } catch {
      // fallback
    }

    const ref = dragData?.reference || e.dataTransfer.getData('text/plain');
    if (!ref) return;

    if (!sourceZone) {
      toast.error('❌ Veuillez sélectionner une zone cible à gauche.');
      return;
    }

    // Si on remet la référence dans la même colonne d'où on l'a prise -> aucune confirmation
    if (dragData?.fromCol === 'source') {
      return;
    }

    // Si la zone de destination est la même que la zone d'origine du support -> aucune confirmation
    const originZoneId = dragData?.originZoneId;
    if (originZoneId && sourceZone?.id && Number(sourceZone.id) === Number(originZoneId)) {
      return;
    }

    // Si les deux zones sélectionnées sont identiques -> aucune confirmation
    if (sourceZone && targetZone && Number(sourceZone.id) === Number(targetZone.id)) {
      return;
    }

    // Déclenche la modale de confirmation UNIQUEMENT si le déplacement est réel
    setPendingTransfer({
      reference: ref,
      fromZone: targetZone,
      toZone: sourceZone
    });
  };

  // --- CONFIRMATION (OUI / NON) ---
  const handleConfirmTransfer = async () => {
    if (!pendingTransfer || !pendingTransfer.toZone?.id) return;
    setLoading(true);

    try {
      await emplacementsApi.update(pendingTransfer.reference, {
        id_zone: parseInt(pendingTransfer.toZone.id, 10)
      });

      toast.success(`🎉 Support « ${pendingTransfer.reference} » déplacé vers « ${pendingTransfer.toZone.nom_zone} » !`);
      setPendingTransfer(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Erreur lors du déplacement du support:', err);
      const msg = err.response?.data?.message || 'Erreur lors du changement d\'emplacement.';
      toast.error(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop-portal" onClick={onClose}>
      <div
        className="change-emp-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* EN-TÊTE DE LA MODALE */}
        <div className="change-emp-header">
          <h2 className="change-emp-title">
            <ArrowLeftRight size={22} style={{ color: 'var(--accent-primary)' }} />
            <span>Changer les Emplacements</span>
          </h2>
          <button
            type="button"
            className="pill-btn"
            onClick={onClose}
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          >
            Annuler
          </button>
        </div>

        {/* GRILLE 2 COLONNES KANBAN */}
        <div className="kanban-transfer-grid">
          {/* ================= COLONNE DE GAUCHE ================= */}
          <div
            className={`kanban-col ${isDragOverSource ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOverSource(true); }}
            onDragLeave={() => setIsDragOverSource(false)}
            onDrop={handleDropOnSource}
          >
            <div className="kanban-col-badge source">
              <span>Zone Source</span>
            </div>

            {/* Carrousel 1 : Aéroport */}
            <div className="kanban-nav-row">
              <button
                type="button"
                className="kanban-arrow-btn"
                onClick={() => setSourceAeroIndex(prev => prev > 0 ? prev - 1 : aeroports.length - 1)}
                disabled={aeroports.length <= 1}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="kanban-nav-box">
                <span className="kanban-nav-prefix">Aéroport :</span>
                <span className="kanban-nav-value">{sourceAero?.nom || 'Aucun'}</span>
              </div>
              <button
                type="button"
                className="kanban-arrow-btn"
                onClick={() => setSourceAeroIndex(prev => prev < aeroports.length - 1 ? prev + 1 : 0)}
                disabled={aeroports.length <= 1}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Carrousel 2 : Zone */}
            <div className="kanban-nav-row">
              <button
                type="button"
                className="kanban-arrow-btn"
                onClick={() => setSourceZoneIndex(prev => prev > 0 ? prev - 1 : sourceAeroZones.length - 1)}
                disabled={sourceAeroZones.length <= 1}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="kanban-nav-box">
                <span className="kanban-nav-prefix">Zone :</span>
                <span className="kanban-nav-value">{sourceZone?.nom_zone || 'Aucune zone'}</span>
              </div>
              <button
                type="button"
                className="kanban-arrow-btn"
                onClick={() => setSourceZoneIndex(prev => prev < sourceAeroZones.length - 1 ? prev + 1 : 0)}
                disabled={sourceAeroZones.length <= 1}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Liste des cartes Référence */}
            <div className="kanban-cards-list">
              {paginatedSourceEmps.length === 0 ? (
                <div className="kanban-empty-dropzone">
                  <span>Aucun support dans cette zone.</span>
                  <span style={{ fontSize: '0.78rem' }}>Glissez-déposez ici pour en ajouter.</span>
                </div>
              ) : (
                paginatedSourceEmps.map(emp => (
                  <div
                    key={emp.reference}
                    className="kanban-ref-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, emp, 'source')}
                    title="Glissez vers la colonne de droite pour déplacer"
                  >
                    <span className="kanban-ref-text">
                      REF : {emp.reference}
                    </span>
                    <span className="kanban-ref-sub">
                      {emp.nom_type_support || emp.nom_type || 'Standard'}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Gauche */}
            <div className="kanban-pagination">
              <button
                type="button"
                className="kanban-page-btn"
                onClick={() => setSourcePage(prev => Math.max(1, prev - 1))}
                disabled={sourcePage <= 1}
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalSourcePages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  type="button"
                  className={`kanban-page-btn ${sourcePage === p ? 'active' : ''}`}
                  onClick={() => setSourcePage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="kanban-page-btn"
                onClick={() => setSourcePage(prev => Math.min(totalSourcePages, prev + 1))}
                disabled={sourcePage >= totalSourcePages}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* ================= COLONNE DE DROITE ================= */}
          <div
            className={`kanban-col ${isDragOverTarget ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOverTarget(true); }}
            onDragLeave={() => setIsDragOverTarget(false)}
            onDrop={handleDropOnTarget}
          >
            <div className="kanban-col-badge target">
              <span>Zone Destination (Déposer ici)</span>
            </div>

            {/* Carrousel 1 : Aéroport */}
            <div className="kanban-nav-row">
              <button
                type="button"
                className="kanban-arrow-btn"
                onClick={() => setTargetAeroIndex(prev => prev > 0 ? prev - 1 : aeroports.length - 1)}
                disabled={aeroports.length <= 1}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="kanban-nav-box">
                <span className="kanban-nav-prefix">Aéro :</span>
                <span className="kanban-nav-value">{targetAero?.nom || 'Aucun'}</span>
              </div>
              <button
                type="button"
                className="kanban-arrow-btn"
                onClick={() => setTargetAeroIndex(prev => prev < aeroports.length - 1 ? prev + 1 : 0)}
                disabled={aeroports.length <= 1}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Carrousel 2 : Zone */}
            <div className="kanban-nav-row">
              <button
                type="button"
                className="kanban-arrow-btn"
                onClick={() => setTargetZoneIndex(prev => prev > 0 ? prev - 1 : targetAeroZones.length - 1)}
                disabled={targetAeroZones.length <= 1}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="kanban-nav-box">
                <span className="kanban-nav-prefix">Zone :</span>
                <span className="kanban-nav-value">{targetZone?.nom_zone || 'Aucune zone'}</span>
              </div>
              <button
                type="button"
                className="kanban-arrow-btn"
                onClick={() => setTargetZoneIndex(prev => prev < targetAeroZones.length - 1 ? prev + 1 : 0)}
                disabled={targetAeroZones.length <= 1}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Liste des cartes Référence */}
            <div className="kanban-cards-list">
              {paginatedTargetEmps.length === 0 ? (
                <div className="kanban-empty-dropzone">
                  {sourceZone && targetZone && Number(sourceZone.id) === Number(targetZone.id) ? (
                    <>
                      <span>Même zone sélectionnée qu'à gauche.</span>
                      <span style={{ fontSize: '0.78rem' }}>Choisissez une autre zone pour transférer des supports.</span>
                    </>
                  ) : (
                    <>
                      <span>Aucun support dans cette zone.</span>
                      <span style={{ fontSize: '0.78rem' }}>Glissez une référence depuis la gauche pour la transférer ici.</span>
                    </>
                  )}
                </div>
              ) : (
                paginatedTargetEmps.map(emp => (
                  <div
                    key={emp.reference}
                    className="kanban-ref-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, emp, 'target')}
                    title="Glissez vers la colonne de gauche si souhaité"
                  >
                    <span className="kanban-ref-text">
                      REF : {emp.reference}
                    </span>
                    <span className="kanban-ref-sub">
                      {emp.nom_type_support || emp.nom_type || 'Standard'}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Droite */}
            <div className="kanban-pagination">
              <button
                type="button"
                className="kanban-page-btn"
                onClick={() => setTargetPage(prev => Math.max(1, prev - 1))}
                disabled={targetPage <= 1}
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalTargetPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  type="button"
                  className={`kanban-page-btn ${targetPage === p ? 'active' : ''}`}
                  onClick={() => setTargetPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="kanban-page-btn"
                onClick={() => setTargetPage(prev => Math.min(totalTargetPages, prev + 1))}
                disabled={targetPage >= totalTargetPages}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ================= BOÎTE DE CONFIRMATION (NON / OUI) ================= */}
        {pendingTransfer && (
          <div className="confirm-overlay" onClick={() => setPendingTransfer(null)}>
            <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="confirm-question">
                Voulez vous vraiment effectuer le changement ?
              </h3>
              <p className="confirm-details">
                Déplacer le support <strong>REF : {pendingTransfer.reference}</strong>
                <br />
                vers la zone <strong>« {pendingTransfer.toZone?.nom_zone} »</strong>
                {pendingTransfer.toZone?.nom_aeroport ? ` (${pendingTransfer.toZone.nom_aeroport})` : ''} ?
              </p>

              <div className="confirm-actions">
                <button
                  type="button"
                  className="btn-confirm-no"
                  onClick={() => setPendingTransfer(null)}
                  disabled={loading}
                >
                  NON
                </button>
                <button
                  type="button"
                  className="btn-confirm-yes"
                  onClick={handleConfirmTransfer}
                  disabled={loading}
                >
                  {loading ? 'Enregistrement...' : 'OUI'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
