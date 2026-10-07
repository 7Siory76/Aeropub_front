import React, { useState, useEffect } from 'react';
import { Mail, Lock, LogIn, Plane, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { utilisateursApi } from '../api/utilisateursApi';
import { sanitizeUserError } from '../utils/errorHandler';
import styles from './LoginPage.module.css';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const isExpired = localStorage.getItem('aeropub_session_expired') === 'true';

    useEffect(() => {
        document.title = "AeroPub | Plateforme d'Affichage & Publicités Aéroportuaires — Connexion Sécurisée";
    }, []);

    useEffect(() => {
        if (errorMessage) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [errorMessage]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        if (!email.trim() || !motDePasse) {
            setErrorMessage('Veuillez renseigner votre email et mot de passe.');
            return;
        }

        setLoading(true);
        try {
            const response = await utilisateursApi.login({
                email: email.trim(),
                mot_de_passe: motDePasse
            });

            const userData = response.user;
            login(userData);
        } catch (err) {
            const friendlyMsg = sanitizeUserError(err, 'Identifiants invalides ou serveur indisponible.');
            setErrorMessage(friendlyMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginGlassCard}>
                <div className={styles.loginBrand}>
                    <div className={styles.heroBadgePlatform}>
                        <Plane size={14} className={styles.heroBadgeIcon} />
                        <span>Plateforme d'Affichage &amp; Publicités Aéroportuaires</span>
                    </div>
                    <div className={styles.loginLogo}>
                        <Plane size={36} color="var(--accent-primary, #3b82f6)" />
                    </div>
                    <h1 className={styles.loginTitle}>
                        AeroPub <span className={styles.gradientText}>Connexion</span>
                    </h1>
                    <p className={styles.loginSubtitle}>Portail d'Authentification Professionnelle &amp; Régie Publicitaire</p>
                </div>

                {errorMessage && (
                    <div className={styles.errorMessage}>
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {isExpired && (
                    <div className={styles.expiredAlert}>
                        <span>⏱️ Votre session a expiré après 24h d'inactivité. Veuillez vous reconnecter pour reprendre votre travail.</span>
                    </div>
                )}

                {/* Formulaire de connexion */}
                <form onSubmit={handleSubmit} className={styles.loginForm}>
                    <div className={styles.loginField}>
                        <label className={styles.loginLabel}>Adresse Email Professionnelle</label>
                        <div className={styles.loginInputWrapper}>
                            <Mail size={18} className={styles.loginInputIcon} />
                            <input
                                type="email"
                                required
                                className={styles.loginInput}
                                placeholder="ex: admin@aeropub.mg"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>
                    </div>
                    <div className={styles.loginField}>
                        <label className={styles.loginLabel}>Mot de Passe</label>
                        <div className={styles.loginInputWrapper}>
                            <Lock size={18} className={styles.loginInputIcon} />
                            <input
                                type="password"
                                required
                                className={styles.loginInput}
                                placeholder="••••••••"
                                value={motDePasse}
                                onChange={(e) => setMotDePasse(e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={styles.loginBtnSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className={styles.btnSpinner} />
                                <span>Connexion en cours...</span>
                            </>
                        ) : (
                            <>
                                <LogIn size={18} />
                                <span>Se Connecter</span>
                            </>
                        )}
                    </button>
                </form>

                <div className={styles.loginFooterHint}>
                    Authentification sécurisée • Accès restreint
                </div>
            </div>
        </div>
    );
}