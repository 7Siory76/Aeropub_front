import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('aeropub_user');
        return saved ? JSON.parse(saved) : null;
    });

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('aeropub_user', JSON.stringify(userData))
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('aeropub_user');
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
export const useAuth = () => useContext(AuthContext)
