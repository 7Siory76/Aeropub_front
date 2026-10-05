import React, { useState, useEffect } from 'react';
import { Mail, Lock, LogIn, Plane, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { utilisateursApi } from '../api/utilisateursApi';
import { sanitizeUserError } from '../utils/errorHandler';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

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
        <div className="login-container">
            <div className="login-glass-card">
                <div className="login-brand">
                    <div className="login-logo">
                        <Plane size={36} color="#3b82f6" />
                    </div>
                    <h1 className="login-title">AeroPub</h1>
                    <p className="login-subtitle">Gestion d'Affichage & Régie Publicitaire</p>
                </div>

                {errorMessage && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.65rem 0.9rem',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#f87171',
                        fontSize: '0.85rem',
                        marginBottom: '1rem'
                    }}>
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Formulaire de connexion */}
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="login-field">
                        <label className="login-label">Adresse Email Professionnelle</label>
                        <div className="login-input-wrapper">
                            <Mail size={18} className="login-input-icon" />
                            <input
                                type="email"
                                required
                                className="login-input"
                                placeholder="ex: admin@aeropub.mg"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>
                    </div>
                    <div className="login-field">
                        <label className="login-label">Mot de Passe</label>
                        <div className="login-input-wrapper">
                            <Lock size={18} className="login-input-icon" />
                            <input
                                type="password"
                                required
                                className="login-input"
                                placeholder="••••••••"
                                value={motDePasse}
                                onChange={(e) => setMotDePasse(e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="login-btn-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="btn-spinner" />
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

                <div className="login-footer-hint">
                    Authentification sécurisée • Accès restreint
                </div>
            </div>
        </div>
    )
}