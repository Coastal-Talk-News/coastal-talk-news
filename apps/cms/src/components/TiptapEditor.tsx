import type { RichTextContent } from '@coastal-talk-news/types';
import { IMAGE_DEFAULT_WIDTH_PERCENT } from '@coastal-talk-news/validation/limits';
import { Button } from '@coastal-talk-news/ui/button';
import { cn } from '@coastal-talk-news/ui/cn';
import { Input } from '@coastal-talk-news/ui/input';
import { Select } from '@coastal-talk-news/ui/select';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import {
  EditorContent,
  useEditor,
  type Content,
  type Editor,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold as BoldIcon,
  Code as CodeIcon,
  Eye,
  Image as ImageIcon,
  Italic as ItalicIcon,
  Link2 as LinkIcon,
  Link2Off,
  List as ListIcon,
  ListOrdered,
  PenLine,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { MediaPickerDialog } from '../features/media/MediaPickerDialog.js';
import { ImageBar } from './editor/ImageBar.js';
import { FramedImage } from './editor/imageExtension.js';
import { Divider, MOD, ToolbarButton } from './editor/ToolbarButton.js';

interface TiptapEditorProps {
  content: RichTextContent | null;
  onChange: (content: RichTextContent) => void;
  placeholder?: string;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** Levels the reader site styles; its own h1 is the headline. */
type BlockType = 'paragraph' | 'heading2' | 'heading3';

const BLOCK_OPTIONS = [
  { value: 'paragraph' as const, label: 'Paragraph' },
  { value: 'heading2' as const, label: 'Section heading' },
  { value: 'heading3' as const, label: 'Subheading' },
];

function currentBlock(editor: Editor): BlockType {
  if (editor.isActive('heading', { level: 2 })) return 'heading2';
  if (editor.isActive('heading', { level: 3 })) return 'heading3';
  return 'paragraph';
}

function setBlock(editor: Editor, value: BlockType) {
  const chain = editor.chain().focus();
  if (value === 'paragraph') {
    chain.setParagraph().run();
    return;
  }
  chain.setHeading({ level: value === 'heading2' ? 2 : 3 }).run();
}

const ALIGNMENTS = [
  { value: 'left', label: 'Align left', icon: AlignLeft, shortcut: 'Shift L' },
  {
    value: 'center',
    label: 'Align centre',
    icon: AlignCenter,
    shortcut: 'Shift E',
  },
  {
    value: 'right',
    label: 'Align right',
    icon: AlignRight,
    shortcut: 'Shift R',
  },
  {
    value: 'justify',
    label: 'Justify',
    icon: AlignJustify,
    shortcut: 'Shift J',
  },
];

/**
 * A row rather than a browser prompt: the URL stays visible while it is being
 * checked, an existing link can be edited in place, and removing one doesn't
 * mean clearing a box and guessing what an empty value will do.
 */
function LinkBar({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const active = editor.isActive('link');
  const [url, setUrl] = useState(
    () => (editor.getAttributes('link').href as string | undefined) ?? '',
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function apply() {
    const href = url.trim();
    if (!href) return;
    const { from, to } = editor.state.selection;
    if (from === to && !active) {
      // Nothing is selected, so there is no text to carry the mark: the link
      // becomes its own text rather than silently doing nothing.
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: href,
          marks: [{ type: 'link', attrs: { href } }],
        })
        .run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    onClose();
  }

  return (
    <div className="border-hairline bg-surface-sunken flex items-center gap-2 border-b px-2 py-2">
      <div className="max-w-sm flex-1">
        <Input
          ref={inputRef}
          value={url}
          placeholder="https://"
          aria-label="Link URL"
          icon={<LinkIcon className="size-4" aria-hidden />}
          className="h-9"
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              apply();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              onClose();
            }
          }}
        />
      </div>
      <Button type="button" size="sm" onClick={apply} disabled={!url.trim()}>
        {active ? 'Update' : 'Add link'}
      </Button>
      {active && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            onClose();
          }}
        >
          <Link2Off className="size-4" aria-hidden />
          Remove
        </Button>
      )}
      <Button type="button" size="sm" variant="ghost" onClick={onClose}>
        Cancel
      </Button>
    </div>
  );
}

