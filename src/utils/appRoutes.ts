
const tripMetadata = (tripId: string) => `/dashboard/trips/${tripId}/metadata`;
const tripDetails = (tripId: string) => `/dashboard/trips/${tripId}/detail`;
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
    accommodationDetails: (tripId: string, accommodationId: string = 'new') => `${tripDetails(tripId)}/accommodation/${accommodationId}`,
    stageDetails: (tripId: string, stageId: string = 'new') => `${tripDetails(tripId)}/stage/${stageId}`,
    transportDetails: (tripId: string, transportId: string = 'new') => `${tripDetails(tripId)}/transport/${transportId}`,
};

export const mapNavigationUrl = (address: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

