import { appRoutes } from "@/utils/appRoutes";
import DialogComponent from "./confirm-modal";

export default function HowToObtainAIApiKeyModal(
    { isOpen, setIsOpen }: Readonly<{ isOpen: boolean; setIsOpen: (open: boolean) => void }>
) {
    return (
        <DialogComponent
            isOpen={isOpen}
            isLoading={false}
            title="Come ottenere la tua chiave API (Google AI Studio)"
            confirmText="Ho capito, grazie!"
            onConfirm={() => setIsOpen(false)}
            onClose={() => setIsOpen(false)}
        >
            <div className="space-y-4 text-sm text-white">
                <p>
                    Una <strong>Chiave API</strong> è come una &quot;password&quot; speciale che permette a questa applicazione
                    di parlare con l&apos;intelligenza artificiale di Google a nome tuo.
                </p>

                <ol className="list-decimal pl-5 space-y-2">
                    <li>
                        Vai su <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="underline font-bold" >Google AI Studio</a> ed effettua l&apos;accesso con il tuo account Google normale.
                    </li>
                    <li>
                        In basso a sinistra della pagina, clicca sul tasto <strong>&quot;Get API key&quot;</strong>.
                    </li>
                    <li>
                        Clicca sul tasto a destra <strong>&quot;Create API key&quot;</strong> (se richiesto, scegli un progetto o creane uno nuovo in un click).
                    </li>
                    <li>
                        <strong>Copia la chiave:</strong> apparirà una stringa di lettere e numeri. Torna sul tuo{" "}
                        <a
                            className="underline font-bold"
                            href={appRoutes.profile}
                            target="_blank"
                        >
                            Profilo
                        </a>. Clicca i tre puntini in alto a destra e seleziona la voce Modifica. Incolla la chiave dentro il campo &quot;Api Key&quot; e salva le modifiche.
                    </li>
                </ol>
            </div>
        </DialogComponent>
    );
}