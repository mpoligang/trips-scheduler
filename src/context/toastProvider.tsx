"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
    return (
        <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
                // Puoi definire stili globali qui
                duration: 4000,
                style: {
                    background: '#363636',
                    color: '#fff',
                },
            }}
        />
    );
}