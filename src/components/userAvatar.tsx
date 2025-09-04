import { useAuth } from '@/context/authProvider';
import { twMerge } from 'tailwind-merge';

interface AvatarProps {
    className?: string;
}

export default function Avatar({ className }: AvatarProps) {
    const { userData } = useAuth();

    if (!userData) {
        return <div className={twMerge("h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse", className)} />;
    }

    // Estrae le iniziali. Gestisce il caso in cui i dati non siano disponibili.
    const initials = `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase();

    // Non renderizzare l'avatar se non ci sono iniziali (es. utente non loggato)
    if (!initials) {
        return null;
    }

    return (
        <div
            className={twMerge(
                'flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white text-sm select-none',
                className
            )}
        >
            <span>{initials}</span>
        </div>
    );
}

