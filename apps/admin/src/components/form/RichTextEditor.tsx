import Image from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extensions';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Quote, Redo2, Underline, Undo2, Unlink,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { MediaPickerDialog } from '@/features/media/MediaPicker';

interface RichTextEditorProps {
  value: string | null | undefined;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Thu muc media khi tai anh tu trong editor (vd "Blog/ten-bai-viet"). */
  folderPath?: string;
  minHeight?: number;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  disabled?: boolean;
}

/** Soan thao rich text (HTML). Backend van sanitize lai truoc khi luu. */
export function RichTextEditor({ value, onChange, placeholder, folderPath, minHeight = 180, disabled, ...aria }: RichTextEditorProps) {
  const [picking, setPicking] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer' } },
      }),
      Image.configure({ HTMLAttributes: { loading: 'lazy' } }),
      Placeholder.configure({ placeholder: placeholder ?? 'Nhập nội dung…' }),
    ],
    content: value ?? '',
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose-admin focus:outline-none px-3 py-2.5',
        style: `min-height:${minHeight}px`,
        ...(aria.id ? { id: aria.id } : {}),
        ...(aria['aria-describedby'] ? { 'aria-describedby': aria['aria-describedby'] } : {}),
        'aria-multiline': 'true',
        role: 'textbox',
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  });

  // Dong bo khi gia tri ben ngoai doi (tai ban ghi, khoi phuc phien ban).
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? '' : editor.getHTML();
    if ((value ?? '') !== current) editor.commands.setContent(value ?? '', { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => editor?.setEditable(!disabled), [editor, disabled]);

  return (
    <div className={cn('rounded-md border border-border bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15',
      aria['aria-invalid'] && 'border-danger')}>
      {editor && !disabled && <Toolbar editor={editor} onImage={() => setPicking(true)} />}
      <EditorContent editor={editor} />
      {picking && (
        <MediaPickerDialog
          folderPath={folderPath}
          onClose={() => setPicking(false)}
          onPick={(m) => {
            setPicking(false);
            if (m.url) editor?.chain().focus().setImage({ src: m.url, alt: m.alt ?? '' }).run();
          }}
        />
      )}
    </div>
  );
}

function Toolbar({ editor, onImage }: { editor: Editor; onImage: () => void }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      link: e.isActive('link'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Địa chỉ liên kết (https://… hoặc /duong-dan)', previous ?? 'https://');
    if (url === null) return;
    if (url.trim() === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  return (
    <div role="toolbar" aria-label="Định dạng văn bản" className="flex flex-wrap gap-0.5 border-b border-border bg-bg-subtle/60 p-1">
      <Tool label="Đậm" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}><Bold /></Tool>
      <Tool label="Nghiêng" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic /></Tool>
      <Tool label="Gạch chân" active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}><Underline /></Tool>
      <Divider />
      <Tool label="Tiêu đề H2" active={state.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 /></Tool>
      <Tool label="Tiêu đề H3" active={state.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 /></Tool>
      <Tool label="Danh sách" active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()}><List /></Tool>
      <Tool label="Danh sách số" active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered /></Tool>
      <Tool label="Trích dẫn" active={state.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote /></Tool>
      <Divider />
      <Tool label="Chèn liên kết" active={state.link} onClick={setLink}><Link2 /></Tool>
      {state.link && <Tool label="Bỏ liên kết" onClick={() => editor.chain().focus().unsetLink().run()}><Unlink /></Tool>}
      <Tool label="Chèn ảnh" onClick={onImage}><ImagePlus /></Tool>
      <Divider />
      <Tool label="Hoàn tác" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}><Undo2 /></Tool>
      <Tool label="Làm lại" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}><Redo2 /></Tool>
    </div>
  );
}

function Tool({ label, active, disabled, onClick, children }: {
  label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode;
}) {
  return (
    <button type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className={cn('grid size-8 place-items-center rounded text-fg/80 hover:bg-white disabled:opacity-40 [&>svg]:size-4',
        active && 'bg-white text-primary shadow-sm')}>
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 my-1 w-px bg-border" aria-hidden />;
}