function ModeSwitch({
  preview,
  onChange,
}: {
  preview: boolean;
  onChange: (preview: boolean) => void;
}) {
  const modes = [
    { value: false, label: 'Write', icon: PenLine },
    { value: true, label: 'Preview', icon: Eye },
  ];

  return (
    <div className="bg-surface-sunken flex shrink-0 gap-0.5 rounded-md p-0.5">
      {modes.map((mode) => (
        <button
          key={mode.label}
          type="button"
          aria-pressed={preview === mode.value}
          onClick={() => onChange(mode.value)}
          className={cn(
            'flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors',
            preview === mode.value
              ? 'bg-surface text-ink shadow-sm'
              : 'text-ink-muted hover:text-ink',
          )}
        >
          <mode.icon className="size-3.5" aria-hidden />
          {mode.label}
        </button>
      ))}
    </div>
  );
}

function Toolbar({
  editor,
  preview,
  onPreviewChange,
}: {
  editor: Editor;
  preview: boolean;
  onPreviewChange: (preview: boolean) => void;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <div className="border-hairline flex items-start gap-2 border-b px-2 py-1.5">
        <div className="flex flex-1 flex-wrap items-center gap-0.5">
          {preview ? (
            <span className="text-ink-subtle px-1 text-xs">
              How this will read on the website
            </span>
          ) : (
            <>
              <Select
                value={currentBlock(editor)}
                onValueChange={(value: BlockType) => setBlock(editor, value)}
                options={BLOCK_OPTIONS}
                size="sm"
                aria-label="Text style"
                className="mr-1 w-40"
              />

              <ToolbarButton
                label="Bold"
                shortcut={`${MOD} B`}
                active={editor.isActive('bold')}
                onClick={() => editor.chain().focus().toggleBold().run()}
              >
                <BoldIcon className="size-4" aria-hidden />
              </ToolbarButton>
              <ToolbarButton
                label="Italic"
                shortcut={`${MOD} I`}
                active={editor.isActive('italic')}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                <ItalicIcon className="size-4" aria-hidden />
              </ToolbarButton>
              <ToolbarButton
                label="Underline"
                shortcut={`${MOD} U`}
                active={editor.isActive('underline')}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
              >
                <UnderlineIcon className="size-4" aria-hidden />
              </ToolbarButton>
              <ToolbarButton
                label="Strikethrough"
                active={editor.isActive('strike')}
                onClick={() => editor.chain().focus().toggleStrike().run()}
              >
                <Strikethrough className="size-4" aria-hidden />
              </ToolbarButton>

              <Divider />

              {ALIGNMENTS.map((alignment) => (
                <ToolbarButton
                  key={alignment.value}
                  label={alignment.label}
                  shortcut={`${MOD} ${alignment.shortcut}`}
                  active={editor.isActive({ textAlign: alignment.value })}
                  onClick={() =>
                    editor.chain().focus().setTextAlign(alignment.value).run()
                  }
                >
                  <alignment.icon className="size-4" aria-hidden />
                </ToolbarButton>
              ))}

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
                onClick={() => setLinkOpen((open) => !open)}
              >
                <LinkIcon className="size-4" aria-hidden />
              </ToolbarButton>
              <ToolbarButton label="Image" onClick={() => setPickerOpen(true)}>
                <ImageIcon className="size-4" aria-hidden />
              </ToolbarButton>
              <ToolbarButton
                label="Inline code"
                active={editor.isActive('code')}
                onClick={() => editor.chain().focus().toggleCode().run()}
              >
                <CodeIcon className="size-4" aria-hidden />
              </ToolbarButton>

              <Divider />

              <ToolbarButton
                label="Undo"
                shortcut={`${MOD} Z`}
                disabled={!editor.can().undo()}
                onClick={() => editor.chain().focus().undo().run()}
              >
                <Undo2 className="size-4" aria-hidden />
              </ToolbarButton>
              <ToolbarButton
                label="Redo"
                shortcut={`${MOD} Shift Z`}
                disabled={!editor.can().redo()}
                onClick={() => editor.chain().focus().redo().run()}
              >
                <Redo2 className="size-4" aria-hidden />
              </ToolbarButton>
            </>
          )}
        </div>

        <ModeSwitch preview={preview} onChange={onPreviewChange} />
      </div>

      {linkOpen && !preview && (
        <LinkBar editor={editor} onClose={() => setLinkOpen(false)} />
      )}
      {!preview && editor.isActive('image') && <ImageBar editor={editor} />}

      <MediaPickerDialog
        open={pickerOpen}
        selectedId={null}
        onOpenChange={setPickerOpen}
        onSelect={(asset) => {
          if (asset) {
            editor
              .chain()
              .focus()
              .insertContent({
                type: 'image',
                attrs: {
                  mediaId: asset.id,
                  src: asset.url,
                  naturalWidth: asset.width,
                  naturalHeight: asset.height,
                  widthPercent: IMAGE_DEFAULT_WIDTH_PERCENT,
                  placement: 'center',
                },
              })
              .run();
          }
          setPickerOpen(false);
        }}
      />
    </>
  );
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = 'Start writing your article content here…',
}: TiptapEditorProps) {
  const [preview, setPreview] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true },
      }),
      FramedImage,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: (content ?? '') as Content,
    onUpdate: ({ editor }) => onChange(editor.getJSON() as RichTextContent),
    // The toolbar reflects wherever the cursor is, so it has to re-render on a
    // selection change and not only when the document itself changes.
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class:
          'tiptap-content text-ink min-h-48 flow-root px-4 py-3 text-sm focus:outline-none',
      },
    },
  });

  useEffect(() => {
    // A destroyed editor still satisfies the null check but throws from
    // every command getter — React remounts this effect when the tree is
    // hidden and reconnected, which can happen after Tiptap has torn down.
    if (!editor || editor.isDestroyed) return;
    const next = (content ?? '') as Content;
    const current = editor.getJSON();
    if (JSON.stringify(current) !== JSON.stringify(next)) {
      // Deferred: picture nodes render as React components, and React refuses
      // the synchronous flush the editor does when they are created mid-effect.
      queueMicrotask(() => {
        if (!editor.isDestroyed) {
          editor.commands.setContent(next, { emitUpdate: false });
          // ProseMirror maps the old selection through the new document by
          // position; on a full content swap that can land it inside an
          // image, which selects it and pops the image toolbar open with
          // nobody having clicked anything.
          editor.commands.setTextSelection(0);
        }
      });
    }
  }, [editor, content]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    // The second argument matters: setEditable emits an update by default,
    // which reports the editor's own content back to the form as an edit —
    // and on a saved article that fires before the loaded body has been put
    // in, so the form would overwrite the article with an empty document.
    editor.setEditable(!preview, false);
    // Picture nodes draw their controls from the editable flag, and setEditable
    // without an update announces nothing they could react to.
    editor.view.dispatch(editor.state.tr);
  }, [editor, preview]);

  if (!editor) return null;

  return (
    <div className="ring-hairline focus-within:ring-accent overflow-hidden rounded-lg ring-1 transition-shadow focus-within:ring-2">
      <Toolbar editor={editor} preview={preview} onPreviewChange={setPreview} />
      {/* Preview borrows the reader site's serif and line height so the copy
          is judged the way it will be read, not in the editor's own UI font. */}
      <div
        className={cn(
          preview &&
            '[&_.ProseMirror]:font-article [&_.ProseMirror]:text-[1.125rem] [&_.ProseMirror]:leading-[1.8]',
        )}
      >
        <EditorContent editor={editor} />
      </div>
      <div className="text-ink-subtle border-hairline flex justify-end gap-3 border-t px-4 py-1.5 text-xs tabular-nums">
        <span>Words: {countWords(editor.getText())}</span>
        <span>Characters: {editor.getText().length}</span>
      </div>
    </div>
  );
}
