import { twMerge } from 'tailwind-merge';

interface LogoProps {
    readonly className?: string;
}

export default function Logo({ className }: LogoProps) {


    return (
        <div className={twMerge(className)}>
            <span className={`text-2xl font-bold text-gray-900 dark:text-white select-none tracking-tight`}>
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">AI</span>{ }
                tinerante.it
            </span>
        </div>
    );
}