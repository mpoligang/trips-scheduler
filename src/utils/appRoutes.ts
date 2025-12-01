export const appRoutes = {
    home: '/dashboard',
    tripMetadata: (tripId: string) => `/dashboard/trips/${tripId}/metadata`,
    tripDetails: (tripId: string) => `/dashboard/trips/${tripId}/detail`,
    accommodationDetails: (tripId: string, accommodationId: string = 'new') => `/dashboard/trips/${tripId}/accommodation/${accommodationId}`,
    stageDetails: (tripId: string, stageId: string = 'new') => `/dashboard/trips/${tripId}/stage/${stageId}`,
};

export const mapNavigationUrl = (address: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;