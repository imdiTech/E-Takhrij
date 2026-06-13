import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function ThematicPage() {
    const [themes, setThemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [selectedThemeId, setSelectedThemeId] = useState(null);
    const [selectedSubThemeId, setSelectedSubThemeId] = useState(null);
    
    const [themeHadiths, setThemeHadiths] = useState([]);
    const [loadingHadiths, setLoadingHadiths] = useState(false);

    useEffect(() => {
        fetchThemes();
    }, []);

    const fetchThemes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/thematic/themes');
            if (response.data.success) {
                setThemes(response.data.themes);
            }
        } catch (err) {
            setError('Gagal memuat daftar tema.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTheme = (themeId) => {
        if (selectedThemeId === themeId) {
            setSelectedThemeId(null);
            setSelectedSubThemeId(null);
            setThemeHadiths([]);
        } else {
            setSelectedThemeId(themeId);
            setSelectedSubThemeId(null);
            setThemeHadiths([]);
        }
    };

    const handleSelectSubTheme = async (subThemeId) => {
        if (selectedSubThemeId === subThemeId) {
            setSelectedSubThemeId(null);
            setThemeHadiths([]);
            return;
        }

        setSelectedSubThemeId(subThemeId);
        try {
            setLoadingHadiths(true);
            const response = await api.get(`/thematic/subthemes/${subThemeId}/hadiths`);
            if (response.data.success) {
                setThemeHadiths(response.data.hadiths);
            }
        } catch (err) {
            console.error('Gagal memuat hadis tematik', err);
        } finally {
            setLoadingHadiths(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-10 text-center relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4 relative z-10">
                    Kumpulan Hadis <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Tematik</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-sm md:text-base relative z-10">
                    Jelajahi berbagai hadis yang dikelompokkan berdasarkan tema dan sub tema spesifik.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center gap-3">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <p className="text-sm font-semibold">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-emerald-600 dark:text-emerald-400 gap-4">
                    <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 dark:border-emerald-900 dark:border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-sm font-bold tracking-wider animate-pulse">MEMUAT TEMA...</p>
                </div>
            ) : themes.length === 0 ? (
                <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
                    <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500 text-3xl shadow-inner">
                        <i className="fa-solid fa-folder-open"></i>
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Belum Ada Tema</h3>
                    <p className="text-sm text-slate-500">Admin belum menambahkan kumpulan hadis tematik.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {themes.map(theme => (
                        <div key={theme.id} className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none backdrop-blur-md transition-all duration-300">
                            <button 
                                onClick={() => handleToggleTheme(theme.id)}
                                className="w-full text-left p-6 md:p-8 flex items-start justify-between group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="flex-1 pr-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                            <i className="fa-solid fa-bookmark"></i>
                                        </div>
                                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                            {theme.tema}
                                        </h2>
                                    </div>
                                    {theme.deskripsi && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-3 ml-13">
                                            {theme.deskripsi}
                                        </p>
                                    )}
                                </div>
                                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-transform duration-500 ${selectedThemeId === theme.id ? 'bg-emerald-500 text-white rotate-180' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30'}`}>
                                    <i className="fa-solid fa-chevron-down"></i>
                                </div>
                            </button>

                            {/* Theme Expanded Content (SubThemes) */}
                            {selectedThemeId === theme.id && (
                                <div className="border-t border-slate-100 dark:border-slate-800/80 p-4 md:p-6 bg-slate-50/50 dark:bg-slate-950/20 animate-in slide-in-from-top-4 fade-in duration-300">
                                    {(!theme.sub_themes || theme.sub_themes.length === 0) ? (
                                        <div className="text-center py-6 text-slate-500 text-sm">Belum ada sub tema di dalam tema ini.</div>
                                    ) : (
                                        <div className="space-y-4">
                                            {theme.sub_themes.map(sub => (
                                                <div key={sub.id} className="border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                                                    <button
                                                        onClick={() => handleSelectSubTheme(sub.id)}
                                                        className="w-full text-left p-4 md:p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                                    >
                                                        <div>
                                                            <h3 className="font-bold text-teal-700 dark:text-teal-400 flex items-center gap-2">
                                                                <i className="fa-solid fa-sitemap opacity-50"></i> {sub.judul}
                                                            </h3>
                                                            {sub.deskripsi && <p className="text-xs text-slate-500 mt-1">{sub.deskripsi}</p>}
                                                        </div>
                                                        <i className={`fa-solid fa-chevron-down transition-transform duration-300 text-slate-400 ${selectedSubThemeId === sub.id ? 'rotate-180' : ''}`}></i>
                                                    </button>

                                                    {/* SubTheme Expanded Content (Hadiths) */}
                                                    {selectedSubThemeId === sub.id && (
                                                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                                                            {loadingHadiths ? (
                                                                <div className="flex justify-center py-6">
                                                                    <div className="w-6 h-6 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                                                                </div>
                                                            ) : themeHadiths.length === 0 ? (
                                                                <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                                                    Belum ada hadis di dalam sub tema ini.
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-6">
                                                                    {themeHadiths.map((hadith, idx) => (
                                                                        <div key={hadith.id} className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                                                                            <div className="flex items-center gap-3 mb-4">
                                                                                <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                                                    {idx + 1}
                                                                                </span>
                                                                                <div>
                                                                                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                                                                        {hadith.kitab} No. {hadith.nomor}
                                                                                    </h3>
                                                                                    {hadith.bab && <p className="text-[10px] uppercase tracking-wider text-teal-600 dark:text-teal-500 mt-0.5">{hadith.bab}</p>}
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            {hadith.arab && (
                                                                                <div className="mb-4 text-right" dir="rtl">
                                                                                    <p className="font-arabic text-xl md:text-2xl leading-[2.2] text-slate-800 dark:text-slate-200">
                                                                                        {hadith.matan_arab || hadith.arab}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                            
                                                                            {hadith.terjemahan && (
                                                                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60">
                                                                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed text-justify">
                                                                                        "{hadith.terjemahan}"
                                                                                    </p>
                                                                                </div>
                                                                            )}

                                                                            {hadith.syarh_hadith && (
                                                                                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                                                                    <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-500">
                                                                                        <i className="fa-solid fa-lightbulb"></i>
                                                                                        <h4 className="text-xs font-bold tracking-wider">SYARH / PENJELASAN</h4>
                                                                                    </div>
                                                                                    <p className="text-sm text-amber-900 dark:text-amber-400 leading-relaxed text-justify">
                                                                                        {hadith.syarh_hadith}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
