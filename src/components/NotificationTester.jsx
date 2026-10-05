import React from 'react';
import { Bell, CheckCircle2, Info, AlertTriangle, XCircle, FileSpreadsheet } from 'lucide-react';
import { useFeedback } from '../context/FeedbackContext';

export default function NotificationTester({ onSimulateImport }) {
  const { showSuccess, showInfo, showError } = useFeedback();

  const triggerSuccess = () => {
    showSuccess('Opération réussie ! Vos données sont synchronisées.');
  };

  const triggerInfo = () => {
    showInfo('Astuce : Vous pouvez filtrer les éléments par mot-clé.');
  };

  const triggerWarning = () => {
    showInfo('Avertissement : Connexion au serveur instable.');
  };

  const triggerError = () => {
    showError('Une erreur est survenue lors de l\'enregistrement des données.');
  };

  const triggerCsvSimulation = () => {
    showInfo('Import CSV : Un nouveau fichier CSV a été importé avec succès.');
    if (onSimulateImport) onSimulateImport();
  };

  return (
    <section className="glass-panel notification-tester-box">
      <div className="notification-header">
        <Bell size={22} className="notification-icon" />
        <h3 className="notification-title">
          Testeur de Messages et Alertes (<span className="notification-title-pink">Bannières Discrètes</span>)
        </h3>
      </div>
      <p className="dashboard-desc" style={{ marginBottom: '1.25rem' }}>
        Cliquez sur les boutons ci-dessous pour tester les notifications discrètes intégrées dans l'application :
      </p>

      <div className="notification-buttons-group">
        <button onClick={triggerSuccess} className="btn-secondary btn-success-toast">
          <CheckCircle2 size={16} />
          <span>Message Succès</span>
        </button>

        <button onClick={triggerInfo} className="btn-secondary btn-info-toast">
          <Info size={16} />
          <span>Message Info</span>
        </button>

        <button onClick={triggerWarning} className="btn-secondary btn-warning-toast">
          <AlertTriangle size={16} />
          <span>Message Alerte</span>
        </button>

        <button onClick={triggerError} className="btn-secondary btn-error-toast">
          <XCircle size={16} />
          <span>Message Erreur</span>
        </button>

        <button onClick={triggerCsvSimulation} className="btn-primary btn-pink-toast">
          <FileSpreadsheet size={16} />
          <span>Simuler Import CSV</span>
        </button>
      </div>
    </section>
  );
}
