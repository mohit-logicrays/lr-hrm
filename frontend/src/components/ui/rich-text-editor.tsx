"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write team description...",
  className = "",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "min-h-[70px] max-h-[140px] overflow-y-auto p-2.5 text-xs text-text-primary focus:outline-none leading-relaxed [&_h2]:text-sm [&_h2]:font-bold [&_h2]:font-heading [&_h2]:text-text-primary [&_h2]:my-1 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:font-heading [&_h3]:text-text-primary [&_h3]:my-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1 [&_blockquote]:border-l-2 [&_blockquote]:border-brand [&_blockquote]:pl-2 [&_blockquote]:italic [&_blockquote]:my-1 [&_code]:bg-surface-subtle [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-brand [&_strong]:font-bold [&_strong]:text-text-primary [&_em]:italic",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync value if external value changes (e.g. switching teams to edit)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "rounded-md border border-border-base bg-surface shadow-2xs overflow-hidden transition-colors focus-within:border-brand",
        className
      )}
    >
      {/* Tiptap Toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap bg-surface-subtle/80 border-b border-border-base p-1 text-text-secondary">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "p-1 rounded-xs hover:bg-surface hover:text-text-primary transition-colors",
            editor.isActive("bold") && "bg-brand text-white font-bold hover:bg-brand"
          )}
          title="Bold"
        >
          <Bold className="h-3 w-3" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "p-1 rounded-xs hover:bg-surface hover:text-text-primary transition-colors",
            editor.isActive("italic") && "bg-brand text-white font-bold hover:bg-brand"
          )}
          title="Italic"
        >
          <Italic className="h-3 w-3" />
        </button>

        <div className="h-3 w-px bg-border-base mx-0.5" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "p-1 rounded-xs hover:bg-surface hover:text-text-primary transition-colors",
            editor.isActive("heading", { level: 2 }) && "bg-brand text-white font-bold hover:bg-brand"
          )}
          title="Heading"
        >
          <Heading2 className="h-3 w-3" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "p-1 rounded-xs hover:bg-surface hover:text-text-primary transition-colors",
            editor.isActive("bulletList") && "bg-brand text-white font-bold hover:bg-brand"
          )}
          title="Bullet List"
        >
          <List className="h-3 w-3" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "p-1 rounded-xs hover:bg-surface hover:text-text-primary transition-colors",
            editor.isActive("orderedList") && "bg-brand text-white font-bold hover:bg-brand"
          )}
          title="Numbered List"
        >
          <ListOrdered className="h-3 w-3" />
        </button>

        <div className="h-3 w-px bg-border-base mx-0.5" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            "p-1 rounded-xs hover:bg-surface hover:text-text-primary transition-colors",
            editor.isActive("blockquote") && "bg-brand text-white font-bold hover:bg-brand"
          )}
          title="Quote"
        >
          <Quote className="h-3 w-3" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={cn(
            "p-1 rounded-xs hover:bg-surface hover:text-text-primary transition-colors",
            editor.isActive("code") && "bg-brand text-white font-bold hover:bg-brand"
          )}
          title="Code"
        >
          <Code className="h-3 w-3" />
        </button>

        <div className="h-3 w-px bg-border-base mx-0.5 ml-auto" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1 rounded-xs hover:bg-surface hover:text-text-primary disabled:opacity-30 transition-colors"
          title="Undo"
        >
          <Undo className="h-3 w-3" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1 rounded-xs hover:bg-surface hover:text-text-primary disabled:opacity-30 transition-colors"
          title="Redo"
        >
          <Redo className="h-3 w-3" />
        </button>
      </div>

      {/* Editor Content Box */}
      <EditorContent editor={editor} />
    </div>
  );
}

/** Rich Text HTML Renderer for Card & Roster Detail views */
export function RichTextViewer({
  content,
  className = "",
}: {
  content?: string | null;
  className?: string;
}) {
  if (!content || !content.trim()) {
    return <span className="text-text-tertiary italic">No description provided.</span>;
  }

  return (
    <div
      className={cn(
        "rich-text-content text-xs text-text-secondary leading-relaxed [&_h2]:text-sm [&_h2]:font-bold [&_h2]:font-heading [&_h2]:text-text-primary [&_h2]:my-1 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:font-heading [&_h3]:text-text-primary [&_h3]:my-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1 [&_blockquote]:border-l-2 [&_blockquote]:border-brand [&_blockquote]:pl-2 [&_blockquote]:italic [&_blockquote]:my-1 [&_code]:bg-surface-subtle [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-brand [&_strong]:font-semibold [&_strong]:text-text-primary [&_em]:italic",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
