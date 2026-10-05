import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { sanitizeUserError } from '../utils/errorHandler';

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [feedback, setFeedback] = useState(null);
  const timerRef = useRef(null);
  const navigationHandlerRef = useRef(null);

  const clearFeedback = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFeedback(null);
  }, []);

  const setAutoDismiss = useCallback((durationMs = 5000) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setFeedback(null);
    }, durationMs);
  }, []);

  const scrollToTop = useCallback(() => {
    try {
      // 1. Défilement fluide de la fenêtre et du document
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (document.documentElement) {
        document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (document.body) {
        document.body.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // 2. Défilement du conteneur de contenu principal de l'application
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: 'smooth' });
      }
      const appWrapper = document.querySelector('.app-main-wrapper');
      if (appWrapper) {
        appWrapper.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // 3. Défilement de toute boîte modale active ouverte
      const openModals = document.querySelectorAll(
        '.client-modal-box, .modal-content, .modal-backdrop-portal, .change-emp-modal-box, [class*="modal-box"]'
      );
      openModals.forEach((modal) => {
        modal.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } catch (err) {
      console.warn('Erreur lors du défilement haut:', err);
    }
  }, []);

  const showSuccess = useCallback((message, autoDismiss = true) => {
    scrollToTop();
    setFeedback({
      type: 'success',
      message: typeof message === 'string' ? message : 'Opération effectuée avec succès.',
      id: Date.now()
    });
    if (autoDismiss) setAutoDismiss(4500);
  }, [setAutoDismiss, scrollToTop]);

  const showError = useCallback((errorOrMessage, fallbackMessage = "Une erreur inattendue est survenue.") => {
    scrollToTop();
    const userMessage = sanitizeUserError(errorOrMessage, fallbackMessage);
    setFeedback({
      type: 'error',
      message: userMessage,
      id: Date.now()
    });
    // Les erreurs restent affichées un peu plus longtemps (7s) pour être lues calmement
    setAutoDismiss(7000);
  }, [setAutoDismiss, scrollToTop]);

  const showInfo = useCallback((message, autoDismiss = true) => {
    scrollToTop();
    setFeedback({
      type: 'info',
      message: typeof message === 'string' ? message : String(message),
      id: Date.now()
    });
    if (autoDismiss) setAutoDismiss(4000);
  }, [setAutoDismiss, scrollToTop]);

  /**
   * Enregistre la fonction de navigation interne de l'application
   */
  const registerNavigationHandler = useCallback((handler) => {
    navigationHandlerRef.current = handler;
  }, []);

  /**
   * Redirige vers la page / onglet logique avec message de succès ou d'erreur
   */
  const navigateWithFeedback = useCallback((page, tab, feedbackObj) => {
    if (navigationHandlerRef.current) {
      navigationHandlerRef.current(page, tab);
    }
    if (typeof feedbackObj === 'string') {
      showSuccess(feedbackObj);
    } else if (feedbackObj && feedbackObj.type === 'error') {
      showError(feedbackObj.message || feedbackObj.error, feedbackObj.fallback);
    } else if (feedbackObj && feedbackObj.message) {
      if (feedbackObj.type === 'info') showInfo(feedbackObj.message);
      else showSuccess(feedbackObj.message);
    }
  }, [showSuccess, showError, showInfo]);

  return (
    <FeedbackContext.Provider value={{
      feedback,
      showSuccess,
      showError,
      showInfo,
      clearFeedback,
      registerNavigationHandler,
      navigateWithFeedback,
      scrollToTop
    }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    // Repli de secours pour éviter tout crash si un composant l'utilise hors provider
    return {
      feedback: null,
      showSuccess: (msg) => console.log('[SUCCESS]', msg),
      showError: (err) => console.error('[ERROR]', err),
      showInfo: (msg) => console.log('[INFO]', msg),
      clearFeedback: () => {},
      registerNavigationHandler: () => {},
      navigateWithFeedback: () => {},
      scrollToTop: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    };
  }
  return context;
}
