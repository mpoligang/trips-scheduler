
const tripMetadata = (tripId: string) => `/dashboard/trips/${tripId}/metadata`;
const tripDetails = (tripId: string) => `/dashboard/trips/${tripId}`;

const dashboard = '/dashboard';

export const appRoutes = {
    landing: '/landing',
    login: '/login',
    forgotPassword: '/forgot-password',
    register: '/register',
    home: dashboard,
    profile: `${dashboard}/profile`,
    tripMetadata,
    tripDetails,
    accommodations: (tripId: string) => `${tripDetails(tripId)}/accommodations`,
    transports: (tripId: string) => `${tripDetails(tripId)}/transports`,
    stages: (tripId: string) => `${tripDetails(tripId)}/stages`,
    settings: (tripId: string) => `${tripDetails(tripId)}/settings`,
    members: (tripId: string) => `${tripDetails(tripId)}/members`,
    accommodationDetails: (tripId: string, accommodationId: string = 'new') => `${tripDetails(tripId)}/accommodations/${accommodationId}/details`,
    stageDetails: (tripId: string, stageId: string = 'new') => `${tripDetails(tripId)}/stages/${stageId}/details`,
    transportDetails: (tripId: string, transportId: string = 'new') => `${tripDetails(tripId)}/transports/${transportId}/details`,
};

export const mapNavigationUrl = (address: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

export const TRIP_NAME = 'TRIP_NAME';