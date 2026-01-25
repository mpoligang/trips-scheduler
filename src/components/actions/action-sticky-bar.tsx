import { FaTimes } from "react-icons/fa";
import Button from "./button";
import { ImSpinner8 } from "react-icons/im";

interface ActionStickyBarProps {
    readonly handleCancel: () => void;
    readonly isSubmitting: boolean;
    readonly isNew?: boolean;
}

export default function ActionStickyBar({ handleCancel, isSubmitting }: ActionStickyBarProps) {
    return (
        <div className='w-full bg-white dark:bg-gray-900 shadow-md fixed bottom-0 z-8888 left-0 h-20 flex items-center justify-end px-4
                    border-t border-gray-50 dark:border-gray-700
                    '>
            <Button
                variant="secondary"
                type="button"
                className="w-[100px]"
                onClick={handleCancel}
            >
                <div className="flex items-center gap-2">
                    <FaTimes size={12} />
                    <span>Annulla</span>
                </div>
            </Button>

            <Button className="ml-4 w-[100px]" type="submit" disabled={isSubmitting}>
                <div className="flex items-center gap-2">
                    <ImSpinner8 className={`animate-spin mr-2 ${isSubmitting ? 'inline-block' : 'hidden'}`} />
                    <span>Salva</span>
                </div>
            </Button>
        </div>
    );
}