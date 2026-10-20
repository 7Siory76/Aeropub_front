import { useState, useRef, useEffect } from 'react';
import {
    UploadCloud,
    FileSpreadsheet,
    CheckCircle2,
    AlertTriangle,
    FileText,
    RotateCcw,
    Loader2,
    Database,
    Users,
    CalendarCheck,
    ChevronRight,
    Trash2
} from 'lucide-react';
import { csvApi } from '../../api';
import { useFeedback } from '../../context/FeedbackContext';
import PurgeDataModal from './modals/PurgeDataModal';

import './ImportPage.css';

export default function ImportPage({ onImportSuccess }) {
    const { showSuccess, showError, showInfo } = useFeedback();

    const [activeModule, setActiveModule] = useState('infrastructure');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rapport, setRapport] = useState(null);
    const [showPurgeModal, setShowPurgeModal] = useState(false);

    const fileInputRef = useRef(null);
    const reportRef = useRef(null);

    useEffect(() => {
        if (rapport && reportRef.current) {
            reportRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [rapport]);

    // Gestion du Drag & Drop
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            validateAndSetFile(files[0]);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    const validateAndSetFile = (file) => {
        if (!file.name.toLowerCase().endsWith('.csv')) {
            showError("Format invalide : Veuillez sélectionner un fichier avec l'extension .csv");
            return;
        }
        setSelectedFile(file);
        setRapport(null);
    };

    const handleReset = () => {
        setSelectedFile(null);
        setRapport(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleStartImport = async () => {
        if (!selectedFile) {
            showInfo('Veuillez d’abord choisir un fichier CSV.');
            return;
        }

        setLoading(true);
        setRapport(null);

        try {
            const response = activeModule === 'infrastructure'
                ? await csvApi.importInfrastructure(selectedFile)
                : activeModule === 'clients'
                    ? await csvApi.importClients(selectedFile)
                    : await csvApi.importAbonnements(selectedFile);

            const data = response.data;
            setRapport(data);

            if (activeModule === 'clients') {
                if (data.clientsCrees > 0 || (data.contactsCrees || 0) > 0) {
                    showSuccess(`Succès : ${data.clientsCrees} client(s) créé(s) et ${data.contactsCrees || 0} contact(s) associé(s).`);
                    if (onImportSuccess) onImportSuccess();
                } else if (data.erreursCount > 0) {
                    showError(`L'importation s'est terminée avec ${data.erreursCount} erreur(s).`);
                } else {
                    showInfo('Aucune nouvelle ligne ajoutée (tous les clients et contacts existent déjà).');
                }
            } else if (activeModule === 'abonnements') {
                if (data.abonnementsCrees > 0) {
                    showSuccess(`Succès : ${data.abonnementsCrees} abonnement(s) créé(s) et ${data.supportsLies || 0} support(s) lié(s).`);
                    if (onImportSuccess) onImportSuccess();
                } else if (data.erreursCount > 0) {
                    showError(`L'importation s'est terminée avec ${data.erreursCount} erreur(s).`);
                } else {
                    showInfo('Aucune nouvelle ligne ajoutée (tous les abonnements existent déjà).');
                }
            } else {
                if (data.lignesImportees > 0) {
                    showSuccess(`Succès : ${data.lignesImportees} support(s) importé(s) dans la base.`);
                    if (onImportSuccess) onImportSuccess();
                } else if (data.erreursCount > 0) {
                    showError(`L'importation s'est terminée avec ${data.erreursCount} erreur(s).`);
                } else {
                    showInfo('Aucune nouvelle ligne ajoutée (tous les supports existent déjà).');
                }
            }
        } catch (err) {
            const message = err.response?.data?.message || err.message || "Erreur lors de l'importation.";
            showError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="import-page-container">
            <div className="import-page-header">
                <div>
                    <h1 className="import-page-title">
                        <Database size={26} className="title-icon" />
                        Centre d'Importation & Synchronisation de Données
                    </h1>
                    <p className="import-page-subtitle">
                        Importez vos fichiers CSV en respectant les 4 niveaux de contrôle (Format, Structure, Doublons & Intégrité transactionnelle).
                    </p>
                </div>
                <button
                    type="button"
                    className="btn-purge-trigger"
                    onClick={() => setShowPurgeModal(true)}
                    title="Purger / Réinitialiser sélectivement les tables de données"
                >
                    <Trash2 size={16} />
                    <span>Nettoyer les données</span>
                </button>
            </div>

            <div className="import-modules-grid">
                {/* Module 1 : Infrastructure (Actif) */}
                <div
                    className={`import-module-card ${activeModule === 'infrastructure' ? 'active' : ''}`}
                    onClick={() => setActiveModule('infrastructure')}
                >
                    <div className="module-card-icon active-icon">
                        <Database size={22} />
                    </div>
                    <div className="module-card-content">
                        <div className="module-card-badge active-badge">Prêt pour import</div>
                        <h3 className="module-card-title">1. Infrastructure & Inventaire</h3>
                        <p className="module-card-desc">
                            Importe les Aéroports, Périmètres, Zones, Catégories, Types et Supports avec leur statut.
                        </p>
                    </div>
                    <ChevronRight size={18} className="module-arrow" />
                </div>

                {/* Module 2 : Clients & Contacts (Futur) */}
                <div
                    className={`import-module-card ${activeModule === 'clients' ? 'active' : ''}`}
                    onClick={() => { setActiveModule('clients'); handleReset(); }}
                >
                    <div className="module-card-icon active-icon">
                        <Users size={22} />
                    </div>
                    <div className="module-card-content">
                        <div className="module-card-badge active-badge">Prêt pour import</div>
                        <h3 className="module-card-title">2. Clients & Contacts</h3>
                        <p className="module-card-desc">
                            Import en masse des raisons sociales, adresses et contacts associés.
                        </p>
                    </div>
                    <ChevronRight size={18} className="module-arrow" />
                </div>


                {/* Module 3 : Abonnements (Futur) */}
                <div
                    className={`import-module-card ${activeModule === 'abonnements' ? 'active' : ''}`}
                    onClick={() => { setActiveModule('abonnements'); handleReset(); }}
                >
                    <div className="module-card-icon active-icon">
                        <CalendarCheck size={22} />
                    </div>
                    <div className="module-card-content">
                        <div className="module-card-badge active-badge">Prêt pour import</div>
                        <h3 className="module-card-title">3. Abonnements & Contrats</h3>
                        <p className="module-card-desc">
                            Import des contrats, campagnes, tarifs, dates et liaisons aux supports physiques.
                        </p>
                    </div>
                    <ChevronRight size={18} className="module-arrow" />
                </div>

            </div>
            {/* Section Zone de Dépôt / Upload */}


            <div className="import-upload-section glass-panel">
                <h2 className="section-title">
                    <FileSpreadsheet size={20} />
                    Téléverser le fichier pour : <strong>{activeModule}</strong>
                </h2>
                <div
                    className={`dropzone-box ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !loading && fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".csv"
                        style={{ display: 'none' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.target.value = '';
                        }}
                        onChange={handleFileChange}
                    />
                    {!selectedFile ? (
                        <div className="dropzone-content">
                            <UploadCloud size={48} className="dropzone-icon" />
                            <p className="dropzone-main-text">
                                Glissez-déposez votre fichier <strong>.CSV</strong> ici, ou <span className="browse-link">parcourez vos fichiers</span>
                            </p>
                            <p className="dropzone-sub-text">
                                Séparateurs supportés : virgule (,), point-virgule (;) ou tabulation. Encodage UTF-8 recommandé.
                            </p>
                        </div>
                    ) : (
                        <div className="dropzone-file-selected">
                            <FileText size={40} className="file-ready-icon" />
                            <div className="file-info">
                                <span className="file-name">{selectedFile.name}</span>
                                <span className="file-size">{(selectedFile.size / 1024).toFixed(1)} Ko</span>
                            </div>
                        </div>
                    )}
                </div>
                {/* Boutons d'action */}
                <div className="import-actions-bar">
                    {selectedFile && (
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleReset}
                            disabled={loading}
                        >
                            <RotateCcw size={15} />
                            <span>Changer de fichier</span>
                        </button>
                    )}
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleStartImport}
                        disabled={!selectedFile || loading}
                        style={{ minWidth: '180px' }}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="btn-spinner" />
                                <span>Traitement en cours...</span>
                            </>
                        ) : (
                            <>
                                <UploadCloud size={16} />
                                <span>Lancer l'importation</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            {/* Rapport d'Importation & Bilan Transactionnel */}
            {rapport && (
                <div ref={reportRef} className="import-report-section glass-panel">
                    <h2 className="section-title">
                        <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                        Rapport d'exécution & Contrôle des 4 Niveaux
                    </h2>
                    {/* Grille des KPI de l'import */}
                    <div className="report-kpi-grid">
                        <div className="report-kpi-card">
                            <span className="kpi-label">Lignes analysées</span>
                            <span className="kpi-value">{rapport.totalLignes}</span>
                        </div>
                        <div className="report-kpi-card success">
                            <span className="kpi-label">
                                {activeModule === 'infrastructure' ? 'Supports créés' : activeModule === 'clients' ? 'Clients créés' : 'Abonnements créés'}
                            </span>
                            <span className="kpi-value text-emerald">
                                {activeModule === 'infrastructure'
                                    ? rapport.lignesImportees
                                    : activeModule === 'clients'
                                        ? `${rapport.clientsCrees} (${rapport.contactsCrees || 0} contacts)`
                                        : `${rapport.abonnementsCrees} (${rapport.supportsLies || 0} supports liés)`
                                }
                            </span>
                        </div>


                        <div className="report-kpi-card warning">
                            <span className="kpi-label">Doublons ignorés</span>
                            <span className="kpi-value text-amber">
                                {rapport.doublonsBdd + (rapport.doublonsInternes || 0)}
                            </span>
                        </div>
                        <div className="report-kpi-card danger">
                            <span className="kpi-label">Lignes en erreur</span>
                            <span className="kpi-value text-rose">{rapport.erreursCount}</span>
                        </div>
                    </div>
                    {/* Tableau détaillé des anomalies et doublons si existants */}
                    {rapport.erreurs && rapport.erreurs.length > 0 && (
                        <div className="report-errors-box">
                            <h3 className="errors-box-title">
                                <AlertTriangle size={18} />
                                Détail des anomalies & doublons signalés ({rapport.erreurs.length})
                            </h3>
                            <p className="errors-box-desc">
                                Ces lignes ont été identifiées comme des doublons (ignorés) ou des anomalies (isolées via SAVEPOINT) sans bloquer les lignes saines.
                            </p>
                            <div className="table-wrapper">
                                <table className="wireframe-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '90px', textAlign: 'center' }}>Ligne CSV</th>
                                            <th style={{ width: '120px', textAlign: 'center' }}>Statut</th>
                                            <th style={{ width: '220px' }}>
                                                {activeModule === 'infrastructure' ? 'Référence Support' : activeModule === 'clients' ? 'Raison Sociale' : 'Réf. Abonnement'}
                                            </th>
                                            <th>Motif / Raison</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rapport.erreurs.map((err, idx) => {
                                            const isDoublon = err.type === 'doublon' || /doublon/i.test(err.motif || '');
                                            return (
                                                <tr key={idx} className="table-body-row">
                                                    <td style={{ textAlign: 'center', fontWeight: 700, color: isDoublon ? '#f59e0b' : '#f87171' }}>
                                                        #{err.ligne}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            backgroundColor: isDoublon ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                            color: isDoublon ? '#f59e0b' : '#ef4444',
                                                            border: `1px solid ${isDoublon ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                                                        }}>
                                                            {isDoublon ? 'Doublon' : 'Erreur'}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontWeight: 600 }}>
                                                        {err.reference}
                                                    </td>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                        {err.motif}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de Purge / Nettoyage Sélectif des Données */}
            {showPurgeModal && (
                <PurgeDataModal
                    isOpen={showPurgeModal}
                    onClose={() => setShowPurgeModal(false)}
                    onPurgeSuccess={() => {
                        handleReset();
                        if (onImportSuccess) onImportSuccess();
                    }}
                />
            )}
        </div>
    );
}