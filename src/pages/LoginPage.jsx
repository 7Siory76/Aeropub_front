import React, { useState } from 'react';
import { Mail, Lock, LogIn, Plane } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { utilisateursApi } from '../api/utilisateursApi';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !motDePasse) {
            toast.error('veuillez remplir les champs.');
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
            toast.success(`Bienvenue ${userData.nom} (${userData.role}) !`);
        } catch (err) {
            const msg = err.response?.data?.message || 'Identifiants invalides ou serveur indisponible.';
            toast.error(`❌ ${msg}`);
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
                            'Connexion en cours...'
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