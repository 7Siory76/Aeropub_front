import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import './DiscreetBanner.css';

export default function DiscreetBanner({ feedback, onDismiss }) {
  if (!feedback || !feedback.message) return null;

  const isSuccess = feedback.type === 'success';
  const isError = feedback.type === 'error';

  return (
    <div
      className={`discreet-banner discreet-banner-${feedback.type || 'info'}`}
      role="status"
    >
      <div className="discreet-banner-content">
        {isSuccess && <CheckCircle2 size={17} className="discreet-banner-icon" />}
        {isError && <AlertCircle size={17} className="discreet-banner-icon" />}
        {!isSuccess && !isError && <Info size={17} className="discreet-banner-icon" />}
        <span className="discreet-banner-text">{feedback.message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          className="discreet-banner-close"
          onClick={onDismiss}
          title="Fermer ce message"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
