import { TripProvider } from "@/context/tripContext";

export default async function Layout({ children, params }: { children: React.ReactNode, params: any }) {
    const { tripId } = await params;
    return (
        <TripProvider tripId={tripId}>
            {children}
        </TripProvider>
    );
}