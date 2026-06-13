import { useEffect, useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
    const location = useLocation()
    const currentPath = location.pathname
    const { user, logout } = useAuth()

    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('color-theme') === 'dark' ||
                (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
        }
        return false
    })

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('color-theme', 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('color-theme', 'light')
        }
    }, [isDark])

    return (
        <div className="text-slate-800 dark:text-slate-100 antialiased min-h-screen flex flex-col">
            <nav className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight hover:text-emerald-100 transition-colors">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 text-4xl shadow-inner">
                                    <img src="/logo.png" alt="Logo" className="h-8 w-8" />
                                </div>
                                E-Takhrij
                            </Link>
                        </div>

                        <div className="flex items-center space-x-2 sm:space-x-4">
                            {/* Desktop Navigation Links (Hidden on Mobile) */}
                            <div className="hidden sm:flex items-center space-x-4 mr-2">
                                <Link to="/" className={`font-medium hover:text-emerald-200 transition-colors flex items-center gap-1.5 ${currentPath === '/' ? 'text-emerald-100 font-bold' : ''}`}>
                                    <i className="fa-solid fa-house text-sm"></i>
                                    <span>Beranda</span>
                                </Link>

                                {user && (
                                    <Link to="/tematik" className={`font-medium hover:text-emerald-200 transition-colors flex items-center gap-1.5 ${currentPath === '/tematik' ? 'text-emerald-100 font-bold' : ''}`}>
                                        <i className="fa-solid fa-layer-group text-sm"></i>
                                        <span>Tematik</span>
                                    </Link>
                                )}
                                <Link to="/profile" className={`font-medium hover:text-emerald-200 transition-colors flex items-center gap-1.5 ${currentPath === '/profile' ? 'text-emerald-100 font-bold' : ''}`}>
                                    <i className="fa-solid fa-user-check text-sm"></i>
                                    <span>Tentang</span>
                                </Link>
                                {user?.is_admin && (
                                    <Link to="/admin" className={`px-3.5 py-1.5 bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400/30 rounded-full font-bold transition-all duration-300 flex items-center gap-1.5 text-sm ${currentPath === '/admin' ? 'bg-rose-500/40' : ''}`}>
                                        <i className="fa-solid fa-user-shield text-xs"></i>
                                        <span>Dashboard</span>
                                    </Link>
                                )}
                            </div>

                            {/* Theme Toggler (Always visible on header) */}
                            <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 focus:outline-none flex items-center justify-center shrink-0" title="Ganti Tema">
                                {isDark ? <i className="fa-solid fa-sun text-lg"></i> : <i className="fa-solid fa-moon text-lg"></i>}
                            </button>

                            {/* User Auth controls */}
                            <div className="flex items-center gap-2">
                                {user ? (
                                    <div className="flex items-center gap-2">
                                        <div className="hidden md:flex flex-col items-end text-xs leading-tight">
                                            <span className="font-bold">{user.username}</span>
                                            <span className="text-[9px] text-emerald-100 dark:text-emerald-200 uppercase font-black tracking-wider leading-none">
                                                {user.is_admin ? 'Admin' : 'Client'}
                                            </span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/20 border border-white/15 flex items-center justify-center font-black text-sm select-none" title={user.username}>
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <button
                                            onClick={logout}
                                            className="p-2 rounded-full bg-white/10 hover:bg-rose-500/30 hover:text-rose-100 transition-all duration-300 flex items-center justify-center text-sm"
                                            title="Keluar (Logout)"
                                        >
                                            <i className="fa-solid fa-right-from-bracket"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        to="/login"
                                        className="px-4 py-1.5 bg-white text-emerald-700 hover:bg-emerald-50 rounded-full font-bold text-sm transition-all duration-300 shadow-sm flex items-center gap-1.5"
                                    >
                                        <i className="fa-solid fa-right-to-bracket text-xs"></i>
                                        <span>Masuk</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 sm:pb-10">
                <Outlet />
            </main>

            <footer className="hidden sm:block bg-slate-950 text-slate-400 border-t border-slate-900 mt-auto pt-16 pb-28 sm:pb-12 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-10">
                    {/* Brand Info Column */}
                    <div className="md:col-span-5 space-y-4">
                        <Link to="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white hover:text-emerald-400 transition-colors">
                            <i className="fa-solid fa-book-open text-emerald-500"></i> E-Takhrij
                        </Link>
                        <p className="text-sm leading-relaxed text-slate-500 max-w-sm">
                            Platform pencarian dan analisis sanad hadis berbasis Natural Language Processing (NLP), Retrieval Augmented Generation (RAG), dan Social Network Analysis (SNA) secara interaktif dan edukatif.
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                            <a href="#" className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 hover:text-white flex items-center justify-center text-sm transition-all duration-300 shadow-inner" title="GitHub">
                                <i className="fa-brands fa-github"></i>
                            </a>
                            <a href="#" className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-emerald-950 hover:text-emerald-400 flex items-center justify-center text-sm transition-all duration-300 shadow-inner" title="Google Scholar">
                                <i className="fa-solid fa-graduation-cap"></i>
                            </a>
                            <a href="mailto:contact@smart-takhrij.org" className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-teal-950 hover:text-teal-400 flex items-center justify-center text-sm transition-all duration-300 shadow-inner" title="Email Contact">
                                <i className="fa-solid fa-envelope"></i>
                            </a>
                        </div>
                    </div>

                    {/* Navigation Column */}
                    <div className="md:col-span-3 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Navigasi Cepat</h4>
                        <ul className="space-y-2.5 text-sm">
                            <li>
                                <Link to="/" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                                    <i className="fa-solid fa-chevron-right text-[10px] text-slate-600"></i> Beranda Hadis
                                </Link>
                            </li>
                            <li>
                                <Link to="/chat" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                                    <i className="fa-solid fa-chevron-right text-[10px] text-slate-600"></i> Asisten AI ILHA
                                </Link>
                            </li>
                            <li>
                                <Link to="/profile" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                                    <i className="fa-solid fa-chevron-right text-[10px] text-slate-600"></i> Profil & Sejarah
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources Column */}
                    <div className="md:col-span-4 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Referensi & Metodologi</h4>
                        <p className="text-xs leading-relaxed text-slate-500">
                            Metode Takhrij hadis pada platform ini disusun berdasarkan metodologi takhrij ulama salaf dikombinasikan dengan visualisasi graf transmisi modern berbasis data Kutubut Tis'ah dan rawi yang terverifikasi.
                        </p>
                        <div className="p-3 bg-slate-900/50 border border-slate-900 rounded-2xl flex items-center gap-3">
                            <i className="fa-solid fa-shield-halved text-2xl text-emerald-500/80 shrink-0"></i>
                            <div>
                                <h5 className="text-xs font-bold text-slate-300">Sanad Verificator Enabled</h5>
                                <p className="text-[10px] text-slate-500">Silsilah terdata dengan keabsahan ilmiah</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider Line */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                    <p className="text-slate-600">&copy; 2026 E-Takhrij Hadis. Hak Cipta Dilindungi Undang-Undang.</p>
                    <div className="flex gap-4 text-slate-600">
                        <a href="#" className="hover:text-slate-400 transition-colors">Syarat Ketentuan</a>
                        <span>&bull;</span>
                        <a href="#" className="hover:text-slate-400 transition-colors">Kebijakan Privasi</a>
                    </div>
                </div>
            </footer>

            {/* Mobile Fixed Bottom Navigation Bar (Hidden on Desktop) */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 shadow-lg shadow-slate-900/10 z-50 flex items-center justify-around">
                {user && (
                    <>
                        <Link to="/" className={`flex flex-col items-center justify-center w-20 h-full transition-all duration-300 ${currentPath === '/'
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                            : 'text-slate-400 dark:text-slate-500'
                            }`}>
                            <i className="fa-solid fa-house text-lg mb-1"></i>
                            <span className="text-[10px] tracking-wider uppercase">Beranda</span>
                        </Link>

                        <Link to="/tematik" className={`flex flex-col items-center justify-center w-20 h-full transition-all duration-300 ${currentPath === '/tematik'
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                            : 'text-slate-400 dark:text-slate-500'
                            }`}>
                            <i className="fa-solid fa-layer-group text-lg mb-1"></i>
                            <span className="text-[10px] tracking-wider uppercase">Tematik</span>
                        </Link>

                        <Link to="/chat" className={`flex flex-col items-center justify-center w-20 h-full transition-all duration-300 ${currentPath === '/chat'
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                            : 'text-slate-400 dark:text-slate-500'
                            }`}>
                            <i className="fa-solid fa-robot text-lg mb-1"></i>
                            <span className="text-[10px] tracking-wider uppercase">Tanya ILHA</span>
                        </Link>

                        {user?.is_admin && (
                            <Link to="/admin" className={`flex flex-col items-center justify-center w-20 h-full transition-all duration-300 ${currentPath === '/admin'
                                ? 'text-rose-600 dark:text-rose-450 font-bold scale-105'
                                : 'text-slate-400 dark:text-slate-500'
                                }`}>
                                <i className="fa-solid fa-user-shield text-lg mb-1"></i>
                                <span className="text-[10px] tracking-wider uppercase">Admin</span>
                            </Link>
                        )}
                    </>
                )}

                <Link to="/profile" className={`flex flex-col items-center justify-center w-20 h-full transition-all duration-300 ${currentPath === '/profile'
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                    : 'text-slate-400 dark:text-slate-500'
                    }`}>
                    <i className="fa-solid fa-user-check text-lg mb-1"></i>
                    <span className="text-[10px] tracking-wider uppercase">Tentang</span>
                </Link>
            </div>
        </div>
    )
}
