
interface PageTitleProps {
    title: string;
    subtitle?: string;
    children?: React.ReactNode; // Usa ReactNode per la massima flessibilità
}

export default function PageTitle({ title, subtitle, children }: PageTitleProps) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{title}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
            </div>
            {children}
        </div>
    );
}
