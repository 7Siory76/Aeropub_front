import React, { useState, useEffect, useRef } from 'react';
import {
    FileText, UploadCloud, Eye, Download, Trash2,
    History, AlertCircle, Loader2, Plus, CheckCircle2
} from 'lucide-react'
import { documentsApi } from '../api';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

export default function AbonnementDocuments({ referenceAbonnement }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [typeDocument, setTypeDocument] = useState('Contrat');
    const [showUploadForm, setShowUploadForm] = useState(false);
    const fileInputRef = useRef(null);

    const fetchDocs = async () => {
        if (!referenceAbonnement) return;
        try {
            setLoading(true);
            setError('');
            const data = await documentsApi.getByAbonnement(referenceAbonnement);
            setDocuments(data || []);
        } catch (err) {
            setError('Erreur lors du chargement des documents.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocs();
    }, [referenceAbonnement]);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            setError('');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('id_abonnement', referenceAbonnement);
            formData.append('type_document', typeDocument);

            await documentsApi.upload(formData);
            setShowUploadForm(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            fetchDocs();
        } catch (err) {
            setError(err?.response?.data?.message || "Erreur lors de l'envoi du document.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id, nomFichier) => {
        if (!window.confirm(`Supprimer définitivement le document « ${nomFichier} » ?`)) return;
        try {
            await documentsApi.delete(id);
            fetchDocs();
        } catch (err) {
            setError(err?.response?.data?.message || 'Erreur lors de la suppression.');
        }
    };

    return (
        <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
                    <strong style={{ fontSize: '0.95rem' }}>Documents & Pièces Jointes ({documents.length})</strong>
                </div>
                <button
                    type="button"
                    className="pill-btn active"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    onClick={() => setShowUploadForm(!showUploadForm)}
                >
                    <Plus size={14} />
                    <span>Ajouter un document</span>
                </button>
            </div>

            {error && (
                <div style={{ padding: '0.6rem 0.8rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertCircle size={15} />
                    <span>{error}</span>
                </div>
            )}

            {showUploadForm && (
                <div style={{ padding: '0.85rem', background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.25)', borderRadius: '10px', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                    <select
                        className="modal-select"
                        style={{ width: '180px', padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                        value={typeDocument}
                        onChange={(e) => setTypeDocument(e.target.value)}
                    >
                        <option value="Contrat">📄 Contrat signé</option>
                        <option value="BAT">🎨 BAT (Bon à tirer)</option>
                        <option value="Devis">📑 Devis / Offre</option>
                        <option value="Avenant">📝 Avenant</option>
                        <option value="Autre">📎 Autre pièce</option>
                    </select>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        style={{ fontSize: '0.85rem' }}
                    />

                    {uploading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
                            <Loader2 size={16} className="btn-spinner" />
                            <span>Envoi en cours...</span>
                        </div>
                    )}
                </div>
            )}

            {/* Liste des documents */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                    <Loader2 size={20} className="btn-spinner" />
                </div>
            ) : documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Aucun document attaché à ce contrat ou à ses précédents.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {documents.map((doc) => {
                        const fileUrl = `${API_BASE_URL}${doc.url_chemin}`;
                        return (
                            <div
                                key={doc.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.65rem 0.85rem',
                                    borderRadius: '8px',
                                    background: doc.est_actuel ? 'rgba(255, 255, 255, 0.04)' : 'rgba(245, 158, 11, 0.06)',
                                    border: doc.est_actuel ? '1px solid var(--border-glass)' : '1px solid rgba(245, 158, 11, 0.25)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                                    <FileText size={18} style={{ color: doc.est_actuel ? '#60a5fa' : '#f59e0b', flexShrink: 0 }} />
                                    <div style={{ overflow: 'hidden' }}>
                                        <div style={{ fontSize: '0.88rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                            {doc.nom_fichier}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '2px' }}>
                                            <span style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', fontWeight: 600 }}>
                                                {doc.type_document || 'Document'}
                                            </span>
                                            <span>• {new Date(doc.date_upload).toLocaleDateString('fr-FR')}</span>
                                            {!doc.est_actuel && (
                                                <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    <History size={11} />
                                                    <span>Hérité de {doc.id_abonnement}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Actions sur le fichier */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                                    <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="pill-btn"
                                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                        title="Visualiser le fichier"
                                    >
                                        <Eye size={13} />
                                        <span>Voir</span>
                                    </a>
                                    <a
                                        href={fileUrl}
                                        download={doc.nom_fichier}
                                        className="pill-btn"
                                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                        title="Télécharger"
                                    >
                                        <Download size={13} />
                                    </a>
                                    {doc.est_actuel && (
                                        <button
                                            type="button"
                                            className="pill-btn"
                                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#ef4444' }}
                                            onClick={() => handleDelete(doc.id, doc.nom_fichier)}
                                            title="Supprimer"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    )
}