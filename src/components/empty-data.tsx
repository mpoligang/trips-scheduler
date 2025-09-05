
interface EmptyDataProps {
    title: string;
    subtitle: string;
}

export default function EmptyData({ title, subtitle }: EmptyDataProps) {
    return <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg ">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">{subtitle}</p>
    </div>
}