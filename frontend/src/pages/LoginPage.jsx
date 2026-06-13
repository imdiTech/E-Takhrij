import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
    const { user, login, googleLogin } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAdminForm, setShowAdminForm] = useState(false);

    // Detect theme
    const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('color-theme') === 'dark';

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            if (user.is_admin) {
                navigate('/admin');
            } else {
                navigate('/');
            }
        }
    }, [user, navigate]);

    const handleAdminSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const trimmedUser = username.trim();
        const trimmedPass = password.trim();

        if (!trimmedUser || !trimmedPass) {
            setError('Username dan password wajib diisi.');
            return;
        }

        setLoading(true);
        const result = await login(trimmedUser, trimmedPass);
        setLoading(false);

        if (!result.success) {
            setError(result.message);
        }
    };

    return (
        <div className="max-w-md mx-auto my-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Background elements */}
            <div className="relative px-4">
                <div className="absolute -top-16 -left-16 w-56 h-56 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-8 md:p-10 shadow-2xl relative backdrop-blur-xl transition-all duration-300">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/25 mb-4 transform hover:rotate-6 transition-transform">
                            <i className="fa-solid fa-shield-halved text-2xl"></i>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Selamat Datang</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-2 leading-relaxed">
                            Silakan masuk untuk mengakses fitur lengkap platform E-Takhrij Hadis.
                        </p>
                    </div>

                    {/* Alert Error */}
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <i className="fa-solid fa-circle-exclamation text-base shrink-0"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Google Login Section (Prominent for General Users) */}
                        <div className="flex flex-col items-center gap-3">
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-1">
                                Masuk sebagai Pengguna Umum
                            </p>
                            <div className="w-full flex justify-center hover:scale-[1.01] transition-transform duration-200">
                                <GoogleLogin
                                    onSuccess={async (credentialResponse) => {
                                        setLoading(true);
                                        setError('');
                                        const result = await googleLogin(credentialResponse.credential);
                                        setLoading(false);
                                        if (!result.success) {
                                            setError(result.message);
                                        }
                                    }}
                                    onError={() => {
                                        setError('Login Google gagal. Silakan coba lagi.');
                                    }}
                                    useOneTap
                                    theme={isDark ? 'dark' : 'outline'}
                                    shape="pill"
                                    size="large"
                                    width="100%"
                                />
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-800/80"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                                <span className="bg-white dark:bg-slate-900 px-4 text-slate-400 dark:text-slate-500">ATAU</span>
                            </div>
                        </div>

                        {/* Admin Login Toggle Button */}
                        <button
                            type="button"
                            onClick={() => setShowAdminForm(!showAdminForm)}
                            className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.01] ${showAdminForm
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                                    : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-350 hover:bg-emerald-500/5 hover:border-emerald-500/30'
                                }`}
                        >
                            <i className={`fa-solid ${showAdminForm ? 'fa-xmark' : 'fa-user-shield'} text-sm`}></i>
                            <span>{showAdminForm ? "Sembunyikan Login Admin" : "Masuk sebagai Admin / Verifikator"}</span>
                        </button>

                        {/* Admin Login Form (Collapsible) */}
                        {showAdminForm && (
                            <form onSubmit={handleAdminSubmit} className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Username Admin</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                            <i className="fa-solid fa-user-lock"></i>
                                        </div>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Username khusus admin"
                                            disabled={loading}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                            <i className="fa-solid fa-key"></i>
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            disabled={loading}
                                            className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350"
                                        >
                                            {showPassword ? <i className="fa-solid fa-eye-slash"></i> : <i className="fa-solid fa-eye"></i>}
                                        </button>
                                    </div>
                                </div>

                                {/* Submit button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-2xl text-sm shadow-md shadow-emerald-500/25 transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Menghubungkan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-right-to-bracket text-base"></i>
                                            <span>Masuk sebagai Admin</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Footer link */}
                    <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-850 pt-6">
                        <p className="text-slate-500 dark:text-slate-450 text-xs">
                            Belum memiliki akun?{' '}
                            <Link to="/register" className="text-emerald-500 dark:text-emerald-400 font-bold hover:underline">
                                Daftar Akun Baru
                            </Link>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
