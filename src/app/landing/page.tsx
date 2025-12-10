'use client';

import Link from 'next/link';
import { FaMapMarkedAlt, FaUserFriends, FaBed, FaPlane, FaFileAlt, FaCheckCircle, FaRobot, FaArrowRight, FaInstagram, FaTwitter, FaFacebook } from 'react-icons/fa';
import Logo from '@/components/generics/logo';
import { appRoutes } from '@/utils/appRoutes';

export default function LandingPage() {
    const currentYear = new Date().getFullYear();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans selection:bg-purple-200 dark:selection:bg-purple-900 flex flex-col">

            {/* --- HEADER / NAVBAR --- */}
            <header className="fixed w-full top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link href="/">
                        <Logo className="scale-90 sm:scale-100" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link
                            href={appRoutes.login}
                            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors hidden sm:block"
                        >
                            Accedi
                        </Link>
                        <Link
                            href={appRoutes.register}
                            className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-lg shadow-purple-500/20 transition-all hover:scale-105"
                        >
                            Inizia Ora
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-grow">
                {/* --- HERO SECTION --- */}
                <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob"></div>
                        <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000"></div>
                        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000"></div>
                    </div>

                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider mb-6">
                            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                            <span>Nuova versione disponibile</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-purple-800 to-indigo-900 dark:from-white dark:via-purple-200 dark:to-indigo-300">
                            Il tuo viaggio, <br className="hidden md:block" />
                            <span className="text-purple-600 dark:text-purple-400">perfettamente organizzato.</span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Pianifica itinerari, gestisci prenotazioni e collabora con gli amici.
                            Tutto in un&apos;unica app intelligente che cresce con te.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/register"
                                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 hover:-translate-y-1 transition-all"
                            >
                                Crea il tuo primo viaggio
                            </Link>
                            <Link
                                href="#features"
                                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                            >
                                Scopri di più
                            </Link>
                        </div>
                    </div>
                </section>

                {/* --- FEATURES SECTION --- */}
                <section id="features" className="py-24 bg-white dark:bg-gray-800/50">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tutto ciò che ti serve per partire</h2>
                            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                Dimentica fogli di calcolo disordinati e chat disperse. ItinerIA centralizza ogni aspetto della tua avventura.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={<FaMapMarkedAlt />}
                                title="Itinerari"
                                // MODIFICA: Testo aggiornato come richiesto
                                desc="Visualizza le tue tappe su una mappa interattiva e organizza il percorso perfetto giorno per giorno."
                            />
                            <FeatureCard
                                icon={<FaBed />}
                                title="Gestione Alloggi"
                                desc="Salva hotel, appartamenti e B&B. Tieni traccia di costi, date di check-in/out e link di prenotazione."
                            />
                            <FeatureCard
                                icon={<FaPlane />}
                                title="Trasporti"
                                desc="Voli, treni, noleggi auto. Organizza gli spostamenti con orari, codici di prenotazione e dettagli in un unico posto."
                            />
                            <FeatureCard
                                icon={<FaUserFriends />}
                                title="Collaborazione Real-Time"
                                // MODIFICA: Testo aggiornato come richiesto
                                desc="Viaggi in gruppo? Invita i tuoi amici e condividete l'itinerario insieme."
                            />
                            <FeatureCard
                                icon={<FaFileAlt />}
                                title="Documenti e Biglietti"
                                desc="Carica PDF, immagini e biglietti direttamente nelle tappe. Non perderai mai più una prenotazione."
                            />
                            <FeatureCard
                                icon={<FaCheckCircle />}
                                title="Budget Control (Presto)"
                                desc="Tieni traccia delle spese stimate e reali per evitare sorprese al rientro."
                                comingSoon
                            />
                        </div>
                    </div>
                </section>

                {/* --- AI SECTION (Work in Progress) --- */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 z-0"></div>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="flex flex-col lg:flex-row items-center gap-12">
                            <div className="lg:w-1/2 text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold uppercase mb-6">
                                    <FaRobot className="animate-bounce" />
                                    Work in Progress
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                    Il futuro del viaggio <br />è <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Intelligente</span>.
                                </h2>
                                <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
                                    Stiamo lavorando duramente per integrare un potente motore di <strong>Intelligenza Artificiale</strong> direttamente in ItinerIA. Presto potrai:
                                </p>

                                <ul className="space-y-4 mb-10">
                                    <AiFeature text="Generare itinerari completi in pochi secondi basati sui tuoi interessi." />
                                    <AiFeature text="Ricevere suggerimenti su ristoranti e attrazioni nascoste vicino alle tue tappe." />
                                    <AiFeature text="Ottimizzare automaticamente il percorso per risparmiare tempo." />
                                </ul>

                            </div>

                            <div className="lg:w-1/2 relative">
                                <div className="relative rounded-2xl bg-gray-900/50 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>

                                    <div className="space-y-4">
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                                                <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
                                            </div>
                                        </div>
                                        <div className="h-32 bg-gray-800 rounded-lg border border-gray-700 p-4 flex items-center justify-center">
                                            <p className="text-gray-500 text-sm flex items-center gap-2">
                                                <FaRobot className="text-purple-500" />
                                                L&apos;IA sta generando il tuo viaggio...
                                            </p>
                                        </div>
                                        <div className="flex gap-4 justify-end">
                                            <div className="h-8 w-24 bg-gray-700 rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- CTA SECTION --- */}
                <section className="py-24 bg-white dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Pronto a partire?</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
                            Unisciti a migliaia di viaggiatori che stanno già organizzando le loro avventure in modo più intelligente.
                        </p>
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:opacity-90 transition-opacity"
                        >
                            Inizia Gratuitamente <FaArrowRight />
                        </Link>
                    </div>
                </section>
            </main>

            {/* --- FOOTER --- */}
            <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">

                        {/* Logo e Info */}
                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                            <Link href="/" className="mb-4">
                                <Logo className="scale-90 origin-left" />
                            </Link>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                                Il compagno di viaggio intelligente che semplifica ogni avventura. Pianifica, collabora ed esplora.
                            </p>
                        </div>

                        {/* Link Utili */}
                        <div className="flex flex-col sm:flex-row gap-8 text-center sm:text-left">
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-white mb-3">Esplora</h4>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <li><Link href="#features" className="hover:text-purple-600 dark:hover:text-purple-400">Funzionalità</Link></li>
                                    <li><Link href="/login" className="hover:text-purple-600 dark:hover:text-purple-400">Accedi</Link></li>
                                    <li><Link href="/register" className="hover:text-purple-600 dark:hover:text-purple-400">Registrati</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-white mb-3">Legale</h4>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <li><Link href="/privacy" className="hover:text-purple-600 dark:hover:text-purple-400">Privacy Policy</Link></li>
                                    <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400">Termini di Servizio</Link></li>
                                    <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400">Cookie Policy</Link></li>
                                </ul>
                            </div>
                        </div>

                        {/* Social */}
                        <div className="flex gap-4">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-600 transition-colors" aria-label="Instagram">
                                <FaInstagram size={24} />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-600 transition-colors" aria-label="Twitter">
                                <FaTwitter size={24} />
                            </a>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-600 transition-colors" aria-label="Facebook">
                                <FaFacebook size={24} />
                            </a>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-800 mt-10 pt-6 text-center text-xs text-gray-500 dark:text-gray-500">
                        © {currentYear} ItinerIA. Tutti i diritti riservati. Made with ❤️ for travelers.
                    </div>
                </div>
            </footer>
        </div>
    );
}

// --- Componenti di Supporto (Interni per semplicità) ---

function FeatureCard({ icon, title, desc, comingSoon = false }: { readonly icon: React.ReactNode; readonly title: string; readonly desc: string; readonly comingSoon?: boolean }) {
    return (
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group h-full flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white flex items-center gap-2">
                {title}
                {comingSoon && <span className="text-[10px] uppercase bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full font-semibold">Soon</span>}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed flex-grow">
                {desc}
            </p>
        </div>
    );
}

function AiFeature({ text }: { readonly text: string }) {
    return (
        <li className="flex items-start gap-3">
            <div className="mt-1.5 flex-shrink-0 w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
            </div>
            <span className="text-indigo-100 leading-relaxed">{text}</span>
        </li>
    );
}