import React from 'react';
import { Bell, CheckCircle2, Info, AlertTriangle, XCircle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'react-toastify';

export default function NotificationTester({ onSimulateImport }) {
  const triggerSuccess = () => {
    toast.success('🎉 Opération réussie ! Vos données sont synchronisées.', {
      position: 'bottom-right',
      autoClose: 3500
    });
  };

  const triggerInfo = () => {
    toast.info('💡 Astuce : Vous pouvez filtrer les éléments par mot-clé.', {
      position: 'bottom-right',
      autoClose: 3500
    });
  };

  const triggerWarning = () => {
    toast.warning('⚠️ Connexion au serveur instable. Tentative de reconnexion...', {
      position: 'bottom-right',
      autoClose: 4000
    });
  };

  const triggerError = () => {
    toast.error('❌ Une erreur est survenue lors de l\'enregistrement.', {
      position: 'bottom-right',
      autoClose: 4000
    });
  };

  const triggerCsvSimulation = () => {
    toast.info('📦 [PUSH CSV] BACK_OFFICE a importé un nouveau fichier CSV !', {
      position: 'top-center',
      autoClose: 5000
    });
    if (onSimulateImport) onSimulateImport();
  };

  return (
    <section className="glass-panel notification-tester-box">
      <div className="notification-header">
        <Bell size={22} className="notification-icon" />
        <h3 className="notification-title">
          Testeur de Notifications In-App (<span className="notification-title-pink">react-toastify</span>)
        </h3>
      </div>
      <p className="dashboard-desc" style={{ marginBottom: '1.25rem' }}>
        Cliquez sur les boutons ci-dessous pour expérimenter les différents types de notifications In-App intégrées dans l'application :
      </p>

      <div className="notification-buttons-group">
        <button onClick={triggerSuccess} className="btn-secondary btn-success-toast">
          <CheckCircle2 size={16} />
          <span>Toast Succès</span>
        </button>

        <button onClick={triggerInfo} className="btn-secondary btn-info-toast">
          <Info size={16} />
          <span>Toast Information</span>
        </button>

        <button onClick={triggerWarning} className="btn-secondary btn-warning-toast">
          <AlertTriangle size={16} />
          <span>Toast Avertissement</span>
        </button>

        <button onClick={triggerError} className="btn-secondary btn-error-toast">
          <XCircle size={16} />
          <span>Toast Erreur</span>
        </button>

        <button onClick={triggerCsvSimulation} className="btn-primary btn-pink-toast">
          <FileSpreadsheet size={16} />
          <span>Simuler Import CSV (Back-Office)</span>
        </button>
      </div>
    </section>
  );
}
