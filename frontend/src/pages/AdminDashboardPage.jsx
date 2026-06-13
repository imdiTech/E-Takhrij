import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import AdminThematicTab from '../components/admin/AdminThematicTab';

export default function AdminDashboardPage() {
    const { user } = useAuth();
    
    // Tab state: 'hadiths' or 'users'
    const [activeTab, setActiveTab] = useState('hadiths');

    // Hadith state
    const [hadiths, setHadiths] = useState([]);
    const [hadithSearch, setHadithSearch] = useState('');
    const [hadithPage, setHadithPage] = useState(1);
    const [hadithTotalPages, setHadithTotalPages] = useState(1);
    const [hadithLimit] = useState(8);
    const [hadithLoading, setHadithLoading] = useState(false);

    // User management state
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);

    // Dialog / Modal state
    const [isHadithModalOpen, setIsHadithModalOpen] = useState(false);
    const [editingHadith, setEditingHadith] = useState(null); // null means adding new

    // Form inputs for Hadith
    const [kitab, setKitab] = useState('');
    const [nomor, setNomor] = useState('');
    const [bab, setBab] = useState('');
    const [arab, setArab] = useState('');
    const [terjemahan, setTerjemahan] = useState('');
    const [english, setEnglish] = useState('');
    const [sanad, setSanad] = useState([]); // Array of strings (rawi names)
    const [sanadEdges, setSanadEdges] = useState([]); // Array of [source, target] arrays

    // Alert state
    const [notification, setNotification] = useState(null); // { type: 'success'|'error', text: '' }

    // Fetch hadiths
    const fetchHadiths = async () => {
        setHadithLoading(true);
        try {
            const response = await api.get('/admin-api/hadith', {
                params: {
                    page: hadithPage,
                    limit: hadithLimit,
                    q: hadithSearch
                }
            });
            if (response.data.success) {
                setHadiths(response.data.hadiths);
                setHadithTotalPages(response.data.total_pages);
            }
        } catch (error) {
            showNotification('error', 'Gagal memuat daftar hadis.');
        } finally {
            setHadithLoading(false);
        }
    };

    // Fetch users
    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const response = await api.get('/admin-api/users');
            if (response.data.success) {
                setUsers(response.data.users);
            }
        } catch (error) {
            showNotification('error', 'Gagal memuat daftar pengguna.');
        } finally {
            setUsersLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'hadiths') {
            fetchHadiths();
        } else {
            fetchUsers();
        }
    }, [activeTab, hadithPage, hadithSearch]);

    // Handle search input with manual search click or trigger
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setHadithPage(1);
        fetchHadiths();
    };

    const showNotification = (type, text) => {
        setNotification({ type, text });
        setTimeout(() => {
            setNotification(null);
        }, 4000);
    };

    // Toggle user admin role
    const handleToggleAdmin = async (userId) => {
        try {
            const response = await api.put(`/admin-api/users/${userId}/toggle-admin`);
            if (response.data.success) {
                showNotification('success', response.data.message);
                fetchUsers();
            } else {
                showNotification('error', response.data.message);
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Gagal mengubah peran admin.';
            showNotification('error', msg);
        }
    };

    // Delete user account
    const handleDeleteUser = async (userId, username) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus akun "${username}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) {
            return;
        }

        try {
            const response = await api.delete(`/admin-api/users/${userId}`);
            if (response.data.success) {
                showNotification('success', response.data.message);
                fetchUsers();
            } else {
                showNotification('error', response.data.message);
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Gagal menghapus akun.';
            showNotification('error', msg);
        }
    };

    // Delete Hadith
    const handleDeleteHadith = async (hadithId, hKitab, hNomor) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus hadis ${hKitab} No. ${hNomor}?`)) {
            return;
        }

        try {
            const response = await api.delete(`/admin-api/hadith/${hadithId}`);
            if (response.data.success) {
                showNotification('success', response.data.message);
                fetchHadiths();
            } else {
                showNotification('error', response.data.message);
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Gagal menghapus hadis.';
            showNotification('error', msg);
        }
    };

    // Open Modal to create/edit hadith
    const openHadithModal = (hadithObj = null) => {
        if (hadithObj) {
            setEditingHadith(hadithObj);
            setKitab(hadithObj.kitab || '');
            setNomor(hadithObj.nomor || '');
            setBab(hadithObj.bab || '');
            setArab(hadithObj.arab || '');
            setTerjemahan(hadithObj.terjemahan || '');
            setEnglish(hadithObj.english || '');
            setSanad(hadithObj.sanad || []);
            setSanadEdges(hadithObj.sanad_edges || []);
        } else {
            setEditingHadith(null);
            setKitab('');
            setNomor('');
            setBab('');
            setArab('');
            setTerjemahan('');
            setEnglish('');
            setSanad([]);
            setSanadEdges([]);
        }
        setIsHadithModalOpen(true);
    };

    // Sanad list items controls
    const handleAddRawi = () => {
        setSanad([...sanad, '']);
    };

    const handleUpdateRawiName = (index, value) => {
        const newSanad = [...sanad];
        const oldName = newSanad[index];
        newSanad[index] = value;
        setSanad(newSanad);

        // Update edges reference names reactively if we change a narrator's name
        const updatedEdges = sanadEdges.map(edge => {
            const source = edge[0] === oldName ? value : edge[0];
            const target = edge[1] === oldName ? value : edge[1];
            return [source, target];
        });
        setSanadEdges(updatedEdges);
    };

    const handleRemoveRawi = (index) => {
        const removedName = sanad[index];
        const newSanad = sanad.filter((_, idx) => idx !== index);
        setSanad(newSanad);

        // Filter out edges containing the removed narrator
        const updatedEdges = sanadEdges.filter(edge => edge[0] !== removedName && edge[1] !== removedName);
        setSanadEdges(updatedEdges);
    };

    // Sanad Edges items controls
    const handleAddEdge = () => {
        if (sanad.length < 2) {
            showNotification('error', 'Harus ada minimal 2 perawi untuk menghubungkan rantai transmisi.');
            return;
        }
        // Default to first two rawi in list
        setSanadEdges([...sanadEdges, [sanad[0], sanad[1]]]);
    };

    const handleUpdateEdge = (edgeIdx, pairIdx, val) => {
        const updated = [...sanadEdges];
        updated[edgeIdx] = [...updated[edgeIdx]];
        updated[edgeIdx][pairIdx] = val;
        setSanadEdges(updated);
    };

    const handleRemoveEdge = (index) => {
        setSanadEdges(sanadEdges.filter((_, idx) => idx !== index));
    };

    // Save Hadith (Create or Update)
    const handleSaveHadithSubmit = async (e) => {
        e.preventDefault();
        
        if (!kitab.trim() || !nomor.trim()) {
            showNotification('error', 'Nama kitab dan nomor hadis wajib diisi.');
            return;
        }

        const cleanSanad = sanad.map(s => s.trim()).filter(s => s !== '');
        
        // Filter edges to only keep those referencing valid, non-empty narrator names
        const cleanEdges = sanadEdges.filter(edge => {
            return edge[0] && edge[1] && cleanSanad.includes(edge[0]) && cleanSanad.includes(edge[1]);
        });

        const payload = {
            kitab: kitab.trim(),
            nomor: nomor.trim(),
            bab: bab.trim(),
            arab: arab.trim(),
            terjemahan: terjemahan.trim(),
            english: english.trim(),
            sanad: cleanSanad,
            sanad_edges: cleanEdges
        };

        try {
            let response;
            if (editingHadith) {
                // Update
                response = await api.put(`/admin-api/hadith/${editingHadith.id}`, payload);
            } else {
                // Create
                response = await api.post('/admin-api/hadith', payload);
            }

            if (response.data.success) {
                showNotification('success', response.data.message);
                setIsHadithModalOpen(false);
                fetchHadiths();
            } else {
                showNotification('error', response.data.message);
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Gagal menyimpan data hadis.';
            showNotification('error', msg);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header section */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                <div className="relative z-10 space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/20 text-white rounded-full text-[10px] font-bold border border-white/10 backdrop-blur-md uppercase tracking-wider">
                        Dashboard Admin
                    </span>
                    <h1 className="text-3xl font-black tracking-tight leading-tight">Panel Administrasi Sistem</h1>
                    <p className="text-emerald-100 text-sm max-w-xl">
                        Selamat datang, <span className="font-bold underline">{user?.username}</span>. Melalui panel ini Anda dapat mengelola data database hadis dan mengatur tingkat otorisasi pengguna.
                    </p>
                </div>

                <div className="relative z-10 shrink-0">
                    <button
                        onClick={() => openHadithModal(null)}
                        className="px-5 py-3 bg-white text-emerald-700 font-bold rounded-2xl text-sm shadow-md hover:bg-emerald-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                    >
                        <i className="fa-solid fa-plus text-base"></i>
                        <span>Tambah Hadis Baru</span>
                    </button>
                </div>
            </div>

            {/* Notification alert */}
            {notification && (
                <div className={`p-4 border text-sm font-semibold rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-300 ${
                    notification.type === 'success'
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30 text-rose-600 dark:text-rose-400'
                }`}>
                    <i className={`fa-solid ${notification.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'} text-lg`}></i>
                    <span>{notification.text}</span>
                </div>
            )}

            {/* Content Switcher / Tabs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-2.5 shadow-sm inline-flex w-full md:w-auto gap-2">
                <button
                    onClick={() => setActiveTab('hadiths')}
                    className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                        activeTab === 'hadiths'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/15'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <i className="fa-solid fa-book text-base"></i>
                    <span>Kelola Hadis ({hadiths.length})</span>
                </button>
                
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                        activeTab === 'users'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/15'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <i className="fa-solid fa-users-gear text-base"></i>
                    <span>Kelola Pengguna ({users.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('thematic')}
                    className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                        activeTab === 'thematic'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/15'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <i className="fa-solid fa-layer-group text-base"></i>
                    <span>Kelola Tematik</span>
                </button>
            </div>

            {/* TAB CONTAINER 1: HADITH CRUD */}
            {activeTab === 'hadiths' && (
                <div className="space-y-6">
                    {/* Hadith Search / Filter Toolbar */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-5 shadow-sm">
                        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
                            <div className="relative flex-grow">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                                    <i className="fa-solid fa-magnifying-glass text-sm"></i>
                                </span>
                                <input
                                    type="text"
                                    placeholder="Cari hadis berdasarkan nama kitab, nomor, atau potongan terjemahan..."
                                    value={hadithSearch}
                                    onChange={(e) => setHadithSearch(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-2xl text-sm transition-all"
                            >
                                Cari Data
                            </button>
                        </form>
                    </div>

                    {/* Hadith List Table */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm">
                        {hadithLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3">
                                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs text-slate-400 font-medium">Memuat data hadis...</span>
                            </div>
                        ) : hadiths.length === 0 ? (
                            <div className="py-20 text-center text-slate-400 max-w-xs mx-auto space-y-4">
                                <i className="fa-solid fa-circle-info text-4xl opacity-20"></i>
                                <div>
                                    <h4 className="font-bold text-slate-700 dark:text-slate-350">Data Tidak Ditemukan</h4>
                                    <p className="text-xs mt-1 leading-relaxed">Coba ganti filter pencarian atau buat entri hadis baru.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                                            <th className="px-6 py-4">ID</th>
                                            <th className="px-6 py-4">Kitab / Sanad</th>
                                            <th className="px-6 py-4">Nomor</th>
                                            <th className="px-6 py-4">Bab / Tematik</th>
                                            <th className="px-6 py-4">Jumlah Perawi</th>
                                            <th className="px-6 py-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-slate-600 dark:text-slate-300">
                                        {hadiths.map((h) => (
                                            <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                                <td className="px-6 py-4.5 font-semibold text-slate-400">#{h.id}</td>
                                                <td className="px-6 py-4.5">
                                                    <div>
                                                        <span className="font-black text-slate-900 dark:text-white capitalize">{h.kitab}</span>
                                                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">{h.terjemahan}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4.5 font-bold">No. {h.nomor}</td>
                                                <td className="px-6 py-4.5 font-medium">{h.bab || '-'}</td>
                                                <td className="px-6 py-4.5">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/25 text-[11px] font-bold rounded-lg">
                                                        <i className="fa-solid fa-user-group text-[10px]"></i>
                                                        <span>{h.sanad?.length || 0} Perawi</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4.5 text-right space-x-2">
                                                    <button
                                                        onClick={() => openHadithModal(h)}
                                                        className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-450 border border-amber-500/25 rounded-xl text-xs font-bold transition-all"
                                                        title="Edit Hadis"
                                                    >
                                                        <i className="fa-solid fa-pen-to-square"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteHadith(h.id, h.kitab, h.nomor)}
                                                        className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-450 border border-rose-500/25 rounded-xl text-xs font-bold transition-all"
                                                        title="Hapus Hadis"
                                                    >
                                                        <i className="fa-solid fa-trash-can"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Hadith Pagination */}
                        {!hadithLoading && hadithTotalPages > 1 && (
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/20 text-xs font-bold text-slate-500">
                                <span>Halaman {hadithPage} dari {hadithTotalPages}</span>
                                <div className="flex gap-2">
                                    <button
                                        disabled={hadithPage === 1}
                                        onClick={() => setHadithPage(hadithPage - 1)}
                                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none text-slate-700 dark:text-white"
                                    >
                                        <i className="fa-solid fa-chevron-left mr-1"></i> Prev
                                    </button>
                                    <button
                                        disabled={hadithPage === hadithTotalPages}
                                        onClick={() => setHadithPage(hadithPage + 1)}
                                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none text-slate-700 dark:text-white"
                                    >
                                        Next <i className="fa-solid fa-chevron-right ml-1"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTAINER 2: USER MANAGEMENT */}
            {activeTab === 'users' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm">
                    {usersLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3">
                            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-slate-400 font-medium">Memuat data pengguna...</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                                        <th className="px-6 py-4">User ID</th>
                                        <th className="px-6 py-4">Username</th>
                                        <th className="px-6 py-4">Peran (Role)</th>
                                        <th className="px-6 py-4 text-right">Aksi Manajemen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-slate-600 dark:text-slate-300">
                                    {users.map((u) => {
                                        const isSelf = u.id === user?.id;
                                        return (
                                            <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                                <td className="px-6 py-4 font-semibold text-slate-400">#{u.id}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-900 dark:text-white">{u.username}</span>
                                                        {isSelf && (
                                                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/25 rounded-md text-[9px] font-bold">Akun Anda</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {u.is_admin ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/25 text-[10px] font-bold rounded-lg">
                                                            <i className="fa-solid fa-user-shield text-[9px]"></i>
                                                            <span>ADMINISTRATOR</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/25 text-[10px] font-bold rounded-lg">
                                                            <i className="fa-solid fa-user text-[9px]"></i>
                                                            <span>CLIENT USER</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    {/* Toggle Role Button */}
                                                    <button
                                                        onClick={() => handleToggleAdmin(u.id)}
                                                        disabled={isSelf}
                                                        className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all ${
                                                            isSelf 
                                                                ? 'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600 dark:border-transparent cursor-not-allowed'
                                                                : u.is_admin 
                                                                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-450 border-amber-500/25'
                                                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-450 border-emerald-500/25'
                                                        }`}
                                                        title={u.is_admin ? "Turunkan ke Client" : "Jadikan Admin"}
                                                    >
                                                        <i className="fa-solid fa-arrows-spin mr-1.5"></i>
                                                        {u.is_admin ? 'Jadikan Client' : 'Jadikan Admin'}
                                                    </button>

                                                    {/* Delete user button */}
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id, u.username)}
                                                        disabled={isSelf}
                                                        className={`px-3 py-2 border rounded-xl text-xs font-bold transition-all ${
                                                            isSelf 
                                                                ? 'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600 dark:border-transparent cursor-not-allowed'
                                                                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-450 border-rose-500/25'
                                                        }`}
                                                        title="Hapus Akun Pengguna"
                                                    >
                                                        <i className="fa-solid fa-user-xmark"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTAINER 3: THEMATICS */}
            {activeTab === 'thematic' && (
                <div className="animate-in fade-in duration-300">
                    <AdminThematicTab />
                </div>
            )}

            {/* DIALOG MODAL: CREATE / EDIT HADITH */}
            {isHadithModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 dark:bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                    {editingHadith ? `Edit Hadis #${editingHadith.id}` : 'Tambah Hadis Baru'}
                                </h3>
                                <p className="text-xs text-slate-400">Silakan isi matan, nomor, dan data transmisi perawi hadis.</p>
                            </div>
                            <button
                                onClick={() => setIsHadithModalOpen(false)}
                                className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-all"
                            >
                                <i className="fa-solid fa-xmark text-sm"></i>
                            </button>
                        </div>

                        {/* Modal Body Form */}
                        <form onSubmit={handleSaveHadithSubmit} className="p-6 space-y-6">
                            {/* Row 1: Kitab & Nomor */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 block">Nama Kitab *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Bukhari, Muslim"
                                        value={kitab}
                                        onChange={(e) => setKitab(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 block">Nomor Hadis *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. 1, 142a"
                                        value={nomor}
                                        onChange={(e) => setNomor(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 block">Bab / Tematik</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Niat, Keimanan"
                                        value={bab}
                                        onChange={(e) => setBab(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Teks Arab */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 block">Matan Arab</label>
                                <textarea
                                    rows={4}
                                    dir="rtl"
                                    placeholder="Tulis matan hadis dalam aksara Arab..."
                                    value={arab}
                                    onChange={(e) => setArab(e.target.value)}
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-lg font-serif leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white"
                                />
                            </div>

                            {/* Row 3: Terjemahan Indonesia & English */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 block">Terjemahan Indonesia</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Terjemahan hadis ke Bahasa Indonesia..."
                                        value={terjemahan}
                                        onChange={(e) => setTerjemahan(e.target.value)}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 block">English Translation</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Translation in English..."
                                        value={english}
                                        onChange={(e) => setEnglish(e.target.value)}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

                            {/* Row 4: SANAD & EDGES LIST EDITOR */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Sub Column 4a: Narrators (Sanad List) */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                                        <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                            <i className="fa-solid fa-list-ol text-emerald-500"></i>
                                            <span>Rantai Silsilah Perawi (Sanad)</span>
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={handleAddRawi}
                                            className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 rounded-lg text-xs font-bold transition-all"
                                        >
                                            + Perawi
                                        </button>
                                    </div>

                                    {sanad.length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-6 leading-relaxed bg-slate-50/50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                            Belum ada perawi ditambahkan.<br />Klik "+ Perawi" di atas untuk memulai rantai transmisi.
                                        </p>
                                    ) : (
                                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                                            {sanad.map((rawi, idx) => {
                                                const label = idx === 0 
                                                    ? 'Mukharrij (Imam)' 
                                                    : idx === sanad.length - 1 
                                                        ? 'Sahabat Nabi' 
                                                        : `Perawi #${idx + 1}`;
                                                
                                                return (
                                                    <div key={idx} className="flex items-center gap-2 animate-in fade-in duration-200">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-400 flex items-center justify-center shrink-0">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex-grow">
                                                            <input
                                                                type="text"
                                                                placeholder={`Nama: ${label}`}
                                                                value={rawi}
                                                                onChange={(e) => handleUpdateRawiName(idx, e.target.value)}
                                                                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-all dark:text-white"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveRawi(idx)}
                                                            className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0 transition-all"
                                                        >
                                                            <i className="fa-solid fa-xmark text-xs"></i>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Sub Column 4b: Connections (Sanad Edges) */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                                        <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                            <i className="fa-solid fa-diagram-project text-emerald-500"></i>
                                            <span>Hubungan Transmisi (SNA Edges)</span>
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={handleAddEdge}
                                            className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 rounded-lg text-xs font-bold transition-all"
                                        >
                                            + Hubungan
                                        </button>
                                    </div>

                                    {sanadEdges.length === 0 ? (
                                        <div className="p-5 text-center bg-slate-50/50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
                                            <p className="leading-relaxed">Jika dibiarkan kosong, hubungan sanad akan otomatis dibentuk secara sekuensial (lurus berurutan) saat divisualisasikan.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                                            {sanadEdges.map((edge, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/30 p-2 border border-slate-200/80 dark:border-slate-800/80 rounded-xl animate-in fade-in duration-200">
                                                    {/* Source Selector */}
                                                    <select
                                                        value={edge[0] || ''}
                                                        onChange={(e) => handleUpdateEdge(idx, 0, e.target.value)}
                                                        className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-bold focus:outline-none dark:text-white"
                                                    >
                                                        <option value="">-- Pilih Perawi --</option>
                                                        {sanad.filter(s => s !== '').map((s, sIdx) => (
                                                            <option key={sIdx} value={s}>{s}</option>
                                                        ))}
                                                    </select>

                                                    <span className="text-[10px] text-slate-400 font-black uppercase shrink-0"><i className="fa-solid fa-arrow-right"></i></span>

                                                    {/* Target Selector */}
                                                    <select
                                                        value={edge[1] || ''}
                                                        onChange={(e) => handleUpdateEdge(idx, 1, e.target.value)}
                                                        className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-bold focus:outline-none dark:text-white"
                                                    >
                                                        <option value="">-- Pilih Perawi --</option>
                                                        {sanad.filter(s => s !== '').map((s, sIdx) => (
                                                            <option key={sIdx} value={s}>{s}</option>
                                                        ))}
                                                    </select>

                                                    {/* Remove edge button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveEdge(idx)}
                                                        className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/15 flex items-center justify-center shrink-0 transition-all"
                                                    >
                                                        <i className="fa-solid fa-trash-can text-[10px]"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer Controls */}
                            <div className="sticky bottom-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3.5">
                                <button
                                    type="button"
                                    onClick={() => setIsHadithModalOpen(false)}
                                    className="px-5 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 text-slate-500 font-bold rounded-2xl text-sm transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-2xl text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
                                >
                                    <i className="fa-solid fa-floppy-disk text-base"></i>
                                    <span>Simpan Hadis</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
