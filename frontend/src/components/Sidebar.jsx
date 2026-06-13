import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api'

const kitabs = [
    { name: 'Sahih al Bukhari', initial: 'B', textClass: 'text-emerald-600', hoverTextClass: 'hover:text-emerald-600', bgClass: 'bg-emerald-100', activeBgClass: 'bg-emerald-600', hoverBgClass: 'group-hover:bg-emerald-600' },
    { name: 'Sahih Muslim', initial: 'M', textClass: 'text-blue-600', hoverTextClass: 'hover:text-blue-600', bgClass: 'bg-blue-100', activeBgClass: 'bg-blue-600', hoverBgClass: 'group-hover:bg-blue-600' },
    { name: 'Sunan Abu Dawud', initial: 'AD', textClass: 'text-purple-600', hoverTextClass: 'hover:text-purple-600', bgClass: 'bg-purple-100', activeBgClass: 'bg-purple-600', hoverBgClass: 'group-hover:bg-purple-600' },
    { name: 'Jami At Tirmidhi', initial: 'T', textClass: 'text-orange-600', hoverTextClass: 'hover:text-orange-600', bgClass: 'bg-orange-100', activeBgClass: 'bg-orange-600', hoverBgClass: 'group-hover:bg-orange-600' },
    { name: 'Sunan an Nasai', initial: 'N', textClass: 'text-rose-600', hoverTextClass: 'hover:text-rose-600', bgClass: 'bg-rose-100', activeBgClass: 'bg-rose-600', hoverBgClass: 'group-hover:bg-rose-600' },
    { name: 'Sunan Ibn Majah', initial: 'IM', textClass: 'text-amber-600', hoverTextClass: 'hover:text-amber-600', bgClass: 'bg-amber-100', activeBgClass: 'bg-amber-600', hoverBgClass: 'group-hover:bg-amber-600' },
    { name: 'Muwatta Malik', initial: 'MM', textClass: 'text-cyan-600', hoverTextClass: 'hover:text-cyan-600', bgClass: 'bg-cyan-100', activeBgClass: 'bg-cyan-600', hoverBgClass: 'group-hover:bg-cyan-600' }
]

export default function Sidebar() {
    const [searchParams] = useSearchParams()
    const currentKitab = searchParams.get('kitab') || 'all'
    const currentBab = searchParams.get('bab') || ''
    const [chapters, setChapters] = useState([])

    useEffect(() => {
        if (currentKitab !== 'all') {
            api.get(`/hadith/chapters/${currentKitab}`)
                .then(res => setChapters(res.data.chapters || []))
                .catch(err => console.error(err))
        } else {
            setChapters([])
        }
    }, [currentKitab])

    return (
        <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-24">
            <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Kategori Kitab</h3>
                <ul className="space-y-3">
                    {kitabs.map((k) => (
                        <li key={k.name}>
                            <Link to={`/?kitab=${k.name}`}
                                className={`flex items-center gap-3 font-medium transition-colors group 
                                    ${currentKitab === k.name ? `${k.textClass} font-bold` : `text-slate-400 ${k.hoverTextClass}`}`}>
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all 
                                    ${currentKitab === k.name ? `${k.activeBgClass} text-white` : `${k.bgClass} ${k.textClass} ${k.hoverBgClass} group-hover:text-white`}`}>
                                    {k.initial}
                                </span>
                                {k.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {currentKitab !== 'all' && chapters.length > 0 && (
                <div className="glass-panel rounded-2xl p-6 max-h-[400px] overflow-y-auto">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Daftar Bab <br />({currentKitab})</h3>
                    <ul className="space-y-2">
                        {chapters.map(c_name => (
                            <li key={c_name}>
                                <Link to={`/?kitab=${currentKitab}&bab=${c_name}`}
                                    className={`block text-sm py-2 px-3 rounded-xl transition-all ${currentBab === c_name ? 'bg-emerald-500 text-white font-bold shadow-md' : 'text-slate-400 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-700'}`}>
                                    {c_name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="glass-panel rounded-2xl p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Statistik App</h3>
                <div className="grid grid-cols-1 gap-4">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">2,500+</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Hadis</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">150+</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Perawi Terdata</p>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 text-2xl">
                    <i className="fa-solid fa-robot"></i>
                </div>
                <h3 className="text-lg font-bold mb-2">Bingung Memahami Hadis?</h3>
                <p className="text-emerald-50 text-sm mb-4 leading-relaxed">Gunakan Santri ILHA, asisten AI kami untuk membantu Anda belajar hadis Nabi.</p>
                <Link to="/chat" className="block text-center py-2 bg-white text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-colors">
                    Mulai Tanya Santri ILHA
                </Link>
            </div>
        </aside>
    )
}
