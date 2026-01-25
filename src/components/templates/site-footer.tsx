import Logo from "../generics/logo";
import Link from "next/link";



export default function SiteFooter() {

    const currentYear = new Date().getFullYear();
    return (
        <footer className="bg-white dark:bg-gray-950 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                        <Logo className="h-8 mb-6" />
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                            Il compagno di viaggio intelligente che semplifica ogni avventura. Pianifica, collabora ed esplora con AItinerante.it.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 text-center sm:text-left">
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-6 text-xs uppercase tracking-widest">Esplora</h4>
                            <ul className="space-y-4 text-sm text-slate-500">
                                <li><Link href="/landing/#features" className="hover:text-purple-600">Funzionalità</Link></li>
                                <li><Link href="/login" className="hover:text-purple-600">Accedi</Link></li>
                                <li><Link href="/register" className="hover:text-purple-600">Registrati</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-6 text-xs uppercase tracking-widest">Legale</h4>
                            <ul className="space-y-4 text-sm text-slate-500">
                                <li><Link href="/privacy" className="hover:text-purple-600">Privacy Policy</Link></li>
                                <li><Link href="#" className="hover:text-purple-600">Questo sito non raccoglie cookie</Link></li>
                            </ul>
                        </div>
                    </div>


                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-8 text-center text-[10px] md:text-xs text-slate-400  tracking-widest">
                    © {currentYear} AItinerante.it. Made with ❤️ for world travelers.
                </div>
            </div>
        </footer>
    )
}