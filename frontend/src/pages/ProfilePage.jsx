import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState('app-profile');

    const sections = [
        { id: 'app-profile', label: 'Profil Aplikasi', icon: 'fa-cubes' },
        { id: 'visi-misi', label: 'Visi & Misi', icon: 'fa-eye' },
        { id: 'sejarah', label: 'Sejarah Singkat', icon: 'fa-history' },
        { id: 'pengembang', label: 'Profil Pengembang', icon: 'fa-users' }
    ];

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 150;
            for (const section of sections) {
                const el = document.getElementById(section.id);
                if (el) {
                    const top = el.offsetTop;
                    const height = el.offsetHeight;
                    if (scrollPosition >= top && scrollPosition < top + height) {
                        setActiveSection(section.id);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (el) {
            window.scrollTo({
                top: el.offsetTop - 100,
                behavior: 'smooth'
            });
            setActiveSection(id);
        }
    };

    return (
        <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-12 lg:gap-10 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Sticky Left Navigation (Desktop Only) */}
            <aside className="hidden lg:block lg:col-span-3 sticky top-24 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Navigasi Halaman</p>
                    <ul className="space-y-2">
                        {sections.map((sec) => (
                            <li key={sec.id}>
                                <button
                                    onClick={() => scrollToSection(sec.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-left transition-all duration-300 ${activeSection === sec.id
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20 translate-x-1'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                                        }`}
                                >
                                    <i className={`fa-solid ${sec.icon} text-base`}></i>
                                    {sec.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
                    <h4 className="text-base font-bold mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-code-branch text-emerald-500"></i> E-Takhrij
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        Platform riset hadis modern terintegrasi dengan kecerdasan buatan (AI), NLP dan visualisasi transmisi perawi (SNA).
                    </p>
                    <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-emerald-400 border border-white/5">
                        Versi Beta 1.0.0
                    </span>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="col-span-12 lg:col-span-9 space-y-12">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                    <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
                    <div className="relative z-10 max-w-2xl space-y-4">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/20 text-white rounded-full text-xs font-bold border border-white/10 backdrop-blur-md uppercase tracking-wider">
                            Tentang Kami
                        </span>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                            Digitalisasi Sanad, <br />Mempererat Keabsahan Hadis.
                        </h1>
                        <p className="text-emerald-100 text-sm md:text-base leading-relaxed">
                            Mengenal lebih dekat platform E-Takhrij, visi misi perjuangan digital kami, sejarah pembentukan, dan tim yang berdedikasi tinggi di belakang layar.
                        </p>
                    </div>
                </div>

                {!user && (
                    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 dark:border-amber-500/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
                                <i className="fa-solid fa-circle-exclamation"></i>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base">Mode Tamu (Belum Masuk)</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    Anda saat ini hanya dapat melihat profil/informasi aplikasi. Silakan masuk untuk mengakses fitur utama seperti Pencarian Pintar, SNA Graph Transmisi Perawi, dan Tanya Asisten AI (ILHA).
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/login"
                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-2xl text-sm shadow-md shadow-emerald-500/20 transition-all duration-300 whitespace-nowrap hover:scale-105 inline-flex items-center gap-2"
                        >
                            <i className="fa-solid fa-right-to-bracket text-xs"></i>Masuk Sekarang
                        </Link>
                    </div>
                )}

                {/* Sticky Top Tab Bar for Mobile (Hidden on Desktop) */}
                <div className="lg:hidden sticky top-[65px] z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-y border-slate-200 dark:border-slate-800 py-3 px-4 -mx-4 overflow-x-auto flex gap-2 no-scrollbar shadow-sm">
                    {sections.map((sec) => (
                        <button
                            key={sec.id}
                            onClick={() => scrollToSection(sec.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${activeSection === sec.id
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/10'
                                : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-850'
                                }`}
                        >
                            <i className={`fa-solid ${sec.icon}`}></i>
                            {sec.label}
                        </button>
                    ))}
                </div>

                {/* Section 1: Profil Aplikasi */}
                <section id="app-profile" className="scroll-mt-24 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg shadow-sm">
                            <i className="fa-solid fa-cubes"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Profil Aplikasi</h2>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            <span className="font-bold text-emerald-600">E-Takhrij</span> adalah sebuah platform digital inovatif berbasis kecerdasan buatan (Artificial Intelligence) dan Social Network Analysis (SNA) yang dikembangkan khusus untuk mempermudah kalangan akademisi, santri, dan peneliti hadis dalam melakukan verifikasi (<em>Takhrij</em>) serta visualisasi silsilah periwayatan (<em>Sanad</em>) secara komprehensif.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 space-y-2 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all group">
                                <i className="fa-solid fa-magnifying-glass text-2xl text-emerald-500 mb-2 group-hover:scale-110 transition-transform"></i>
                                <h4 className="font-bold text-slate-800 dark:text-slate-200">Pencarian Pintar & Harakat berbasis NLP</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Mesin pencari hadis yang fleksibel dengan opsi menampilkan harakat teks Arab serta transliterasi yang rapi.
                                </p>
                            </div>
                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 space-y-2 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 transition-all group">
                                <i className="fa-solid fa-diagram-project text-2xl text-blue-500 mb-2 group-hover:scale-110 transition-transform"></i>
                                <h4 className="font-bold text-slate-800 dark:text-slate-200">Visualisasi Sanad (SNA Graph)</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Memetakan hubungan silsilah periwayatan hadis secara interaktif dari guru ke murid untuk melacak sanad hadis dengan sangat mudah.
                                </p>
                            </div>
                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 space-y-2 hover:shadow-md hover:border-amber-200 dark:hover:border-amber-900/50 transition-all group">
                                <i className="fa-solid fa-robot text-2xl text-amber-500 mb-2 group-hover:scale-110 transition-transform"></i>
                                <h4 className="font-bold text-slate-800 dark:text-slate-200">Analisis Asisten AI (SANTRI ILHA)</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Menyediakan asisten chatbot khusus pemahaman hadis serta modul analisis rantai silang hadis otomatis secara real-time.
                                </p>
                            </div>
                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 space-y-2 hover:shadow-md hover:border-purple-200 dark:hover:border-purple-900/50 transition-all group">
                                <i className="fa-solid fa-check-double text-2xl text-purple-500 mb-2 group-hover:scale-110 transition-transform"></i>
                                <h4 className="font-bold text-slate-800 dark:text-slate-200">Verifikasi Kredibilitas</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Melacak status kejujuran, thabaqat, dan kredibilitas perawi untuk menilai derajat keshahihan suatu riwayat hadis.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Visi & Misi */}
                <section id="visi-misi" className="scroll-mt-24 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg shadow-sm">
                            <i className="fa-solid fa-eye"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Visi & Misi</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        {/* Vision Card */}
                        <div className="md:col-span-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl p-6 md:p-8 shadow-md flex flex-col justify-between">
                            <i className="fa-solid fa-compass text-3xl opacity-40 mb-6"></i>
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-100 leading-none">Visi Utama</h3>
                                <h4 className="text-xl font-bold leading-snug">
                                    Menjadi wadah rujukan utama digitalisasi & metodologi takhrij hadis secara praktis dan edukatif.
                                </h4>
                            </div>
                            <div className="mt-8 text-xs text-emerald-100">
                                Berkontribusi melestarikan tradisi studi hadis di era digital.
                            </div>
                        </div>

                        {/* Mission List */}
                        <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 leading-none mb-2">Misi Perjuangan</h3>
                            <ul className="space-y-4">
                                {[
                                    'Menyediakan mesin pencari hadis berbasis NLP yang praktis dengan database komprehensif berharakat.',
                                    'Mengembangkan visualisasi interaktif perawi hadis berbasis SNA demi mempermudah identifikasi alur sanad.',
                                    'Memanfaatkan kekuatan kecerdasan buatan (AI) untuk analisis matan serta pencarian Syawahid & Muttabi\'.',
                                    'Mengedukasi masyarakat mengenai pentingnya keabsahan hadis shahih demi mencegah penyebaran hadis palsu.'
                                ].map((item, idx) => (
                                    <li key={idx} className="flex gap-3 items-start">
                                        <span className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                                            {idx + 1}
                                        </span>
                                        <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                            {item}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Section 3: Sejarah Singkat */}
                <section id="sejarah" className="scroll-mt-24 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center text-lg shadow-sm">
                            <i className="fa-solid fa-history"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sejarah Singkat</h2>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 relative overflow-hidden">
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            Proyek <b className="text-emerald-500 dark:text-emerald-400">E-Takhrij</b> ini merupakan pengembangan dari proyek sebelumnya yang bernama <b><a href="https://hadispedia.com" target="_blank">HadisPedia</a></b> yang diinisiasi pada awal tahun 2025. Dilatarbelakangi oleh tantangan mendasar yang sering dihadapi oleh para akademisi dan peneliti hadis—yaitu rumitnya melacak ratusan alur periwayatan (<em>sanad</em>) hadis yang menyebar di berbagai kitab induk (<em>Kutubut Tis'ah</em>). Melacak jalur sanad secara manual memakan waktu yang sangat lama dan rawan terjadi kekeliruan analisis.
                        </p>

                        <blockquote className="border-l-4 border-emerald-500 pl-4 py-1.5 italic text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                            "Kami ingin menyatukan tradisi keilmuan hadis klasik (<b>riwayah & dirayah</b>) yang sudah berusia ribuan tahun dengan teknologi visualisasi graf modern dan kecerdasan buatan, guna melahirkan era baru penilitian hadis digital."
                        </blockquote>

                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            Setelah melewati beberapa fase riset interdisipliner yang menggabungkan kajian metodologi takhrij ulama salaf dengan teknik rekayasa perangkat lunak modern, lahirlah sebuah platform terintegrasi. Dengan memadukan pustaka visualisasi data <b>D3.js</b> di frontend dan asisten AI pintar <b>ILHA</b> di backend, Smart Takhrij kini menjadi platform yang memudahkan siapa saja untuk meneliti, memahami, dan memverifikasi keotentikan hadis secara instan dan visual.
                        </p>
                    </div>
                </section>

                {/* Section 4: Profil Pengembang */}
                <section id="pengembang" className="scroll-mt-24 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg shadow-sm">
                            <i className="fa-solid fa-users"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Profil Pengembang</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Dev Card 1 (User / Imdie 85) */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-emerald-300 dark:hover:border-emerald-900/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-6 group">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center text-3xl font-extrabold shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0 select-none">
                                        ST
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                            Tim E-Takhrij
                                        </h4>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            AI & Software Engineer
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Bertanggung jawab atas arsitektur sistem cerdas, rancangan visualisasi sanad interaktif menggunakan D3.js, pengembangan modul visualisasi SNA, serta integrasi endpoint asisten kecerdasan buatan (Gemini AI).
                                </p>
                            </div>

                            <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                                <a href="#" className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-slate-900 hover:text-white text-slate-500 dark:text-slate-400 flex items-center justify-center text-sm transition-colors" title="GitHub">
                                    <i className="fa-brands fa-github"></i>
                                </a>
                                <a href="#" className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-blue-600 hover:text-white text-slate-500 dark:text-slate-400 flex items-center justify-center text-sm transition-colors" title="LinkedIn">
                                    <i className="fa-brands fa-linkedin"></i>
                                </a>
                                <a href="mailto:imdie85@smart-takhrij.org" className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-emerald-600 hover:text-white text-slate-500 dark:text-slate-400 flex items-center justify-center text-sm transition-colors" title="Email">
                                    <i className="fa-solid fa-envelope"></i>
                                </a>
                            </div>
                        </div>

                        {/* Dev Card 2 (Hadith Scholar Advisor) */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-teal-300 dark:hover:border-teal-900/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-6 group">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center text-3xl font-extrabold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0 select-none">
                                        IA
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            Dr. Imam Ahmadi, M.Ag.
                                        </h4>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Senior Hadith Scholar & Advisor
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Menjamin keabsahan metodologi takhrij klasik, keakuratan data biografi perawi hadis, validitas klasifikasi thabaqat dan tingkat kredibilitas riwayat, serta memberikan tinjauan ilmiah keagamaan secara mendalam.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                                <a href="#" className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-slate-900 hover:text-white text-slate-500 dark:text-slate-400 flex items-center justify-center text-sm transition-colors" title="Google Scholar">
                                    <i className="fa-solid fa-graduation-cap"></i>
                                </a>
                                <a href="#" className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-blue-600 hover:text-white text-slate-500 dark:text-slate-400 flex items-center justify-center text-sm transition-colors" title="ResearchGate">
                                    <i className="fa-brands fa-researchgate"></i>
                                </a>
                                <a href="mailto:a.fauzi@smart-takhrij.org" className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-emerald-600 hover:text-white text-slate-500 dark:text-slate-400 flex items-center justify-center text-sm transition-colors" title="Email">
                                    <i className="fa-solid fa-envelope"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
