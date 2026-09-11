import type { ArticleContent } from '@coastal-talk-news/types';
import { cn } from '@coastal-talk-news/ui/cn';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  EditorContent,
  useEditor,
  type Content,
  type Editor,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold as BoldIcon,
  Code as CodeIcon,
  Image as ImageIcon,
  Italic as ItalicIcon,
  Link2 as LinkIcon,
  List as ListIcon,
  ListOrdered,
  Quote,
  Underline as UnderlineIcon,
} from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface TiptapEditorProps {
  content: ArticleContent | null;
  onChange: (content: ArticleContent) => void;
  placeholder?: string;
}

function ToolbarButton({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'grid size-8 place-items-center rounded-md transition-colors',
        active
          ? 'bg-accent-soft text-accent-text'
          : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="bg-hairline mx-1 h-5 w-px" aria-hidden />;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function Toolbar({ editor }: { editor: Editor }) {
  function setLink() {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previous ?? 'https://');
    if (url === null) return;
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }

  function insertImage() {
    const url = window.prompt('Image URL');
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }

  return (
    <div className="border-hairline flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
      <ToolbarButton
        label="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon className="size-4" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon className="size-4" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-4" aria-hidden />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListIcon className="size-4" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Quote"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4" aria-hidden />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="Link"
        active={editor.isActive('link')}
        onClick={setLink}
      >
        <LinkIcon className="size-4" aria-hidden />
      </ToolbarButton>
      <ToolbarButton label="Image" onClick={insertImage}>
        <ImageIcon className="size-4" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Inline code"
        active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <CodeIcon className="size-4" aria-hidden />
      </ToolbarButton>
    </div>
  );
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = 'Start writing your article content here…',
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true },
      }),
      ImageExtension,
      Placeholder.configure({ placeholder }),
    ],
    content: (content ?? '') as Content,
    onUpdate: ({ editor }) => onChange(editor.getJSON() as ArticleContent),
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-48 px-4 py-3 text-ink focus:outline-none [&_p]:my-2',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = (content ?? '') as Content;
    const current = editor.getJSON();
    if (JSON.stringify(current) !== JSON.stringify(next)) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, content]);

  if (!editor) return null;

  return (
    <div className="ring-hairline focus-within:ring-accent overflow-hidden rounded-lg ring-1 transition-shadow focus-within:ring-2">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <div className="text-ink-subtle border-hairline flex justify-end gap-3 border-t px-4 py-1.5 text-xs tabular-nums">
        <span>Words: {countWords(editor.getText())}</span>
        <span>Characters: {editor.getText().length}</span>
      </div>
    </div>
  );
}
