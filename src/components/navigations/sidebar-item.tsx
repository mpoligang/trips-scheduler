// Tipizzazione per una migliore manutenibilità
interface SidebarItemProps {
    icon: React.ElementType;
    label: string;
    active?: boolean;
    collapsed?: boolean;
    onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, collapsed, onClick }: SidebarItemProps) => {
    const textStyle = active
        ? "text-indigo-50"
        : "text-gray-300 group-hover:text-indigo-50";

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group relative cursor-pointer
        bg-transparent
        hover:bg-gradient-to-br hover:from-purple-600 hover:to-indigo-700
        ${active ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : ''}
      `}
        >
            <div className="flex-shrink-0 w-6 flex justify-center">
                <Icon
                    size={20}
                    className={`transition-colors duration-300 ${active ? 'text-indigo-50' : 'text-gray-400 group-hover:text-indigo-50/90'}`}
                />
            </div>

            {!collapsed && (
                <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${textStyle}`}>
                    {label}
                </span>
            )}

            {/* Tooltip */}
            {collapsed && (
                <div className="fixed left-20 bg-gray-900/95 backdrop-blur-sm text-indigo-50 px-3 py-1.5 rounded-lg text-xs 
          opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 
          z-[9999]  border border-white/10">
                    {label}
                </div>
            )}
        </button>
    );
};

export default SidebarItem;
