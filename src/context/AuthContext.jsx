import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            checkAuth();
        } else {
            setLoading(false);
        }
    }, [token]);

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setUser(data.user);
            } else {
                logout();
            }
        } catch (error) {
            console.error('Auth check failed', error);
            logout();
        }
        setLoading(false);
    };

    const login = async (username, password) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (data.success) {
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('token', data.token);
            return { success: true };
        } else {
            return { success: false, error: data.error };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    // Helper to check permission
    const hasPermission = (featureKey, action = 'view') => {
        if (!user) return false;

        // Super Admin Bypass (Assuming role name or ID 1)
        if (user.role === 'Super Admin') return true;

        if (!user.permissions) return false;

        const permission = user.permissions.find(p => p.feature_key === featureKey);
        if (!permission) return false;

        switch (action) {
            case 'view': return permission.can_view === 'Y';
            case 'create': return permission.can_create === 'Y';
            case 'edit': return permission.can_edit === 'Y';
            case 'delete': return permission.can_delete === 'Y';
            case 'print': return permission.can_print === 'Y';
            default: return false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
