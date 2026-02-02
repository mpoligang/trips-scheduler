'use client';

import Button from "@/components/actions/button";
import PageTitle from "@/components/generics/page-title";
import StageTemplatePage from "@/components/templates/stage-template";
import { FaPlus } from "react-icons/fa";

const StageAIInfoPage = () => {
    return (
        <StageTemplatePage>
            <PageTitle title="Informazioni AI"
                subtitle="Scopri le informazioni generate dall'intelligenza artificiale per il tuo viaggio." >
                <Button variant="secondary" size="sm">
                    <FaPlus className="mr-2" />
                    Aggiungi
                </Button>
            </PageTitle>
        </StageTemplatePage>
    );
};

export default StageAIInfoPage;
