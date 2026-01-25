import { TripProvider } from "@/context/tripContext";

export default async function Layout({ children }: { children: React.ReactNode }) {
    return (
        <TripProvider >
            {children}
        </TripProvider>
    );
}