import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import "leaflet-geosearch/dist/geosearch.css";
import { createClient } from '@/lib/server'
import { AuthProvider } from "@/context/authProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AItinerante.it - Pianifica i tuoi viaggi con l'IA",
  description: "La tua app per pianificare viaggi",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser(); return (
    <html lang="it">
      <body className={`${inter.className}  bg-gray-900 text-gray-100`}>
        <AuthProvider initialUser={user}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
