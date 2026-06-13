import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api'

export default function AnalysisPage() {
    const { id } = useParams()
    const [hadith, setHadith] = useState(null)
    const [analysis, setAnalysis] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('muttabi')
    const [lang, setLang] = useState('id')

    useEffect(() => {
        setIsLoading(true)
        Promise.all([
            api.get(`/hadith/${id}`),
            api.get(`/hadith/analysis/cross-chain/${id}`)
        ])
            .then(([hadithRes, analysisRes]) => {
                setHadith(hadithRes.data.hadith)
                if (analysisRes.data.success) {
                    setAnalysis(analysisRes.data.data)
                }
            })
            .catch(err => {
                console.error(err)
            })
            .finally(() => {
                setIsLoading(false)
            })
    }, [id])

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
                <i className="fa-solid fa-circle-notch fa-spin text-emerald-500 text-5xl"></i>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">SANTRI ILHA sedang menganalisis sanad & matan...</span>
            </div>
        )
    }

    if (!hadith || !analysis) {
        return (
            <div className="text-center py-20 max-w-xl mx-auto space-y-4">
                <i className="fa-solid fa-triangle-exclamation text-4xl text-amber-500 opacity-80 animate-bounce"></i>
                <p className="text-slate-700 dark:text-slate-300 font-bold text-xl">Analisis Tidak Tersedia</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Gagal memuat data analisis untuk hadis ini. Silakan kembali ke pencarian.</p>
                <Link to="/" className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md mt-2">
                    Kembali ke Beranda
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Breadcrumb link */}
            <Link to={`/hadith/${id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-medium">
                <i className="fa-solid fa-arrow-left"></i> Kembali ke Detail Hadis
            </Link>

            {/* Hadith Header */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden border border-slate-100 dark:border-slate-800">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 text-white flex justify-between items-center">
                    <div>
                        <span className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-2 inline-block">
                            Laporan Takhrij & Analisis AI
                        </span>
                        <h2 className="text-2xl font-bold">{hadith.kitab}</h2>
                        <p className="text-slate-400 mt-1">Nomor {hadith.nomor} &bull; Bab: {hadith.bab}</p>
                    </div>
                </div>

                <div className="p-6 md:p-10 space-y-8">
                    {/* Arabic Matan */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Matan (Teks Arab Utama)</h3>
                        <p className="arabic-text text-4xl text-right leading-loose text-slate-900 dark:text-slate-100" dir="rtl">
                            {analysis.target_matan_ar || hadith.matan_arab}
                        </p>
                    </div>

                    <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

                    {/* Translation */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Terjemahan Matan</h3>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <button onClick={() => setLang('id')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${lang === 'id' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Indonesia</button>
                                <button onClick={() => setLang('en')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${lang === 'en' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>English</button>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                            {lang === 'id' ? (
                                <p className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed">{analysis.target_matan || hadith.terjemahan || hadith.terjemah}</p>
                            ) : (
                                <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed italic">{hadith.english || hadith.text_en || hadith.english_translation || 'English translation not available.'}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Context Analysis (Kritik Matan) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 md:p-10 border border-slate-100 dark:border-slate-800 space-y-6">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <i className="fa-solid fa-scale-balanced text-emerald-500"></i> Analisis Konteks Matan
                </h3>

                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Hasil Klasifikasi Konteks</span>
                            <div className="flex items-center gap-2.5">
                                {analysis.matan_context?.label === 'Universal' ? (
                                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-black uppercase tracking-wider">
                                        <i className="fa-solid fa-globe"></i> Universal
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-sm font-black uppercase tracking-wider">
                                        <i className="fa-solid fa-clock"></i> Temporal-Lokal
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-200/50 dark:bg-slate-850"></div>

                    <div className="space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-350">
                        <p className="font-bold text-slate-800 dark:text-slate-200">Indikator Latar Belakang:</p>
                        <p className="italic bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">{analysis.matan_context?.reason || 'Tidak terdeteksi indikasi latar belakang temporal spesifik.'}</p>
                    </div>

                    <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/10 text-xs text-slate-500 dark:text-slate-400 space-y-1 leading-relaxed">
                        <p className="font-bold text-slate-700 dark:text-slate-300">Catatan Metodologi:</p>
                        <p>Klasifikasi ini mengacu pada metodologi Kritik Matan (Syuhudi Ismail), menganalisis apakah teks hadis mengikat kondisi kultural, geografis, ekonomi jazirah Arab abad ke-7 secara spesifik (Temporal-Lokal) atau mengandung prinsip moral universal yang berlaku sepanjang zaman (Universal).</p>
                    </div>
                </div>
            </div>

            {/* NER Sanad Analysis Pathway */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 md:p-10 border border-slate-100 dark:border-slate-800 space-y-6">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <i className="fa-solid fa-users-viewfinder text-emerald-500"></i> Entitas Perawi (NLP AraBERT NER)
                </h3>

                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Berikut adalah jalur periwayatan yang diekstrak secara cerdas menggunakan Model NLP <em>Named Entity Recognition</em> khusus aksara Arab:
                </p>

                {/* Determine data source: prefer NER results, fallback to hadith.sanad */}
                {(() => {
                    const nerNodes = analysis.sanad_graph?.nodes || [];
                    const hasSanadFromDB = hadith?.sanad && hadith.sanad.length > 0;
                    const useNER = nerNodes.length > 0;

                    if (useNER) {
                        return (
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold uppercase tracking-wider">
                                    <i className="fa-solid fa-brain"></i> Hasil Ekstraksi NER AraBERT
                                </div>
                                <div className="relative pl-6 sm:pl-8 border-l border-slate-200 dark:border-slate-800 space-y-8 my-2">
                                    {nerNodes.map((node, idx) => (
                                        <div key={node.id} className="relative">
                                            <div className="absolute -left-[35px] sm:-left-[43px] top-1.5 w-6 h-6 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-white shadow-md">
                                                {idx + 1}
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md hover:border-emerald-300 transition-all">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-1">
                                                    {node.title || `Perawi Tingkat ${nerNodes.length - idx}`}
                                                </span>
                                                <h4 className="arabic-text text-xl sm:text-2xl text-slate-950 dark:text-slate-100 font-semibold" dir="rtl">
                                                    {node.label}
                                                </h4>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    }

                    if (hasSanadFromDB) {
                        return (
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold uppercase tracking-wider">
                                    <i className="fa-solid fa-database"></i> Data Sanad dari Database (Fallback)
                                </div>
                                <div className="bg-amber-50/50 dark:bg-amber-950/10 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/30 text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                                    <i className="fa-solid fa-circle-info mr-1"></i>
                                    Model NER tidak berhasil mengekstrak entitas perawi dari teks Arab sanad. Menampilkan data sanad dari database sebagai pengganti.
                                </div>
                                <div className="relative pl-6 sm:pl-8 border-l border-slate-200 dark:border-slate-800 space-y-8 my-2">
                                    {hadith.sanad.map((rawi, idx) => {
                                        const rawiName = rawi?.name || rawi;
                                        return (
                                            <div key={idx} className="relative">
                                                <div className="absolute -left-[35px] sm:-left-[43px] top-1.5 w-6 h-6 rounded-full bg-amber-500 border-4 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-white shadow-md">
                                                    {idx + 1}
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md hover:border-amber-300 transition-all">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 block mb-1">
                                                        Perawi Tingkat {idx + 1}
                                                    </span>
                                                    <h4 className="text-lg sm:text-xl text-slate-950 dark:text-slate-100 font-semibold">
                                                        {rawiName}
                                                    </h4>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
                            <i className="fa-solid fa-id-card-clip text-3xl mb-2 opacity-30"></i>
                            <p className="text-sm">Tidak ada entitas perawi Arab yang terdeteksi dalam sanad ini.</p>
                        </div>
                    );
                })()}
            </div>

            {/* Supporting Hadiths (Muttabi & Syawahid) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 md:p-10 border border-slate-100 dark:border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <i className="fa-solid fa-network-wired text-emerald-500"></i> Jalur Pendukung (Takhrij)
                    </h3>

                    {/* Tab controllers */}
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-700">
                        <button onClick={() => setActiveTab('muttabi')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${activeTab === 'muttabi' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                            Muttabi' <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold">{analysis.muttabi?.length || 0}</span>
                        </button>
                        <button onClick={() => setActiveTab('syawahid')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${activeTab === 'syawahid' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                            Syawahid <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold">{analysis.syawahid?.length || 0}</span>
                        </button>
                    </div>
                </div>

                {/* Definitions helper */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {activeTab === 'muttabi' ? (
                        <p>
                            <span className="font-bold text-slate-700 dark:text-slate-300">Muttabi' (Mutabi'):</span> Hadis pendukung yang diriwayatkan dari <strong>Sahabat yang sama</strong> ({analysis.target_sahabat_id}), namun melalui jalur murid/perawi sanad yang berbeda. Berfungsi membuktikan perawi tidak menyendiri dalam meriwayatkan.
                        </p>
                    ) : (
                        <p>
                            <span className="font-bold text-slate-700 dark:text-slate-300">Syawahid (Syahid):</span> Hadis pendukung dengan makna yang selaras namun diriwayatkan oleh <strong>Sahabat yang berbeda</strong> (selain {analysis.target_sahabat_id}). Berfungsi memperkuat keotentikan matan secara isi kandungan.
                        </p>
                    )}
                </div>

                {/* Hadiths Lists */}
                <div className="space-y-4">
                    {activeTab === 'muttabi' ? (
                        analysis.muttabi && analysis.muttabi.length > 0 ? (
                            analysis.muttabi.map((item) => (
                                <SupportingHadithCard key={item.hadith_id} item={item} />
                            ))
                        ) : (
                            <EmptyState label="muttabi'" />
                        )
                    ) : (
                        analysis.syawahid && analysis.syawahid.length > 0 ? (
                            analysis.syawahid.map((item) => (
                                <SupportingHadithCard key={item.hadith_id} item={item} />
                            ))
                        ) : (
                            <EmptyState label="syawahid" />
                        )
                    )}
                </div>
            </div>
        </div>
    )
}

function SupportingHadithCard({ item }) {
    // Determine similarity badge color
    const scorePct = Math.round(item.similarity_score * 100);
    const getBadgeStyle = (score) => {
        if (score >= 80) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
        if (score >= 60) return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
        return "bg-slate-500/10 text-slate-650 dark:text-slate-400 border-slate-500/20";
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md hover:border-emerald-250 transition-all space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 dark:text-white text-base">
                        {item.source} (Hadis No. {item.chapter_no})
                    </span>
                    <p className="text-xs text-slate-400">
                        Jalur Sahabat: <span className="font-semibold text-slate-600 dark:text-slate-350">{item.sahabat_id || 'Tidak diketahui'}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-lg text-xs font-black uppercase tracking-wider ${getBadgeStyle(scorePct)}`}>
                        {scorePct}% Cocok
                    </span>
                    <Link
                        to={`/hadith/${item.hadith_id}`}
                        target="_blank"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-850 hover:bg-emerald-500 dark:hover:bg-emerald-600 text-slate-400 hover:text-white transition-all border border-slate-150 dark:border-slate-800"
                        title="Buka Detail Hadits di Tab Baru"
                    >
                        <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                    </Link>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                <p className="arabic-text text-lg text-right leading-loose mb-2 text-slate-700 dark:text-slate-300" dir="rtl">
                    {item.text_snippet}
                </p>
            </div>
        </div>
    )
}

function EmptyState({ label }) {
    return (
        <div className="p-10 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
            <i className="fa-solid fa-circle-exclamation text-3xl opacity-35"></i>
            <p className="text-sm font-semibold">Tidak ditemukan hadis pendukung ({label})</p>
            <p className="text-xs text-slate-400">Tidak ada hadis di database dengan tingkat kemiripan di atas batas aman.</p>
        </div>
    )
}
