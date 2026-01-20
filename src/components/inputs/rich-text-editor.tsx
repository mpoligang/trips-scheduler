'use client';

import React, { useEffect, useState } from 'react';
// Utilizziamo import standard; per il tuo progetto Next.js assicurati di aver installato:
// npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder lucide-react
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Link as LinkIcon,
    Unlink,
    Undo,
    Redo
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';

/**
 * Logica per la gestione dei Link
 */
const handleLinkAction = (editor: any) => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Inserisci l\'URL del collegamento:', previousUrl);

    if (url === null) return;
    if (url === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
};

/**
 * Menu Toolbar superiore
 */
const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    const btnClass = (active: boolean) => twMerge(
        "p-2 rounded-lg transition-all duration-200",
        active
            ? "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
            : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
    );

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))}>
                <Bold size={16} />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))}>
                <Italic size={16} />
            </button>

            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))}>
                <List size={16} />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))}>
                <ListOrdered size={16} />
            </button>

            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

            <button type="button" onClick={() => handleLinkAction(editor)} className={btnClass(editor.isActive('link'))}>
                <LinkIcon size={16} />
            </button>
            {editor.isActive('link') && (
                <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} className={btnClass(false)}>
                    <Unlink size={16} />
                </button>
            )}

            <div className="flex-grow" />

            <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-2 text-gray-400 disabled:opacity-30">
                <Undo size={16} />
            </button>
            <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-2 text-gray-400 disabled:opacity-30">
                <Redo size={16} />
            </button>
        </div>
    );
};

/**
 * RichTextInput Component (Esportato come App per compatibilità ambiente)
 */
export default function App() {
    // Mock props per l'anteprima
    const [content, setContent] = useState("<p>Ciao! Prova a selezionare questo testo per vedere il <strong>Bubble Menu</strong>.</p>");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [3, 4] } }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-purple-600 underline cursor-pointer font-medium',
                },
            }),
            Placeholder.configure({
                placeholder: 'Inizia a scrivere qui...',
            }),
        ],
        content: content,
        immediatelyRender: false, // Fix fondamentale per Next.js SSR
        onUpdate: ({ editor }) => {
            setContent(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-6 text-gray-800 dark:text-gray-200",
            },
        },
    });

    if (!mounted || !editor) {
        return <div className="w-full h-[300px] bg-gray-50 animate-pulse rounded-2xl border border-gray-200" />;
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
            <div className="group relative rounded-2xl p-[1px] transition-all duration-500 bg-gray-200 focus-within:bg-gradient-to-r focus-within:from-purple-500 focus-within:to-blue-500">
                <div className="flex flex-col w-full bg-white dark:bg-gray-900 rounded-[15px] overflow-hidden shadow-2xl">

                    {/* Toolbar */}
                    <MenuBar editor={editor} />

                    {/* Bubble Menu */}
                    <BubbleMenu editor={editor} >
                        <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95">
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                className={twMerge("p-2 rounded", editor.isActive('bold') ? "bg-purple-50 text-purple-600" : "text-gray-500")}
                            >
                                <Bold size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleLinkAction(editor)}
                                className={twMerge("p-2 rounded", editor.isActive('link') ? "bg-purple-50 text-purple-600" : "text-gray-500")}
                            >
                                <LinkIcon size={14} />
                            </button>
                        </div>
                    </BubbleMenu>

                    {/* Area Editor */}
                    <EditorContent editor={editor} />

                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Tiptap Engine • Next.js Ready
                        </span>
                        <span className="text-[10px] text-gray-400">
                            Standard Mode
                        </span>
                    </div>
                </div>
            </div>

            {/* Debug output per mostrare che lo stato si aggiorna */}
            <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">HTML Output (Value):</h4>
                <code className="text-[11px] text-purple-600 dark:text-purple-400 break-all">
                    {content}
                </code>
            </div>
        </div>
    );
}