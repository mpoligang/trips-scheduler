import { FaUtensils, FaCoffee, FaLandmark, FaUniversity, FaTree, FaShoppingBag, FaHotTub, FaCocktail, FaHiking, FaBinoculars, FaStar } from "react-icons/fa";

/**
 * Enum per mappare gli ID delle categorie in modo tipizzato nel codice.
 */
export enum CategoryOptionEnum {
    RESTAURANT = 'restaurant',
    BAKERY = 'bakery',
    MONUMENT = 'monument',
    MUSEUM = 'museum',
    PARK = 'park',
    SHOPPING = 'shopping',
    SPA = 'spa',
    NIGHTLIFE = 'nightlife',
    ACTIVITIES = 'activities',
    VIEWPOINT = 'viewpoint',
    OTHER = 'other'
}

export const CATEGORY_OPTIONS = [
    { id: CategoryOptionEnum.RESTAURANT, name: 'Ristoranti', icon: FaUtensils },
    { id: CategoryOptionEnum.BAKERY, name: 'Pasticcerie & Bar', icon: FaCoffee },
    { id: CategoryOptionEnum.MONUMENT, name: 'Monumenti & Storia', icon: FaLandmark },
    { id: CategoryOptionEnum.MUSEUM, name: 'Musei & Gallerie', icon: FaUniversity },
    { id: CategoryOptionEnum.PARK, name: 'Parchi & Natura', icon: FaTree },
    { id: CategoryOptionEnum.SHOPPING, name: 'Shopping & Mercati', icon: FaShoppingBag },
    { id: CategoryOptionEnum.SPA, name: 'Terme & Benessere', icon: FaHotTub },
    { id: CategoryOptionEnum.NIGHTLIFE, name: 'Vita Notturna', icon: FaCocktail },
    { id: CategoryOptionEnum.ACTIVITIES, name: 'Attività & Sport', icon: FaHiking },
    { id: CategoryOptionEnum.VIEWPOINT, name: 'Punti Panoramici', icon: FaBinoculars },
    { id: CategoryOptionEnum.OTHER, name: 'Altro', icon: FaStar },
];

export const getIconByCategoryId = (categoryId: string) => {
    const category = CATEGORY_OPTIONS.find(cat => cat.id === categoryId);
    return category ? category.icon : FaStar;
}
