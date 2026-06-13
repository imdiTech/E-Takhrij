import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import SanadGraphD3 from '../components/SanadGraphD3'

export default function DetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [hadith, setHadith] = useState(null)
    const [sanadGraph, setSanadGraph] = useState(null)
    const [syawahid, setSyawahid] = useState([])
    const [muttabi, setMuttabi] = useState([])

    const [lang, setLang] = useState('id')
    const [sanadMode, setSanadMode] = useState('visual')
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const [selectedRawi, setSelectedRawi] = useState(null)
    const [isRawiModalOpen, setIsRawiModalOpen] = useState(false)
    const [isRawiLoading, setIsRawiLoading] = useState(false)

    const handleRawiClick = async (rawiName) => {
        setIsRawiLoading(true)
        setIsRawiModalOpen(true)
        setSelectedRawi(null)
        try {
            const response = await api.get('/hadith/rawi/info', {
                params: { name: rawiName }
            })
            if (response.data.success) {
                setSelectedRawi(response.data.rawi)
            } else {
                alert('Profil perawi tidak ditemukan.')
                setIsRawiModalOpen(false)
            }
        } catch (error) {
            console.error(error)
            alert('Gagal mengambil data perawi.')
            setIsRawiModalOpen(false)
        } finally {
            setIsRawiLoading(false)
        }
    }


    useEffect(() => {
        setIsLoading(true)
        api.get(`/hadith/${id}`)
            .then(res => {
                setHadith(res.data.hadith)
                setSanadGraph(res.data.sanad_graph)
                setSyawahid(res.data.syawahid || [])
                setMuttabi(res.data.muttabi || [])
            })
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false))
    }, [id])

    const handleAnalyzeClick = (e) => {
        e.preventDefault()
        navigate(`/hadith/${id}/analysis`)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <i className="fa-solid fa-circle-notch fa-spin text-emerald-500 text-4xl"></i>
            </div>
        )
    }

    if (!hadith) {
        return <div className="text-center py-20 text-slate-500">Hadis tidak ditemukan.</div>
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-medium">
                <i className="fa-solid fa-arrow-left"></i> Kembali ke Pencarian
            </Link>

            {/* Hadith Detail Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden border border-slate-100 dark:border-slate-800">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">{hadith.kitab}</h2>
                        <p className="text-slate-400 mt-1">Nomor {hadith.nomor} &bull; Bab: {hadith.bab}</p>
                    </div>
                </div>

                <div className="p-6 md:p-10 space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Matan (Teks Arab)</h3>
                        <p className="arabic-text text-4xl text-right leading-loose text-slate-900 dark:text-slate-100" dir="rtl">
                            {hadith.matan_arab}
                        </p>
                    </div>

                    <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Terjemahan</h3>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <button onClick={() => setLang('id')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${lang === 'id' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Indonesia</button>
                                <button onClick={() => setLang('en')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${lang === 'en' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>English</button>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                            {lang === 'id' ? (
                                <p className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed">{hadith.terjemahan || hadith.terjemah}</p>
                            ) : (
                                <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed italic">{hadith.english || hadith.text_en || hadith.english_translation || 'English translation not available.'}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sanad Analysis Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 md:p-10 border border-slate-100 dark:border-slate-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <i className="fa-solid fa-diagram-project text-emerald-500"></i> Analisis Sanad
                    </h3>
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-700 self-start md:self-center">
                        <button onClick={() => setSanadMode('visual')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${sanadMode === 'visual' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                            <i className="fa-solid fa-image mr-1"></i> Visual
                        </button>
                        <button onClick={() => setSanadMode('list')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${sanadMode === 'list' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                            <i className="fa-solid fa-list mr-1"></i> List
                        </button>
                    </div>
                </div>

                {sanadMode === 'visual' ? (
                    <SanadGraphD3 hadith={hadith} />
                ) : (
                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300">Urutan Jalur Perawi:</h4>
                        <div className="grid grid-cols-1 gap-3">
                            {hadith.sanad && hadith.sanad.map((rawi, idx) => (
                                <div key={idx} className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div
                                        onClick={() => handleRawiClick(rawi.name || rawi)}
                                        className="flex-grow px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-emerald-300 hover:shadow-md transition-all group cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{rawi.name || rawi}</span>
                                            <i className="fa-solid fa-chevron-right text-slate-300 dark:text-slate-600 group-hover:text-emerald-400 text-sm"></i>
                                        </div>
                                    </div>

                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Smart Analyze Banner */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 p-6 md:p-8 border border-slate-200 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none"></div>

                <div className="relative z-10 flex-1 text-center md:text-left">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                        <i className="fa-solid fa-network-wired text-emerald-500"></i> Analisis Mendalam
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto md:mx-0">
                        Gunakan Smart Analyze (Kecerdasan Buatan) untuk menemukan muttabi', syawahid, serta membedah jalur periwayatan hadis ini secara otomatis dan akurat.
                    </p>
                </div>

                <div className="relative z-10 shrink-0 w-full md:w-auto flex justify-center">
                    <button onClick={handleAnalyzeClick} className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-all duration-300 px-4 py-2 rounded-2xl border border-white/5 group shadow-lg w-full md:w-auto justify-center">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold leading-none">Smart Analyze</p>
                            <p className="text-sm font-bold text-white">Analisis Sanad Matan</p>
                        </div>
                        <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center text-lg shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                            <i className="fa-solid fa-microscope"></i>
                        </div>
                    </button>
                </div>
            </div>

            {/* Loading Modal */}
            {isAnalyzing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center">
                        <i className="fa-solid fa-circle-notch fa-spin text-emerald-500 text-5xl mb-4"></i>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4">Memproses Analisis...</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Mohon tunggu sebentar, SANTRI ILHA sedang melakukan cross-chain analysis untuk sanad dan matan hadis ini.</p>
                    </div>
                </div>
            )}

            {/* Narrator Profile Modal */}
            {isRawiModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 dark:bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 relative">

                        {/* Close button top right */}
                        <button
                            onClick={() => setIsRawiModalOpen(false)}
                            className="absolute right-4 top-4 w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-all z-10"
                        >
                            <i className="fa-solid fa-xmark text-sm"></i>
                        </button>

                        {isRawiLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3">
                                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs text-slate-400 font-medium">Memuat profil perawi...</span>
                            </div>
                        ) : selectedRawi ? (
                            <div className="p-6 md:p-8 space-y-6 text-left">
                                {/* Header with Grade Badge */}
                                <div className="space-y-2.5">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 rounded-lg text-xs font-bold uppercase tracking-wider">
                                        {selectedRawi.grade || 'Perawi'}
                                    </span>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                                        {selectedRawi.name}
                                    </h3>
                                    {selectedRawi.area_of_interest && selectedRawi.area_of_interest !== 'NA' && (
                                        <p className="text-xs text-slate-450 dark:text-slate-500">
                                            Bidang Minat: <span className="font-semibold text-slate-600 dark:text-slate-400">{selectedRawi.area_of_interest}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

                                {/* Life info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-4.5 border border-slate-100 dark:border-slate-800">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 flex items-center gap-1.5">
                                            <i className="fa-solid fa-cake-candles text-emerald-500"></i> Lahir
                                        </h4>
                                        <div className="text-sm space-y-1 text-slate-650 dark:text-slate-350">
                                            <p><span className="font-bold text-slate-450 dark:text-slate-500">Waktu/Tempat:</span> {selectedRawi.birth_date_place || 'Tidak diketahui'}</p>
                                            <p><span className="font-bold text-slate-450 dark:text-slate-500">Tempat Lahir:</span> {selectedRawi.birth_place || 'Tidak diketahui'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-4.5 border border-slate-100 dark:border-slate-800">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 flex items-center gap-1.5">
                                            <i className="fa-solid fa-skull-crossbones text-emerald-500"></i> Wafat
                                        </h4>
                                        <div className="text-sm space-y-1 text-slate-650 dark:text-slate-350">
                                            <p><span className="font-bold text-slate-450 dark:text-slate-500">Waktu/Tempat:</span> {selectedRawi.death_date_place || 'Tidak diketahui'}</p>
                                            <p><span className="font-bold text-slate-450 dark:text-slate-500">Penyebab:</span> {selectedRawi.death_reason || 'Alami'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* General Details List */}
                                <div className="space-y-4.5 text-sm">
                                    {selectedRawi.places_of_stay && selectedRawi.places_of_stay !== 'NA' && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Tempat Tinggal</span>
                                            <span className="text-slate-700 dark:text-slate-300 font-medium">{selectedRawi.places_of_stay}</span>
                                        </div>
                                    )}

                                    {selectedRawi.teachers && selectedRawi.teachers !== 'NA' && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Guru Utama (Teachers)</span>
                                            <span className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                                {typeof selectedRawi.teachers === 'string' ? selectedRawi.teachers : JSON.stringify(selectedRawi.teachers)}
                                            </span>
                                        </div>
                                    )}

                                    {selectedRawi.students && selectedRawi.students !== 'NA' && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Murid Populer (Students)</span>
                                            <span className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                                {typeof selectedRawi.students === 'string' ? selectedRawi.students : JSON.stringify(selectedRawi.students)}
                                            </span>
                                        </div>
                                    )}

                                    {selectedRawi.parents && selectedRawi.parents !== 'NA' && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Orang Tua</span>
                                            <span className="text-slate-700 dark:text-slate-300">{selectedRawi.parents}</span>
                                        </div>
                                    )}

                                    {selectedRawi.spouse && selectedRawi.spouse !== 'NA' && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Pasangan</span>
                                            <span className="text-slate-700 dark:text-slate-300">{selectedRawi.spouse}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Tags section */}
                                {selectedRawi.tags && selectedRawi.tags !== 'NA' && (
                                    <div className="space-y-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 block">Kategori / Tag</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(typeof selectedRawi.tags === 'string' ? selectedRawi.tags.split(',') : []).map((tag, tIdx) => (
                                                <span key={tIdx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-xl text-xs font-semibold">
                                                    {tag.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-20 text-center text-slate-400 space-y-4">
                                <i className="fa-solid fa-circle-exclamation text-4xl opacity-20"></i>
                                <p className="text-sm font-medium">Gagal memuat profil perawi.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
