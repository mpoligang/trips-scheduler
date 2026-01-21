'use client';

import Link from 'next/link';
import {
    FaMapMarkedAlt, FaUserFriends, FaBed, FaPlane, FaFileAlt,
    FaCheckCircle, FaRobot, FaArrowRight, FaInstagram,
    FaTwitter, FaFacebook, FaBriefcase, FaEnvelope, FaShieldAlt, FaLock
} from 'react-icons/fa';
import Logo from '@/components/generics/logo';
import { appRoutes } from '@/utils/appRoutes';
import SiteFooter from '@/components/templates/site-footer';

export default function LandingPage() {
    const currentYear = new Date().getFullYear();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-purple-500/30 flex flex-col overflow-x-hidden">

            {/* Effetto Overlay Texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

            {/* --- HEADER --- */}
            <header className="fixed w-full top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/50">
                <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    <Link href="/" className="transition-transform active:scale-95">
                        <Logo className="scale-75 md:scale-100 origin-left" />
                    </Link>
                    <div className="flex items-center gap-3 md:gap-8">
                        <Link href={appRoutes.login} className="text-xs md:text-sm font-bold hover:text-purple-600 transition-colors">
                            Accedi
                        </Link>
                        <Link
                            href={appRoutes.register}
                            className="px-4 py-2 md:px-6 md:py-2.5 rounded-full bg-purple-600 text-white text-[10px] md:text-sm font-black shadow-lg shadow-purple-500/20 transition-all hover:scale-105 active:scale-95"
                        >
                            Inizia Ora
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-grow">
                {/* --- HERO SECTION --- */}
                <section className="relative pt-28 pb-16 md:pt-48 md:pb-32 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse"></div>
                        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]"></div>
                    </div>

                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-purple-600 dark:text-purple-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-8">
                            <span className="relative flex h-2 w-2">
                                {/* MODIFICA 1: Pulse Verde */}
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            AItinerante.it • AI Ready
                        </div>
                        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 leading-[1.1]">
                            Il tuo viaggio, <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500">
                                perfettamente organizzato.
                            </span>
                        </h1>
                        <p className="text-sm md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                            Dimentica lo stress della pianificazione. Gestisci itinerari, prenotazioni e amici in un&apos;unica dashboard intelligente.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/register" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-lg shadow-xl hover:-translate-y-1 transition-all">
                                Crea Itinerario
                            </Link>
                        </div>
                    </div>
                </section>

                {/* --- FEATURES SECTION --- */}
                <section id="features" className="py-20 md:py-32 bg-white dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800/50">
                    <div className="container mx-auto px-4">
                        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-24">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Tutto ciò che ti serve</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg">
                                Centralizza ogni aspetto della tua avventura ed elimina i fogli di calcolo disordinati.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                            <FeatureCard icon={<FaMapMarkedAlt />} title="Itinerari" desc="Mappa interattiva sincronizzata per organizzare il percorso perfetto giorno dopo giorno." />
                            <FeatureCard icon={<FaBed />} title="Alloggi" desc="Salva hotel, appartamenti e B&B. Tieni traccia di costi e date di check-in/out." />
                            <FeatureCard icon={<FaPlane />} title="Trasporti" desc="Voli, treni, noleggi auto. Orari e codici di prenotazione in un unico posto." />
                            <FeatureCard icon={<FaUserFriends />} title="Collaborazione" desc="Viaggi in gruppo? Invita i tuoi amici e condividete ogni tappa insieme in tempo reale." />
                            <FeatureCard icon={<FaFileAlt />} title="Documenti" desc="Carica PDF e biglietti direttamente nelle tappe. Non perderai mai più una prenotazione." />
                            <FeatureCard icon={<FaCheckCircle />} title="Budget (Soon)" desc="Tieni traccia delle spese per evitare sorprese al rientro dal tuo viaggio." comingSoon />
                        </div>
                    </div>
                </section>

                {/* --- BUSINESS SECTION --- */}
                <section className="py-20">
                    <div className="container mx-auto px-4">
                        <div className="relative overflow-hidden rounded-[2rem] md:rounded-[3rem] bg-slate-900 dark:bg-slate-800 p-8 md:p-20 text-center">
                            <div className="relative z-10 max-w-3xl mx-auto">
                                {/* MODIFICA 2: Badge uguale a quello in alto */}
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest mb-8">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <FaBriefcase className="ml-1" /> Partnership Business
                                </div>
                                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Sei un Influencer o un&apos;Agenzia?</h2>
                                <p className="text-slate-400 text-base md:text-xl mb-10 leading-relaxed">
                                    Porta i tuoi follower in viaggio con te. Offriamo strumenti per Travel Influencer e Agenzie che vogliono offrire itinerari interattivi, brandizzati e professionali.
                                </p>
                                <a
                                    href="mailto:michelangelopoli21@gmail.com"
                                    className="inline-flex items-center gap-4 px-8 py-4 md:px-10 md:py-5 rounded-2xl bg-white text-slate-900 font-black text-base md:text-lg hover:bg-purple-50 transition-all shadow-xl active:scale-95"
                                >
                                    Contattaci
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- AI SECTION --- */}
                <section className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-br from-indigo-950 to-purple-950 text-white">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="flex flex-col lg:flex-row items-center gap-12 md:gap-20">
                            <div className="lg:w-1/2 text-left">
                                {/* MODIFICA 3: Presto Disponibile */}
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-purple-200 text-xs font-bold uppercase mb-6">
                                    <FaRobot className="animate-bounce" />
                                    Presto Disponibile
                                </div>
                                <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tighter">
                                    Il futuro è <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Intelligente</span>.
                                </h2>
                                <p className="text-slate-400 mb-8 text-lg">Stiamo addestrando la nostra IA per rendere la tua pianificazione ancora più magica. Ecco cosa potrai fare:</p>
                                <ul className="space-y-4 md:space-y-6 mb-10">
                                    <AiFeature text="Generazione itinerari completi in pochi secondi." />
                                    <AiFeature text="Suggerimenti intelligenti su tappe e attrazioni." />
                                    <AiFeature text="Ottimizzazione del percorso per risparmiare tempo." />
                                </ul>
                            </div>

                            <div className="lg:w-1/2 w-full">
                                <div className="relative rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/10 p-6 md:p-10 shadow-2xl overflow-hidden group">
                                    {/* Overlay per rinforzare l'idea di "non ancora pronto" */}
                                    <div className="absolute inset-0 bg-slate-900/40 backdrop-grayscale-[0.5] z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                        <span className="px-6 py-3 bg-white text-slate-900 font-bold rounded-full shadow-2xl transform -rotate-3 text-sm">Coming Soon 2026</span>
                                    </div>

                                    <div className="absolute -top-10 -right-10 w-32 md:w-48 h-32 md:h-48 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                                    <div className="space-y-6 relative z-10">
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                                                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                        <div className="h-40 md:h-48 bg-gray-800/50 rounded-2xl border border-gray-700 flex flex-col items-center justify-center p-6 text-center">
                                            <FaRobot className="text-purple-500 text-3xl mb-4 animate-pulse" />
                                            <p className="text-gray-400 text-sm tracking-wide">
                                                L&apos;IA sta imparando a viaggiare... <br />
                                                <span className="text-[10px] text-purple-400 font-bold uppercase mt-2 block tracking-widest">Sviluppo in corso</span>
                                            </p>
                                        </div>
                                        <div className="flex gap-4 justify-end">
                                            <div className="h-10 w-28 bg-gray-700 rounded-xl animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* --- FOOTER --- */}
            <SiteFooter />
        </div>
    );
}

// --- SUPPORT COMPONENTS ---

function FeatureCard({ icon, title, desc, comingSoon = false }: { readonly icon: React.ReactNode; readonly title: string; readonly desc: string; readonly comingSoon?: boolean }) {
    return (
        <div className="group p-8 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-purple-500/20 transition-transform group-hover:scale-110 mb-6">
                {icon}
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-3">
                {title}
                {comingSoon && <span className="text-[10px] uppercase bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md font-bold">Soon</span>}
            </h3>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                {desc}
            </p>
        </div>
    );
}

function AiFeature({ text }: { readonly text: string }) {
    return (
        <li className="flex items-center gap-4">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
            </div>
            <span className="text-slate-200 text-sm md:text-lg font-medium">{text}</span>
        </li>
    );
}