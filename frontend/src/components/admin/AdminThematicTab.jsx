import React, { useState, useEffect } from 'react';
import api from '../../api';

export default function AdminThematicTab() {
    // Shared State
    const [notification, setNotification] = useState(null);
    const showNotification = (type, text) => {
        setNotification({ type, text });
        setTimeout(() => setNotification(null), 4000);
    };

    // Themes State
    const [themes, setThemes] = useState([]);
    const [loadingThemes, setLoadingThemes] = useState(false);
    const [selectedThemeId, setSelectedThemeId] = useState(null);
    const [themeForm, setThemeForm] = useState({ id: null, tema: '', deskripsi: '' });
    const [isThemeFormOpen, setIsThemeFormOpen] = useState(false);

    // SubThemes State
    const [subThemes, setSubThemes] = useState([]);
    const [loadingSubThemes, setLoadingSubThemes] = useState(false);
    const [selectedSubThemeId, setSelectedSubThemeId] = useState(null);
    const [subThemeForm, setSubThemeForm] = useState({ id: null, judul: '', deskripsi: '' });
    const [isSubThemeFormOpen, setIsSubThemeFormOpen] = useState(false);

    // Hadiths State
    const [hadiths, setHadiths] = useState([]);
    const [loadingHadiths, setLoadingHadiths] = useState(false);
    
    // Search Hadith State
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Syarh Form State
    const [isSyarhFormOpen, setIsSyarhFormOpen] = useState(false);
    const [selectedHadithFromSearch, setSelectedHadithFromSearch] = useState(null);
    const [syarhForm, setSyarhForm] = useState({ id: null, hadith_id: null, syarh_hadith: '' }); // id is thematic_id, hadith_id is main table id

    useEffect(() => {
        fetchThemes();
    }, []);

    useEffect(() => {
        if (selectedThemeId) {
            fetchSubThemes(selectedThemeId);
            setSelectedSubThemeId(null);
            setHadiths([]);
        } else {
            setSubThemes([]);
        }
    }, [selectedThemeId]);

    useEffect(() => {
        if (selectedSubThemeId) {
            fetchHadiths(selectedSubThemeId);
        } else {
            setHadiths([]);
        }
    }, [selectedSubThemeId]);

    // --- API THEMES ---
    const fetchThemes = async () => {
        setLoadingThemes(true);
        try {
            const res = await api.get('/admin-api/themes');
            if (res.data.success) setThemes(res.data.themes);
        } catch (err) {
            showNotification('error', 'Gagal memuat tema');
        } finally {
            setLoadingThemes(false);
        }
    };

    const saveTheme = async (e) => {
        e.preventDefault();
        try {
            let res;
            if (themeForm.id) {
                res = await api.put(`/admin-api/themes/${themeForm.id}`, themeForm);
            } else {
                res = await api.post('/admin-api/themes', themeForm);
            }
            if (res.data.success) {
                showNotification('success', res.data.message);
                fetchThemes();
                setIsThemeFormOpen(false);
            }
        } catch (err) {
            showNotification('error', 'Gagal menyimpan tema');
        }
    };

    const deleteTheme = async (id) => {
        if (!window.confirm('Yakin menghapus Tema ini? Semua Sub Tema & Hadis di dalamnya akan terhapus.')) return;
        try {
            const res = await api.delete(`/admin-api/themes/${id}`);
            if (res.data.success) {
                showNotification('success', res.data.message);
                if (selectedThemeId === id) setSelectedThemeId(null);
                fetchThemes();
            }
        } catch (err) {
            showNotification('error', 'Gagal menghapus tema');
        }
    };

    // --- API SUBTHEMES ---
    const fetchSubThemes = async (themeId) => {
        setLoadingSubThemes(true);
        try {
            const res = await api.get(`/admin-api/themes/${themeId}/subthemes`);
            if (res.data.success) setSubThemes(res.data.sub_themes);
        } catch (err) {
            showNotification('error', 'Gagal memuat sub tema');
        } finally {
            setLoadingSubThemes(false);
        }
    };

    const saveSubTheme = async (e) => {
        e.preventDefault();
        try {
            let res;
            if (subThemeForm.id) {
                res = await api.put(`/admin-api/themes/${selectedThemeId}/subthemes/${subThemeForm.id}`, subThemeForm);
            } else {
                res = await api.post(`/admin-api/themes/${selectedThemeId}/subthemes`, subThemeForm);
            }
            if (res.data.success) {
                showNotification('success', res.data.message);
                fetchSubThemes(selectedThemeId);
                setIsSubThemeFormOpen(false);
            }
        } catch (err) {
            console.error("Error saving sub theme:", err);
            const msg = err.response?.data?.message || err.message || 'Gagal menyimpan sub tema';
            showNotification('error', msg);
        }
    };

    const deleteSubTheme = async (id) => {
        if (!window.confirm('Yakin menghapus Sub Tema ini? Semua Hadis di dalamnya akan terhapus.')) return;
        try {
            const res = await api.delete(`/admin-api/themes/${selectedThemeId}/subthemes/${id}`);
            if (res.data.success) {
                showNotification('success', res.data.message);
                if (selectedSubThemeId === id) setSelectedSubThemeId(null);
                fetchSubThemes(selectedThemeId);
            }
        } catch (err) {
            showNotification('error', 'Gagal menghapus sub tema');
        }
    };

    // --- API HADITHS ---
    const fetchHadiths = async (subThemeId) => {
        setLoadingHadiths(true);
        try {
            const res = await api.get(`/admin-api/subthemes/${subThemeId}/hadiths`);
            if (res.data.success) setHadiths(res.data.hadiths);
        } catch (err) {
            showNotification('error', 'Gagal memuat hadis');
        } finally {
            setLoadingHadiths(false);
        }
    };

    const searchMainHadiths = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await api.get(`/admin-api/hadith?q=${encodeURIComponent(searchQuery)}&page=1&limit=10`);
            if (res.data.success) {
                setSearchResults(res.data.hadiths || []);
            }
        } catch (err) {
            showNotification('error', 'Gagal mencari hadis');
        } finally {
            setIsSearching(false);
        }
    };

    const openSyarhFormForNew = (hadith) => {
        setSelectedHadithFromSearch(hadith);
        setSyarhForm({ id: null, hadith_id: hadith.id, syarh_hadith: '' });
        setIsSearchModalOpen(false);
        setIsSyarhFormOpen(true);
    };

    const openSyarhFormForEdit = (thematicHadith) => {
        setSelectedHadithFromSearch({
            kitab: thematicHadith.kitab,
            nomor: thematicHadith.nomor,
            terjemahan: thematicHadith.terjemahan,
            arab: thematicHadith.arab || thematicHadith.matan_arab
        });
        setSyarhForm({ id: thematicHadith.id, hadith_id: thematicHadith.hadith_id, syarh_hadith: thematicHadith.syarh_hadith || '' });
        setIsSyarhFormOpen(true);
    };

    const saveThematicHadith = async (e) => {
        e.preventDefault();
        try {
            let res;
            if (syarhForm.id) {
                // Update existing
                res = await api.put(`/admin-api/subthemes/${selectedSubThemeId}/hadiths/${syarhForm.id}`, {
                    syarh_hadith: syarhForm.syarh_hadith
                });
            } else {
                // Create new
                res = await api.post(`/admin-api/subthemes/${selectedSubThemeId}/hadiths`, {
                    hadith_id: syarhForm.hadith_id,
                    syarh_hadith: syarhForm.syarh_hadith
                });
            }
            if (res.data.success) {
                showNotification('success', res.data.message);
                fetchHadiths(selectedSubThemeId);
                setIsSyarhFormOpen(false);
                setSearchQuery('');
                setSearchResults([]);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Gagal menyimpan hadis';
            showNotification('error', errorMsg);
        }
    };

    const deleteHadith = async (id) => {
        if (!window.confirm('Yakin mengeluarkan Hadis ini dari Sub Tema?')) return;
        try {
            const res = await api.delete(`/admin-api/subthemes/${selectedSubThemeId}/hadiths/${id}`);
            if (res.data.success) {
                showNotification('success', res.data.message);
                fetchHadiths(selectedSubThemeId);
            }
        } catch (err) {
            showNotification('error', 'Gagal menghapus hadis');
        }
    };

    return (
        <div className="space-y-6">
            {notification && (
                <div className={`p-4 border text-sm font-semibold rounded-2xl flex items-center gap-3 ${
                    notification.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-600'
                }`}>
                    <span>{notification.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* 1. Themes Panel */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[650px]">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
                            <i className="fa-solid fa-layer-group text-emerald-500"></i> Tema
                        </h3>
                        <button
                            onClick={() => { setThemeForm({ id: null, tema: '', deskripsi: '' }); setIsThemeFormOpen(true); }}
                            className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
                        >
                            <i className="fa-solid fa-plus text-xs"></i>
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {loadingThemes ? (
                            <p className="text-center p-4 text-xs text-slate-400">Memuat...</p>
                        ) : themes.length === 0 ? (
                            <p className="text-center p-4 text-xs text-slate-400">Belum ada tema.</p>
                        ) : (
                            themes.map(t => (
                                <div key={t.id} className={`p-3 rounded-2xl border transition-all cursor-pointer flex justify-between items-center group ${selectedThemeId === t.id ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-500/30'}`} onClick={() => setSelectedThemeId(t.id)}>
                                    <div className="truncate pr-2">
                                        <h4 className={`font-bold text-xs truncate ${selectedThemeId === t.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{t.tema}</h4>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <button onClick={(e) => { e.stopPropagation(); setThemeForm(t); setIsThemeFormOpen(true); }} className="text-amber-500 hover:text-amber-600 p-1">
                                            <i className="fa-solid fa-pen text-[10px]"></i>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); deleteTheme(t.id); }} className="text-rose-500 hover:text-rose-600 p-1">
                                            <i className="fa-solid fa-trash text-[10px]"></i>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. SubThemes Panel */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[650px]">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
                            <i className="fa-solid fa-sitemap text-teal-500"></i> Sub Tema
                        </h3>
                        {selectedThemeId && (
                            <button
                                onClick={() => { setSubThemeForm({ id: null, judul: '', deskripsi: '' }); setIsSubThemeFormOpen(true); }}
                                className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 flex items-center justify-center transition-colors"
                            >
                                <i className="fa-solid fa-plus text-xs"></i>
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {!selectedThemeId ? (
                            <div className="h-full flex items-center justify-center text-slate-400 p-4 text-center text-xs">
                                <p>Pilih Tema di samping kiri untuk melihat Sub Tema.</p>
                            </div>
                        ) : loadingSubThemes ? (
                            <p className="text-center p-4 text-xs text-slate-400">Memuat...</p>
                        ) : subThemes.length === 0 ? (
                            <p className="text-center p-4 text-xs text-slate-400">Belum ada sub tema.</p>
                        ) : (
                            subThemes.map(st => (
                                <div key={st.id} className={`p-3 rounded-2xl border transition-all cursor-pointer flex justify-between items-center group ${selectedSubThemeId === st.id ? 'bg-teal-500/10 border-teal-500/50' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-teal-500/30'}`} onClick={() => setSelectedSubThemeId(st.id)}>
                                    <div className="truncate pr-2">
                                        <h4 className={`font-bold text-xs truncate ${selectedSubThemeId === st.id ? 'text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'}`}>{st.judul}</h4>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <button onClick={(e) => { e.stopPropagation(); setSubThemeForm(st); setIsSubThemeFormOpen(true); }} className="text-amber-500 hover:text-amber-600 p-1">
                                            <i className="fa-solid fa-pen text-[10px]"></i>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); deleteSubTheme(st.id); }} className="text-rose-500 hover:text-rose-600 p-1">
                                            <i className="fa-solid fa-trash text-[10px]"></i>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 3. Hadiths Panel */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[650px]">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
                            <i className="fa-solid fa-book-open text-indigo-500"></i> Hadis
                        </h3>
                        {selectedSubThemeId && (
                            <button
                                onClick={() => setIsSearchModalOpen(true)}
                                className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 flex items-center gap-1.5 text-xs font-bold transition-colors"
                            >
                                <i className="fa-solid fa-plus"></i> Tambah Hadis
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4">
                        {!selectedSubThemeId ? (
                            <div className="h-full flex items-center justify-center text-slate-400 p-4 text-center text-sm">
                                <div>
                                    <i className="fa-solid fa-hand-pointer text-4xl mb-4 opacity-30"></i>
                                    <p>Pilih Sub Tema untuk melihat dan mengelola hadis.</p>
                                </div>
                            </div>
                        ) : loadingHadiths ? (
                            <p className="text-center p-4 text-sm text-slate-400">Memuat hadis...</p>
                        ) : hadiths.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-sm text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">Belum ada hadis untuk sub tema ini.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {hadiths.map((h, i) => (
                                    <div key={h.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col sm:flex-row justify-between gap-4">
                                        <div className="flex-1">
                                            <span className="inline-block px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-md text-[10px] font-bold text-slate-500 mb-2">#{i + 1}</span>
                                            <h4 className="font-bold text-sm text-slate-800 dark:text-white">{h.kitab} No. {h.nomor}</h4>
                                            {h.bab && <p className="text-[11px] text-indigo-600 mt-1 uppercase tracking-wider">{h.bab}</p>}
                                            <p className="text-xs text-slate-500 mt-2 line-clamp-2">{h.terjemahan}</p>
                                            {h.syarh_hadith && (
                                                <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 mb-1">SYARH/PENJELASAN:</p>
                                                    <p className="text-xs text-amber-900 dark:text-amber-400 line-clamp-2">{h.syarh_hadith}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex sm:flex-col gap-2 shrink-0">
                                            <button onClick={() => openSyarhFormForEdit(h)} className="px-3 py-1.5 text-[10px] font-bold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors">Edit Syarh</button>
                                            <button onClick={() => deleteHadith(h.id)} className="px-3 py-1.5 text-[10px] font-bold text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors">Keluarkan</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Theme */}
            {isThemeFormOpen && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
                        <h3 className="text-base font-bold mb-4">{themeForm.id ? 'Edit Tema' : 'Tambah Tema'}</h3>
                        <form onSubmit={saveTheme} className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 block mb-1">Judul Tema</label>
                                <input type="text" required value={themeForm.tema} onChange={e => setThemeForm({...themeForm, tema: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl dark:bg-slate-800 dark:border-slate-700" />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 block mb-1">Deskripsi</label>
                                <textarea rows="3" value={themeForm.deskripsi || ''} onChange={e => setThemeForm({...themeForm, deskripsi: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl dark:bg-slate-800 dark:border-slate-700" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsThemeFormOpen(false)} className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl">Batal</button>
                                <button type="submit" className="px-4 py-2 text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal SubTheme */}
            {isSubThemeFormOpen && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
                        <h3 className="text-base font-bold mb-4">{subThemeForm.id ? 'Edit Sub Tema' : 'Tambah Sub Tema'}</h3>
                        <form onSubmit={saveSubTheme} className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 block mb-1">Judul Sub Tema</label>
                                <input type="text" required value={subThemeForm.judul} onChange={e => setSubThemeForm({...subThemeForm, judul: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl dark:bg-slate-800 dark:border-slate-700" />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 block mb-1">Deskripsi</label>
                                <textarea rows="3" value={subThemeForm.deskripsi || ''} onChange={e => setSubThemeForm({...subThemeForm, deskripsi: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl dark:bg-slate-800 dark:border-slate-700" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsSubThemeFormOpen(false)} className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl">Batal</button>
                                <button type="submit" className="px-4 py-2 text-xs font-bold bg-teal-500 text-white hover:bg-teal-600 rounded-xl">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Search Hadith */}
            {isSearchModalOpen && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold">Cari Hadis Utama</h3>
                            <button onClick={() => setIsSearchModalOpen(false)} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-times"></i></button>
                        </div>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
                            <form onSubmit={searchMainHadiths} className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Ketik kata kunci atau nomor hadis..." 
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="flex-1 px-4 py-2 text-sm border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                                />
                                <button type="submit" className="px-6 py-2 bg-indigo-500 text-white font-bold rounded-xl text-sm hover:bg-indigo-600 disabled:opacity-50" disabled={isSearching || !searchQuery.trim()}>
                                    {isSearching ? 'Mencari...' : 'Cari'}
                                </button>
                            </form>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {searchResults.length === 0 ? (
                                <p className="text-center text-slate-400 text-sm mt-10">Gunakan kotak di atas untuk mencari hadis.</p>
                            ) : (
                                searchResults.map((result) => (
                                    <div key={result.id} className="p-4 border rounded-xl hover:border-indigo-500/50 transition-colors flex flex-col gap-3">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <h4 className="font-bold text-sm">{result.kitab} No. {result.nomor}</h4>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{result.terjemahan}</p>
                                            </div>
                                            <button 
                                                onClick={() => openSyarhFormForNew(result)}
                                                className="px-4 py-1.5 shrink-0 bg-indigo-500/10 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-500/20"
                                            >
                                                Pilih Hadis
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Syarh Form */}
            {isSyarhFormOpen && selectedHadithFromSearch && (
                <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold">{syarhForm.id ? 'Edit Syarh Hadis' : 'Tambahkan Syarh Hadis'}</h3>
                            <button onClick={() => setIsSyarhFormOpen(false)} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-times"></i></button>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800">
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-2">{selectedHadithFromSearch.kitab} No. {selectedHadithFromSearch.nomor}</h4>
                            <p className="font-arabic text-xl text-right leading-[2.2] mb-3 text-slate-700 dark:text-slate-300" dir="rtl">{selectedHadithFromSearch.matan_arab || selectedHadithFromSearch.arab}</p>
                            <p className="text-xs text-slate-500 italic line-clamp-3">"{selectedHadithFromSearch.terjemahan}"</p>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <form onSubmit={saveThematicHadith}>
                                <div className="mb-4">
                                    <label className="text-xs font-bold text-amber-600 block mb-2"><i className="fa-solid fa-pen-to-square"></i> Tulis Syarh / Penjelasan Tematik</label>
                                    <textarea 
                                        rows="6" 
                                        placeholder="Tuliskan keterangan, penjelasan, fawaid, atau tafsir hadis di sini berkaitan dengan Sub Tema saat ini..." 
                                        value={syarhForm.syarh_hadith} 
                                        onChange={e => setSyarhForm({...syarhForm, syarh_hadith: e.target.value})} 
                                        className="w-full px-4 py-3 text-sm border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 bg-amber-50/30 rounded-xl dark:bg-amber-950/10 dark:border-amber-900/50 transition-all outline-none" 
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button type="button" onClick={() => setIsSyarhFormOpen(false)} className="px-5 py-2.5 text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl">Batal</button>
                                    <button type="submit" className="px-5 py-2.5 text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 rounded-xl">Simpan Syarh</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
