import { appRoutes } from '@/utils/appRoutes';
import { useRouter } from 'next/dist/client/components/navigation';
import { twMerge } from 'tailwind-merge';

interface LogoProps {
    readonly className?: string;
    readonly size?: 'small' | 'large';
}

export default function Logo({ className, size = 'large' }: LogoProps) {


    const router = useRouter();
    const handleClick = () => {
        router.push(appRoutes.home);
    };

    return (
        <div className={twMerge(className)} onClick={handleClick}>
            <span className={`${size === 'large' ? 'text-2xl' : 'text-xl'} font-bold text-gray-900 dark:text-white select-none tracking-tight`}>
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">AI</span>{ }
                tinerante.it
            </span>
        </div>
    );
}