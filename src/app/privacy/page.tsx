'use client';

import React from 'react';
import {
    FaShieldAlt, FaUserLock, FaDatabase, FaGlobeAmericas,
    FaEnvelopeOpenText, FaUsers, FaCheckCircle,
    FaFileAlt, FaMapMarkedAlt, FaBriefcase,
    FaHome
} from 'react-icons/fa';
import Logo from '@/components/generics/logo';
import Button from '@/components/actions/button';
import SiteFooter from '@/components/templates/site-footer';
import { useRouter } from 'next/navigation';
import { appConfig } from '@/configs/app-config';

export default function PrivacyPolicyPage() {
    const updateDate = "21 Gennaio 2026";
    const router = useRouter()

    return (
        // RIMOSSO: bg-slate-50, text-slate-900
        // PROMOSSO: bg-gray-950, text-slate-100
        <div className="min-h-screen bg-gray-950 text-slate-100 font-sans selection:bg-purple-500/30 flex flex-col overflow-x-hidden">

            {/* Texture Overlay (Coerenza Landing) */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

            {/* --- HEADER --- */}
            {/* RIMOSSO: bg-white/80, border-slate-200 */}
            {/* PROMOSSO: bg-gray-950/80, border-slate-800/50 */}
            <header className="fixed w-full top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-slate-800/50">
                <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">

                    <Logo className="scale-75 md:scale-90" />
                    <Button variant="secondary" size="sm" onClick={() => router.push('/')}>
                        <FaHome className="group-hover:-translate-x-1 transition-transform md:mr-2" />
                        <span className="hidden sm:inline">Torna alla Home</span>
                    </Button>

                </div>
            </header>

            <main className="flex-grow pt-32 pb-20">
                {/* --- HERO SECTION --- */}
                <section className="container mx-auto px-4 max-w-4xl text-center mb-16 md:mb-24">
                    {/* RIMOSSO: bg-white, border-slate-200 */}
                    {/* PROMOSSO: bg-slate-900, border-slate-800 */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-purple-600 text-[10px] md:text-xs font-black uppercase tracking-widest mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Aggiornato al: {updateDate}
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-6 leading-tight">
                        Privacy & <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-500">Sicurezza</span>
                    </h1>
                    {/* RIMOSSO: text-slate-500 */}
                    {/* PROMOSSO: text-slate-400 */}
                    <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
                        In AItinerante.it la protezione dei tuoi viaggi inizia dalla protezione dei tuoi dati. Semplice, trasparente, sicura.
                    </p>
                </section>

                <div className="container mx-auto px-4 max-w-5xl space-y-24">

                    {/* 1. SEZIONE INTRODUTTIVA */}
                    {/* RIMOSSO: bg-white, border-slate-200/50 */}
                    {/* PROMOSSO: bg-slate-900/40, border-slate-800/50 */}
                    <section className="flex flex-col md:flex-row gap-8 items-start bg-slate-900/40 p-8 md:p-12 rounded-[2.5rem] border border-slate-800/50 shadow-sm">
                        {/* RIMOSSO: bg-purple-100 */}
                        {/* PROMOSSO: bg-purple-900/30 */}
                        <div className="w-16 h-16 rounded-2xl bg-purple-900/30 flex items-center justify-center text-purple-600 text-3xl shrink-0 shadow-inner">
                            <FaShieldAlt />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">Il nostro Impegno</h2>
                            {/* RIMOSSO: text-slate-600 */}
                            {/* PROMOSSO: text-slate-400 */}
                            <p className="text-slate-400 leading-relaxed font-medium">
                                {/* RIMOSSO: text-slate-900 */}
                                {/* PROMOSSO: text-white */}
                                Benvenuto su <span className="text-white font-bold">AItinerante.it</span>. Crediamo che la tecnologia debba essere al servizio dell&apos;esplorazione, non del controllo. I tuoi dati personali sono protetti da infrastrutture crittografate e gestiti esclusivamente per rendere la tua esperienza di viaggio impeccabile.
                            </p>
                        </div>
                    </section>

                    {/* 2. DATI RACCOLTI - CARD STILE LANDING */}
                    <section>
                        <div className="max-w-2xl mb-12">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-purple-500 mb-4 flex items-center gap-3">
                                <FaUserLock /> Raccolta Dati
                            </h3>
                            {/* RIMOSSO: text-slate-500 */}
                            {/* PROMOSSO: text-slate-400 */}
                            <p className="text-slate-400 font-medium italic">Gestiamo solo le informazioni necessarie per la tua avventura.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <PrivacyDataCard
                                icon={<FaUsers />}
                                title="Identità Account"
                                desc="Email e dati profilo gestiti in modo sicuro tramite Firebase Authentication per garantire accessi protetti."
                            />
                            <PrivacyDataCard
                                icon={<FaMapMarkedAlt />}
                                title="Itinerari"
                                desc="Le tappe e i percorsi salvati sono crittografati nel nostro database cloud, accessibili solo a te e ai tuoi compagni."
                            />
                            <PrivacyDataCard
                                icon={<FaFileAlt />}
                                title="Media & Biglietti"
                                desc="I file che carichi sono archiviati in bucket privati e protetti da chiavi di accesso temporanee e sicure."
                            />
                        </div>
                    </section>

                    {/* 3. TRASPARENZA TECNOLOGICA (DARK SECTION) */}
                    {/* NOTA: Qui bg-slate-900 era la versione light, bg-slate-800 la dark. Mantengo la dark. */}
                    <section className="relative overflow-hidden rounded-[3rem] bg-slate-800 p-8 md:p-16 text-white shadow-2xl">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 blur-[100px]"></div>
                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                                <div>
                                    <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                                        <FaDatabase className="text-purple-400" /> Tech Stack
                                    </h2>
                                    <p className="text-slate-400 text-sm tracking-wide uppercase font-bold">Partner infrastrutturali certificati</p>
                                </div>
                                <div className="h-px flex-grow bg-white/10 mx-8 hidden lg:block"></div>
                                <FaGlobeAmericas className="text-5xl text-white/10 hidden md:block" />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <TechItem name="Google Firebase" usage="Infrastruttura, Auth e Database in Real-time." />
                                <TechItem name="LocationIQ" usage="Processamento coordinate e mappatura geografica." />
                                <TechItem name="OpenAI / Gemini" usage="Elaborazione suggerimenti intelligenti (Dati Anonimizzati)." />
                            </div>
                        </div>
                    </section>

                    {/* 4. BUSINESS & DIRITTI */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
                        {/* RIMOSSO: border-slate-200 */}
                        {/* PROMOSSO: border-slate-800 */}
                        <div className="p-8 rounded-[2rem] border border-slate-800">
                            <h3 className="text-xl font-black mb-4 flex items-center gap-3">
                                <FaBriefcase className="text-purple-600" /> Business & Pro
                            </h3>
                            {/* RIMOSSO: text-slate-500 */}
                            {/* PROMOSSO: text-slate-400 */}
                            <p className="text-slate-400 leading-relaxed text-sm font-medium">
                                Per gli utenti Influencer e le Agenzie, AItinerante.it agisce come Responsabile del Trattamento. Garantiamo la massima conformità per i dati dei vostri clienti finali.
                            </p>
                        </div>

                        {/* RIMOSSO: bg-slate-900/5, border-slate-200 */}
                        {/* PROMOSSO: bg-white/5, border-slate-800 */}
                        <div className="p-8 rounded-[2rem] bg-white/5 border border-slate-800">
                            <h3 className="text-xl font-black mb-4 flex items-center gap-3">
                                <FaCheckCircle className="text-emerald-500" /> Diritti GDPR
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {['Accesso', 'Oblio', 'Portabilità', 'Rettifica'].map(tag => (
                                    // RIMOSSO: bg-white, border-slate-200
                                    // PROMOSSO: bg-slate-800, border-slate-700
                                    <span key={tag} className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-700">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500">Puoi esercitare i tuoi diritti scrivendo direttamente al nostro team privacy.</p>
                        </div>
                    </section>

                    {/* 5. FOOTER PRIVACY */}
                    {/* RIMOSSO: border-slate-200 */}
                    {/* PROMOSSO: border-slate-800 */}
                    <div className="pt-20 border-t border-slate-800 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg mb-6 group-hover:rotate-12 transition-transform">
                                <FaEnvelopeOpenText />
                            </div>
                            <h4 className="text-xl font-black mb-2">Hai domande?</h4>
                            <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">Siamo a tua disposizione per qualsiasi chiarimento sui tuoi dati.</p>
                            <a
                                href={`mailto:${appConfig.supportEmail}`}
                                // RIMOSSO: bg-slate-900, text-white
                                // PROMOSSO: bg-white, text-slate-900 (Nota: inversione colori del bottone in dark mode)
                                className="px-10 py-4 rounded-2xl bg-white text-slate-900 font-black text-lg hover:scale-105 transition-all shadow-xl shadow-slate-900/10"
                            >
                                Contattaci
                            </a>
                        </div>

                    </div>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}

// --- SUPPORT COMPONENTS (STYLE ALIGNED WITH LANDING) ---

function PrivacyDataCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        // RIMOSSO: bg-white, border-slate-200/50, hover:border-purple-500/30 (conflitti non specificati ma ho pulito)
        // PROMOSSO: bg-white/5, border-white/5
        <div className="group p-8 rounded-[2rem] bg-white/5 border border-white/5 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 flex flex-col h-full">
            {/* AVATAR ICON - ESATTAMENTE COME NELLA LANDING */}
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-purple-500/20 transition-transform group-hover:scale-110 mb-6">
                {icon}
            </div>
            {/* RIMOSSO: text-slate-900 */}
            {/* PROMOSSO: text-white */}
            <h3 className="text-xl font-bold mb-4 text-white">
                {title}
            </h3>
            {/* RIMOSSO: text-slate-500 */}
            {/* PROMOSSO: text-slate-400 */}
            <p className="text-sm md:text-base text-slate-400 leading-relaxed font-medium">
                {desc}
            </p>
        </div>
    );
}

function TechItem({ name, usage }: { name: string, usage: string }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
            <span className="font-black text-purple-400 tracking-tight mb-1 sm:mb-0">{name}</span>
            <span className="text-slate-400 text-xs md:text-sm font-medium">{usage}</span>
        </div>
    );
}