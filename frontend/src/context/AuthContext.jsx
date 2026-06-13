import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check user session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await api.get('/auth/me');
                if (response.data.success) {
                    setUser(response.data.user);
                }
            } catch (error) {
                // If 401, user is just not logged in; no need to log console errors
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login', { username, password });
            if (response.data.success) {
                setUser(response.data.user);
                return { success: true, message: response.data.message };
            }
            return { success: false, message: response.data.message || 'Login gagal.' };
        } catch (error) {
            const message = error.response?.data?.message || 'Koneksi ke server gagal.';
            return { success: false, message };
        }
    };

    const logout = async () => {
        try {
            const response = await api.post('/auth/logout');
            if (response.data.success) {
                setUser(null);
                return { success: true };
            }
            return { success: false, message: 'Gagal logout.' };
        } catch (error) {
            // Force logout state on frontend even if request fails
            setUser(null);
            return { success: true };
        }
    };

    const register = async (username, password) => {
        try {
            const response = await api.post('/auth/register', { username, password });
            return { success: response.data.success, message: response.data.message };
        } catch (error) {
            const message = error.response?.data?.message || 'Registrasi gagal.';
            return { success: false, message };
        }
    };

    const googleLogin = async (credential) => {
        try {
            const response = await api.post('/auth/google', { credential });
            if (response.data.success) {
                setUser(response.data.user);
                return { success: true, message: response.data.message };
            }
            return { success: false, message: response.data.message || 'Login Google gagal.' };
        } catch (error) {
            const message = error.response?.data?.message || 'Koneksi ke server gagal.';
            return { success: false, message };
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, googleLogin, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth harus digunakan di dalam AuthProvider');
    }
    return context;
}
