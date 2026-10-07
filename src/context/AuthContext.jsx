import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const INACTIVITY_TIMEOUT = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('aeropub_user');
        const lastActivity = localStorage.getItem('aeropub_last_activity');

        if (saved && lastActivity) {
            const timePassed = Date.now() - parseInt(lastActivity, 10);
            if (timePassed > INACTIVITY_TIMEOUT) {
                // Session expirée après 24h : on déconnecte mais on GARDE les pages mémorisées
                localStorage.removeItem('aeropub_user');
                localStorage.setItem('aeropub_session_expired', 'true');
                return null;
            }
        }
        return saved ? JSON.parse(saved) : null;
    });

    // Mettre à jour l'horodatage d'activité lors des clics ou touches du clavier
    useEffect(() => {
        if (!user) return;

        const updateActivity = () => {
            localStorage.setItem('aeropub_last_activity', Date.now().toString());
        };

        // Écouter les interactions pour rafraîchir le timer
        window.addEventListener('click', updateActivity);
        window.addEventListener('keydown', updateActivity);

        return () => {
            window.removeEventListener('click', updateActivity);
            window.removeEventListener('keydown', updateActivity);
        };
    }, [user]);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('aeropub_user', JSON.stringify(userData));
        localStorage.setItem('aeropub_last_activity', Date.now().toString());
        localStorage.removeItem('aeropub_session_expired');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('aeropub_user');
        localStorage.removeItem('aeropub_last_activity');
        localStorage.removeItem('aeropub_session_expired');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
