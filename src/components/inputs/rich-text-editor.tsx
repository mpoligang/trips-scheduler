'use client';

import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { twMerge } from 'tailwind-merge';
import { Bold, List, ListOrdered, Link as LinkIcon, Unlink } from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange?: (value: string) => void;
    className?: string;
    readOnly?: boolean;
}

const RichTextEditor = ({ value, onChange, className, readOnly = false }: RichTextEditorProps) => {
    const editor = useEditor({
        immediatelyRender: false,
        editable: !readOnly,
        extensions: [
            StarterKit.configure({
                bulletList: { keepMarks: true, keepAttributes: false },
                orderedList: { keepMarks: true, keepAttributes: false },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-gray-900 dark:text-white bg-gradient-to-r from-purple-600 to-indigo-700 bg-[length:100%_2px] bg-no-repeat bg-bottom pb-[2px] font-medium transition-opacity hover:opacity-80 cursor-pointer',
                },
            }),
        ],
        content: value, // Imposta il valore iniziale
        onUpdate: ({ editor }) => {
            if (onChange) {
                onChange(editor.getHTML());
            }
        },
        editorProps: {
            attributes: {
                class: twMerge(
                    'focus:outline-none min-h-[100px] max-w-full text-gray-800 dark:text-gray-200',
                    '[&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:pl-1',
                    readOnly ? 'p-0' : 'p-4'
                ),
            },
        },
    });

    // 1. SINCRONIZZAZIONE CONTENUTO: Fondamentale per il passaggio ReadOnly <-> Editable
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    // 2. SINCRONIZZAZIONE STATO EDITABLE
    useEffect(() => {
        if (editor) {
            editor.setEditable(!readOnly);
        }
    }, [readOnly, editor]);

    const setLink = useCallback(() => {
        const previousUrl = editor?.getAttributes('link').href;
        const url = window.prompt('Inserisci l\'URL del link', previousUrl);
        if (!url) {
            if (url === '') editor?.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    if (!editor) return null;

    if (readOnly) {
        return (
            <div className={twMerge("w-full py-2", className)}>
                <EditorContent editor={editor} />
            </div>
        );
    }

    return (
        <div className="w-full">
            <div
                className={twMerge(
                    'relative rounded-lg p-[1.5px] transition-all duration-300 bg-gray-200 dark:bg-gray-600',
                    'focus-within:bg-gradient-to-br focus-within:from-purple-600 focus-within:to-indigo-700',
                    className
                )}
            >
                <div className="bg-gray-50 dark:bg-gray-700 rounded-[7px] overflow-hidden">
                    <div className="flex flex-wrap gap-1 p-1.5 border-b border-gray-200 dark:border-gray-600 bg-gray-100/50 dark:bg-gray-800/50">
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            active={editor.isActive('bold')}
                            icon={<Bold size={16} />}
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            active={editor.isActive('bulletList')}
                            icon={<List size={16} />}
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            active={editor.isActive('orderedList')}
                            icon={<ListOrdered size={16} />}
                        />
                        <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />
                        <ToolbarButton
                            onClick={setLink}
                            active={editor.isActive('link')}
                            icon={<LinkIcon size={16} />}
                        />
                        {editor.isActive('link') && (
                            <ToolbarButton
                                onClick={() => editor.chain().focus().unsetLink().run()}
                                icon={<Unlink size={16} />}
                            />
                        )}
                    </div>
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
};

const ToolbarButton = ({ onClick, active, icon }: { onClick: () => void; active?: boolean; icon: React.ReactNode }) => (
    <button
        type="button"
        onMouseDown={(e) => {
            e.preventDefault();
            onClick();
        }}
        className={twMerge(
            'p-1.5 rounded transition-all duration-200',
            active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
        )}
    >
        {icon}
    </button>
);

export default RichTextEditor;