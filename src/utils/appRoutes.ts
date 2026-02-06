
const tripMetadata = (tripId: string) => `/dashboard/trips/${tripId}/metadata`;
const tripDetails = (tripId: string) => `/dashboard/trips/${tripId}`;

const dashboard = '/dashboard';

export const appRoutes = {
    landing: '/landing',
    login: '/login',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    register: '/register',
    home: dashboard,
    verifyEmail: '/verify-email',
    privacy: '/privacy',
    registrationSuccess: '/registration-success',
    passwordUpdatedSuccess: '/password-updated-success',
    processFailed: '/process-failed',
    profile: `${dashboard}/profile`,
    tripMetadata,
    tripDetails,
    mapTrip: (tripId: string) => `${tripDetails(tripId)}/map`,
    accommodations: (tripId: string) => `${tripDetails(tripId)}/accommodations`,
    transports: (tripId: string) => `${tripDetails(tripId)}/transports`,
    expenses: (tripId: string) => `${tripDetails(tripId)}/expenses`,
    recommended: (tripId: string) => `${tripDetails(tripId)}/recommended`,
    stages: (tripId: string) => `${tripDetails(tripId)}/stages`,
    settings: (tripId: string) => `${tripDetails(tripId)}/settings`,
    members: (tripId: string) => `${tripDetails(tripId)}/members`,
    accommodationDetails: (tripId: string, accommodationId: string = 'new') => `${tripDetails(tripId)}/accommodations/${accommodationId}/details`,
    recommendedDetails: (tripId: string, recommendedId: string = 'new') => `${tripDetails(tripId)}/recommended/${recommendedId}/details`,
    stageDetails: (tripId: string, stageId: string = 'new') => `${tripDetails(tripId)}/stages/${stageId}/details`,
    transportDetails: (tripId: string, transportId: string = 'new') => `${tripDetails(tripId)}/transports/${transportId}/details`,
};


