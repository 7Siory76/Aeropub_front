import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  X,
  ExternalLink,
  Compass,
  MapPin,
  Calendar,
  Users,
  Tv,
  BarChart3,
  Bell,
  Layers,
  FolderKanban,
  ShieldCheck,
  FileSpreadsheet,
  Settings,
  CheckCircle2,
  ArrowRight,
  LayoutDashboard,
  Check,
  Sparkles
} from 'lucide-react';
import { APP_PAGES_GUIDE } from './appGuideData';
import { useFeedback } from '../context/FeedbackContext';
import './AppGuideModal.css';

// Registre d'icônes dynamiques
const ICONS = {
  MapPin,
  BarChart3,
  LayoutDashboard,
  FileSpreadsheet,
  Settings,
  Compass,
  Calendar,
  Tv,
  Users,
  Bell,
  Layers,
  FolderKanban,
  ShieldCheck
};

export default function AppGuideModal({ isOpen, onClose }) {
  const { navigateWithFeedback } = useFeedback();

  // Page active sélectionnée dans le guide
  const [selectedPageId, setSelectedPageId] = useState(APP_PAGES_GUIDE[0].id);

  // Sous-onglet actif pour les pages avec sous-tables (Tableau de Bord)
  const [activeSubTabKey, setActiveSubTabKey] = useState('abonnements');

  // Fermeture par la touche Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPage = APP_PAGES_GUIDE.find((p) => p.id === selectedPageId) || APP_PAGES_GUIDE[0];
  const PageIcon = ICONS[currentPage.icon] || Compass;

  // Téléportation vers la page ou l'onglet
  const handleGoToPage = (pageKey, tabKey = null) => {
    if (!pageKey) return;
    if (navigateWithFeedback) {
      navigateWithFeedback(pageKey, tabKey);
    }
    onClose();
  };

  return createPortal(
    <div className="app-guide-backdrop" onClick={onClose}>
      <div className="app-guide-dialog" onClick={(e) => e.stopPropagation()}>
        {/* En-tête de la modale */}
        <div className="app-guide-header">
          <div className="app-guide-header-title">
            <div className="app-guide-header-icon">
              <BookOpen size={24} />
            </div>
            <div>
              <h2>Guide de l'Application AeroPub</h2>
              <p className="app-guide-subtitle">
                Votre guide de navigation : découvrez en un coup d'œil <strong>ce que vous pouvez faire sur chaque page</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="app-guide-close-btn"
            onClick={onClose}
            title="Fermer (Échap)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Disposition principale : Volet des Pages à gauche, Contenu à droite */}
        <div className="app-guide-content-layout">
          {/* Colonne gauche : Sélecteur de page */}
          <aside className="app-guide-pages-sidebar">
            <span className="app-guide-sidebar-label">Pages de l'application</span>
            {APP_PAGES_GUIDE.map((page) => {
              const TabIcon = ICONS[page.icon] || Compass;
              const isSelected = selectedPageId === page.id;

              return (
                <button
                  key={page.id}
                  type="button"
                  className={`app-guide-page-tab-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedPageId(page.id)}
                >
                  <div className="app-guide-page-tab-icon">
                    <TabIcon size={18} />
                  </div>
                  <div className="app-guide-page-tab-info">
                    <span className="app-guide-page-tab-name">{page.name}</span>
                    <span
                      className="app-guide-page-tab-badge"
                      style={{ color: isSelected ? '#38bdf8' : page.badgeColor }}
                    >
                      {page.badge}
                    </span>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Colonne droite : Détail de ce qu'on peut faire sur la page sélectionnée */}
          <main className="app-guide-page-detail">
            {/* Carte Hero de présentation de la page */}
            <div className="app-guide-hero-card">
              <div className="app-guide-hero-left">
                <div className="app-guide-hero-icon">
                  <PageIcon size={28} />
                </div>
                <div className="app-guide-hero-texts">
                  <h3>
                    <span>{currentPage.name}</span>
                    <span
                      className="app-guide-hero-badge"
                      style={{
                        borderColor: currentPage.badgeColor,
                        color: currentPage.badgeColor,
                        background: `${currentPage.badgeColor}15`
                      }}
                    >
                      {currentPage.badge}
                    </span>
                  </h3>
                  <p className="app-guide-hero-desc">{currentPage.description}</p>
                </div>
              </div>

              {/* Bouton de navigation directe si la page est navigable */}
              {currentPage.pageKey && (
                <button
                  type="button"
                  className="app-guide-direct-nav-btn"
                  onClick={() => handleGoToPage(currentPage.pageKey, currentPage.tabKey)}
                >
                  <span>Aller sur cette page</span>
                  <ExternalLink size={15} />
                </button>
              )}
            </div>

            {/* CAS 1 : Page avec sous-onglets (Tableau de Bord CRUD) */}
            {currentPage.subTabs ? (
              <div className="app-guide-subtabs-section">
                <span className="app-guide-subtabs-title">
                  <Layers size={15} />
                  Choisissez un onglet de gestion :
                </span>

                {/* Pills horizontaux des sous-tables */}
                <div className="app-guide-subtabs-pills">
                  {currentPage.subTabs.map((sub) => {
                    const SubIcon = ICONS[sub.icon] || Compass;
                    const isSubActive = activeSubTabKey === sub.key;
                    return (
                      <button
                        key={sub.key}
                        type="button"
                        className={`app-guide-subtab-pill ${isSubActive ? 'active' : ''}`}
                        onClick={() => setActiveSubTabKey(sub.key)}
                      >
                        <SubIcon size={14} />
                        <span>{sub.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Contenu de la sous-table sélectionnée */}
                {(() => {
                  const currentSub = currentPage.subTabs.find((s) => s.key === activeSubTabKey) || currentPage.subTabs[0];
                  const SubBoxIcon = ICONS[currentSub.icon] || Compass;

                  return (
                    <div className="app-guide-subtab-box">
                      <div className="app-guide-subtab-box-header">
                        <div>
                          <div className="app-guide-subtab-box-title">
                            <SubBoxIcon size={20} style={{ color: '#38bdf8' }} />
                            <span>Onglet : {currentSub.name}</span>
                          </div>
                          <div className="app-guide-subtab-box-desc">{currentSub.desc}</div>
                        </div>

                        <button
                          type="button"
                          className="app-guide-subtab-open-btn"
                          onClick={() => handleGoToPage('dashboard', currentSub.key)}
                        >
                          <span>Ouvrir l'onglet {currentSub.name}</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                          Ce que vous pouvez faire dans cet onglet :
                        </span>
                        <ul className="app-guide-checklist" style={{ marginTop: '0.65rem' }}>
                          {currentSub.actions.map((act, i) => (
                            <li key={i} className="app-guide-checklist-item">
                              <CheckCircle2 size={16} />
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* CAS 2 : Page avec liste d'actions directes */
              <div className="app-guide-actions-container">
                <h4 className="app-guide-section-heading">
                  <Check size={16} />
                  Ce que vous pouvez faire sur cette page :
                </h4>

                <div className="app-guide-action-cards-grid">
                  {currentPage.actions.map((action, idx) => (
                    <div key={idx} className="app-guide-action-card">
                      <div className="app-guide-action-card-title">
                        <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                        <span>{action.title}</span>
                      </div>
                      <p className="app-guide-action-card-desc">{action.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Pied de page de la modale */}
        <div className="app-guide-footer">
          <div className="app-guide-footer-hint">
            <Sparkles size={14} style={{ color: '#38bdf8' }} />
            <span>Sélectionnez une page à gauche pour voir toutes ses fonctionnalités et vous y rendre directement.</span>
          </div>

          <button
            type="button"
            className="app-guide-footer-close-btn"
            onClick={onClose}
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
