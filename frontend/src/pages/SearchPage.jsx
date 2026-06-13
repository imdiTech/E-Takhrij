import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import api from '../api'

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const query = searchParams.get('q') || ''
    const kitab = searchParams.get('kitab') || 'all'
    const searchType = searchParams.get('search_type') || 'phrase'
    const limit = searchParams.get('limit') || '10'
    const bab = searchParams.get('bab') || ''
    const page = parseInt(searchParams.get('page') || '1')

    const [showHarakat, setShowHarakat] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [isSearching, setIsSearching] = useState(query !== '' || (kitab !== 'all' && bab !== ''))

    const [hadiths, setHadiths] = useState(null)
    const [metadata, setMetadata] = useState({ total_results: 0, total_pages: 1 })

    useEffect(() => {
        const fetchHadiths = async () => {
            if (!query && kitab === 'all' && !bab) {
                setHadiths(null)
                setIsSearching(false)
                return
            }
            setIsLoading(true)
            setIsSearching(true)
            try {
                const res = await api.get('/hadith/search', {
                    params: { q: query, kitab, bab, search_type: searchType, limit, page }
                })
                setHadiths(res.data.hadiths)
                setMetadata({
                    total_results: res.data.total_results,
                    total_pages: res.data.total_pages
                })
            } catch (err) {
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchHadiths()
    }, [query, kitab, bab, searchType, limit, page])

    const handleSearch = (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const params = new URLSearchParams()

        const q = formData.get('q')
        if (q) params.set('q', q)

        const k = formData.get('kitab')
        if (k && k !== 'all') params.set('kitab', k)

        const st = formData.get('search_type')
        if (st && st !== 'phrase') params.set('search_type', st)

        const l = formData.get('limit')
        if (l && l !== '10') params.set('limit', l)

        if (bab) params.set('bab', bab)

        setSearchParams(params)
    }

    const removeHarakat = (text) => {
        return text ? text.replace(/[\u064B-\u065F\u0670]/g, '') : ''
    }

    return (
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
            <Sidebar />

            <div className="col-span-12 lg:col-span-9 space-y-8">
                <div className="text-center lg:text-left space-y-4 py-4">
                    <h1 className="text-4xl md:text-5xl font-bold dark:text-white text-slate-900 tracking-tight">Eksplorasi Hadis berbasis <span
                        className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Digital</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-100 max-w-2xl">Temukan hadis, pelajari sanad, dan pahami maknanya dengan
                        bantuan kecerdasan buatan.</p>
                </div>

                <div className="max-w-4xl bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative group flex-grow">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                    <i className="fa-solid fa-magnifying-glass"></i>
                                </div>
                                <input type="text" name="q" defaultValue={query}
                                    placeholder="Cari terjemahan atau potongan hadis..."
                                    className="w-full pl-12 pr-4 py-3 md:py-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-slate-50 dark:bg-slate-950 text-lg dark:text-slate-100 transition-all outline-none" />
                            </div>
                            <button type="submit"
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 md:py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 whitespace-nowrap">
                                <i className="fa-solid fa-search mr-2"></i>Cari
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Filter Kitab</label>
                                <select name="kitab" defaultValue={kitab} className="w-full h-10 p-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 focus:ring-0 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 outline-none transition-all font-medium">
                                    <option value="all">Semua Kitab</option>
                                    {['Sahih al Bukhari', 'Sahih Muslim', 'Sunan Abu Dawud', 'Jami At Tirmidhi', 'Sunan an Nasai', 'Sunan Ibn Majah', 'Muwatta Malik'].map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Model Pencarian</label>
                                <select name="search_type" defaultValue={searchType} className="w-full h-10 p-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 focus:ring-0 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 outline-none transition-all font-medium">
                                    <option value="phrase">Kata Berurutan</option>
                                    <option value="single">Kata Tunggal</option>
                                    <option value="random">Penggalan Kata Acak</option>
                                </select>
                            </div>
                            <div className="flex-1 min-w-[150px] max-w-[200px]">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Limit Tampilan</label>
                                <select name="limit" defaultValue={limit} className="w-full h-10 p-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 focus:ring-0 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 outline-none transition-all font-medium">
                                    <option value="10">10 Hadis</option>
                                    <option value="25">25 Hadis</option>
                                    <option value="50">50 Hadis</option>
                                    <option value="100">100 Hadis</option>
                                </select>
                            </div>
                            {bab && (
                                <div className="flex items-end">
                                    <span className="inline-flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold border border-emerald-100 text-sm h-[52px]">
                                        <i className="fa-solid fa-filter text-emerald-400"></i> Bab: {bab}
                                    </span>
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                <div className="pt-4">
                    {!isSearching ? (
                        <div className="text-center py-24 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 mb-6 text-4xl shadow-inner">
                                <i className="fa-solid fa-book-open-reader"></i>
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Mulai Pencarian Hadis</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-lg mx-auto">
                                Silakan gunakan form pencarian di atas untuk mencari hadis berdasarkan terjemahan, atau pilih salah satu kitab di panel samping untuk memulai.
                            </p>
                        </div>
                    ) : (
                        <>
                            {hadiths && (
                                <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-6 py-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-3">
                                    <i className="fa-solid fa-circle-info text-emerald-500 text-xl"></i>
                                    <div>
                                        <span className="font-bold">{metadata.total_results}</span> hadis ditemukan
                                        {kitab !== 'all' && <> dalam kitab <span className="font-bold">"{kitab}"</span></>}
                                        {bab && <> bab <span className="font-bold">"{bab}"</span></>}
                                        {query && <> dengan kata kunci <span className="font-bold">"{query}"</span></>}
                                        (Halaman {page} dari {metadata.total_pages}).
                                    </div>
                                    <Link to="/" onClick={() => setIsSearching(false)} className="ml-auto text-sm bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-600 hover:text-white transition-colors">
                                        Reset Pencarian
                                    </Link>
                                </div>
                            )}

                            {hadiths && hadiths.length > 0 ? (
                                <>
                                    <div className="flex justify-end mb-4">
                                        <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                                            <button onClick={() => setShowHarakat(true)} className={`px-4 py-1.5 text-sm rounded-lg transition-all ${showHarakat ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'}`}>Harakat</button>
                                            <button onClick={() => setShowHarakat(false)} className={`px-4 py-1.5 text-sm rounded-lg transition-all ${!showHarakat ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'}`}>Tanpa Harakat</button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        {hadiths.map((hadith) => (
                                            <div key={hadith.id} className="glass-panel rounded-2xl p-6 transition-transform hover:-translate-y-1 duration-300">
                                                <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 text-sm font-semibold">
                                                        <i className="fa-solid fa-book"></i> {hadith.kitab} No. {hadith.nomor}
                                                    </span>
                                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Bab: {hadith.bab}</span>
                                                </div>

                                                <p className="arabic-text text-3xl text-right leading-loose text-slate-900 dark:text-slate-100 mb-6 mt-4" dir="rtl">
                                                    {showHarakat ? hadith.matan_arab : removeHarakat(hadith.matan_arab)}
                                                </p>

                                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                        <i className="fa-solid fa-users"></i> {hadith.sanad ? hadith.sanad.length : 0} Perawi
                                                    </div>
                                                    <Link to={`/hadith/${hadith.id}`} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-350 font-semibold flex items-center gap-1 group">
                                                        Lihat Detail Sanad <i className="fa-solid fa-arrow-right transform group-hover:translate-x-1 transition-transform"></i>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination Controls */}
                                    {metadata.total_pages > 1 && (
                                        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                                Menampilkan <span className="text-slate-800 dark:text-slate-200 font-semibold">{(page - 1) * parseInt(limit) + 1}</span> - <span className="text-slate-800 dark:text-slate-200 font-semibold">{Math.min(page * parseInt(limit), metadata.total_results)}</span> dari <span className="text-slate-800 dark:text-slate-200 font-semibold">{metadata.total_results}</span> hadis
                                            </div>
                                            <nav className="flex items-center gap-1.5">
                                                {page > 1 ? (
                                                    <Link to={`/?q=${query}&kitab=${kitab}&bab=${bab}&search_type=${searchType}&limit=${limit}&page=${page - 1}`} className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all font-semibold">
                                                        <i className="fa-solid fa-chevron-left text-xs"></i>
                                                    </Link>
                                                ) : (
                                                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-100 dark:border-slate-850 text-slate-300 dark:text-slate-600 cursor-not-allowed font-semibold">
                                                        <i className="fa-solid fa-chevron-left text-xs"></i>
                                                    </span>
                                                )}

                                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-md shadow-emerald-500/20">
                                                    {page}
                                                </span>

                                                {page < metadata.total_pages ? (
                                                    <Link to={`/?q=${query}&kitab=${kitab}&bab=${bab}&search_type=${searchType}&limit=${limit}&page=${page + 1}`} className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all font-semibold">
                                                        <i className="fa-solid fa-chevron-right text-xs"></i>
                                                    </Link>
                                                ) : (
                                                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-100 dark:border-slate-850 text-slate-300 dark:text-slate-600 cursor-not-allowed font-semibold">
                                                        <i className="fa-solid fa-chevron-right text-xs"></i>
                                                    </span>
                                                )}
                                            </nav>
                                        </div>
                                    )}
                                </>
                            ) : (
                                hadiths !== null && !isLoading && (
                                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-6 text-3xl">
                                            <i className="fa-solid fa-box-open"></i>
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Tidak ada hadis ditemukan</h3>
                                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Coba gunakan kata kunci lain atau ubah filter pencarian.</p>
                                    </div>
                                )
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Loading Modal */}
            {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center">
                        <i className="fa-solid fa-circle-notch fa-spin text-emerald-500 text-5xl mb-4"></i>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4">Sedang Mencari...</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Mohon tunggu sebentar, SANTRI ILHA sedang mencari hadis yang relevan untuk Anda.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
