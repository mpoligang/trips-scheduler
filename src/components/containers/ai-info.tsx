import { BiBrain } from "react-icons/bi";
import ComingSoonFeature from "../cards/coming-soon-features";
import PageTitle from "../generics/page-title";

const AIInfoContainer: React.FC = () => {
    return (
        <>
            <PageTitle title="Informazioni AI"
                subtitle="Scopri le informazioni generate dall'intelligenza artificiale per il tuo viaggio." >
            </PageTitle>

            <ComingSoonFeature title="Questa funzionalità è in arrivo!" icon={BiBrain}
                description="Stiamo lavorando duramente per integrare l'intelligenza artificiale e renderla a portata di app per i tuoi viaggi." />
        </>
    );
}

export default AIInfoContainer;