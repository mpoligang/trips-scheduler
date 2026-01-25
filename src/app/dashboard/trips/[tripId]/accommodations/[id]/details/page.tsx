'use client';

import AccommodationForm from "@/components/forms/accomodation-form";
import AccomodationDetailsTemplatePage from "@/components/templates/accommodation-template";

const AccomodationDetailPage = () => {
    return (
        <AccomodationDetailsTemplatePage>
            <AccommodationForm />
        </AccomodationDetailsTemplatePage>
    )
}

export default AccomodationDetailPage;