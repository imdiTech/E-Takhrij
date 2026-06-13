import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
    const { user, register } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const trimmedUser = username.trim();
        const trimmedPass = password.trim();
        const trimmedConfirm = confirmPassword.trim();

        if (!trimmedUser || !trimmedPass || !trimmedConfirm) {
            setError('Semua form wajib diisi.');
            return;
        }

        if (trimmedPass.length < 4) {
            setError('Password minimal terdiri dari 4 karakter.');
            return;
        }

        if (trimmedPass !== trimmedConfirm) {
            setError('Konfirmasi password tidak cocok.');
            return;
        }

        setLoading(true);
        const result = await register(trimmedUser, trimmedPass);
        setLoading(false);

        if (result.success) {
            setSuccess(result.message || 'Pendaftaran berhasil! Mengalihkan ke login...');
            setTimeout(() => {
                navigate('/login');
            }, 2500);
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="max-w-md mx-auto my-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Background elements */}
            <div className="relative">
                <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-xl relative backdrop-blur-xl">
                    
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 mb-4">
                            <i className="fa-solid fa-user-plus text-xl"></i>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Daftar Akun Baru</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Buat akun untuk melacak silsilah perawi hadis Anda</p>
                    </div>

                    {/* Alert Error */}
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <i className="fa-solid fa-circle-exclamation text-base shrink-0"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Alert Success */}
                    {success && (
                        <div className="mb-6 p-4 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <i className="fa-solid fa-circle-check text-base shrink-0"></i>
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Username</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                    <i className="fa-solid fa-user"></i>
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Buat username unik"
                                    disabled={loading || success}
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
                                    placeholder="Masukkan password"
                                    disabled={loading || success}
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

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Konfirmasi Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                    <i className="fa-solid fa-shield-halved"></i>
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Ulangi password"
                                    disabled={loading || success}
                                    className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading || success}
                            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-2xl text-sm shadow-md shadow-emerald-500/25 transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Mendaftarkan...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-user-plus text-base"></i>
                                    <span>Daftar Sekarang</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer link */}
                    <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-850 pt-6">
                        <p className="text-slate-500 dark:text-slate-450 text-xs">
                            Sudah memiliki akun?{' '}
                            <Link to="/login" className="text-emerald-500 dark:text-emerald-400 font-bold hover:underline">
                                Masuk di Sini
                            </Link>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
