export default function TextLink({ href, text }: { href: string; text: string }) {
    return (
        <div className="flex flex-col items-start w-fit">
            <a href={href} className="dark:text-white text-gray-800 font-semibold underline hover:text-purple-600 dark:hover:text-purple-400">
                {text}
            </a>
            <div className="mt-[1px] h-[2px] w-full bg-gradient-to-br from-purple-600 to-indigo-700 rounded-full shadow-sm shadow-purple-500/20" />
        </div>
    );
}