export const quizCategories: KeyLabelPair[] = [
    {
        key: 'culture', label: 'Cultura e Storia',
        items: [
            { key: 'museums', label: 'Musei' },
            { key: 'monuments', label: 'Monumenti' },
            { key: 'historical_squares', label: 'Piazze Storiche' },
            { key: 'historical_streets', label: 'Vie Storiche' },
            { key: 'temples_and_churches', label: 'Templi e Chiese' },
            { key: 'archaeological_sites', label: 'Siti Archeologici' },
            { key: 'aquariums', label: 'Acquari' },
        ]
    },
    {
        key: 'food', label: 'Gastronomia',
        items: [
            { key: 'typical_restaurants', label: 'Ristoranti Tipici' },
            { key: 'street_food', label: 'Street Food' },
            { key: 'vegan_food', label: 'Gastronomia Vegana/Vegetariana' },
            { key: 'local_markets', label: 'Mercati Locali' },
            { key: 'supermarkets', label: 'Supermercati o Negozi Alimentari' },
            { key: 'aperitif_bars', label: 'Locali per aperitivi e degustazioni' },
        ]
    },
    {
        key: 'leisure', label: 'Svago e Relax',
        items: [
            { key: 'parks', label: 'Parchi' },
            { key: 'pools', label: 'Piscine' },
            { key: 'spas', label: 'Terme e Spa' },
            { key: 'shopping_areas', label: 'Aree Shopping' },
        ]
    },
    {
        key: 'nature', label: 'Natura e Panorami',
        items: [
            { key: 'viewpoints', label: 'Punti Panoramici' },
            { key: 'hiking_trails', label: 'Sentieri Escursionistici' },
            { key: 'botanical_gardens', label: 'Giardini Botanici' },
            { key: 'beaches', label: 'Spiagge' },
            { key: 'mountains', label: 'Montagne' },
            { key: 'lakes', label: 'Laghi' },
            { key: 'rivers', label: 'Fiumi' },
        ]
    },
    {
        key: 'nightlife', label: 'Nightlife',
        items: [
            { key: 'night_clubs', label: 'Locali Notturni' },
            { key: 'bars', label: 'Bar' },
            { key: 'pubs', label: 'Pub' },
            { key: 'discos', label: 'Discoteche' },
        ]
    },
];


export interface KeyLabelPair {
    key: string;
    label: string;
    items?: KeyLabelPair[];
}
