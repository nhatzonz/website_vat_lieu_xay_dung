'use client';

import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Undo,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import styles from './RichTextEditor.module.scss';

type UploadResult = { url: string };

/**
 * Trình soạn thảo WYSIWYG (TipTap) cho các trường HTML dài như mô tả sản phẩm.
 * Output là chuỗi HTML — được BE làm sạch (sanitizeContent) khi lưu.
 * Ảnh được upload lên `/admin/upload?kind=content` rồi chèn inline.
 */
export function RichTextEditor({
  value,
  onChange,
  label,
  hint,
  placeholder = 'Nhập nội dung…',
}: {
  value: string;
  onChange: (html: string) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    // Tránh lệch hydration SSR trong Next.js.
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({ inline: false, HTMLAttributes: { loading: 'lazy' } }),
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    editorProps: {
      attributes: { class: styles.content },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  // Đồng bộ khi giá trị ngoài thay đổi (vd. load dữ liệu sản phẩm sau khi mount).
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current && value !== (current === '<p></p>' ? '' : current)) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  const onPickImage = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !editor) return;
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn tệp ảnh.');
        return;
      }
      setUploading(true);
      setError(null);
      try {
        const res = await adminApi.upload<UploadResult>('/admin/upload', file, {
          kind: 'content',
        });
        editor.chain().focus().setImage({ src: res.url, alt: file.name }).run();
      } catch (err) {
        setError(err instanceof AdminApiError ? err.message : 'Tải ảnh lên thất bại.');
      } finally {
        setUploading(false);
      }
    },
    [editor],
  );

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Nhập URL liên kết:', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={styles.wrap}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.editor}>
        <Toolbar
          editor={editor}
          uploading={uploading}
          onImage={() => fileRef.current?.click()}
          onLink={setLink}
        />
        <EditorContent editor={editor} />
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onPickImage}
      />
      {error ? (
        <span className={styles.error}>{error}</span>
      ) : (
        hint && <span className={styles.hint}>{hint}</span>
      )}
    </div>
  );
}

function Toolbar({
  editor,
  uploading,
  onImage,
  onLink,
}: {
  editor: Editor;
  uploading: boolean;
  onImage: () => void;
  onLink: () => void;
}) {
  const btn = (active: boolean) =>
    [styles.tbtn, active ? styles.tbtnOn : ''].filter(Boolean).join(' ');

  return (
    <div className={styles.toolbar}>
      <button
        type="button"
        className={btn(editor.isActive('bold'))}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Đậm"
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        className={btn(editor.isActive('italic'))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Nghiêng"
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        className={btn(editor.isActive('strike'))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Gạch ngang"
      >
        <Strikethrough size={16} />
      </button>
      <span className={styles.sep} />
      <button
        type="button"
        className={btn(editor.isActive('heading', { level: 2 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Tiêu đề 2"
      >
        <Heading2 size={16} />
      </button>
      <button
        type="button"
        className={btn(editor.isActive('heading', { level: 3 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Tiêu đề 3"
      >
        <Heading3 size={16} />
      </button>
      <span className={styles.sep} />
      <button
        type="button"
        className={btn(editor.isActive('bulletList'))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Danh sách chấm"
      >
        <List size={16} />
      </button>
      <button
        type="button"
        className={btn(editor.isActive('orderedList'))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Danh sách số"
      >
        <ListOrdered size={16} />
      </button>
      <button
        type="button"
        className={btn(editor.isActive('blockquote'))}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Trích dẫn"
      >
        <Quote size={16} />
      </button>
      <span className={styles.sep} />
      <button
        type="button"
        className={btn(editor.isActive('link'))}
        onClick={onLink}
        title="Chèn liên kết"
      >
        <LinkIcon size={16} />
      </button>
      <button
        type="button"
        className={btn(false)}
        onClick={onImage}
        disabled={uploading}
        title="Chèn ảnh"
      >
        <ImagePlus size={16} />
      </button>
      <span className={styles.sep} />
      <button
        type="button"
        className={btn(false)}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Hoàn tác"
      >
        <Undo size={16} />
      </button>
      <button
        type="button"
        className={btn(false)}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Làm lại"
      >
        <Redo size={16} />
      </button>
      {uploading && <span className={styles.uploading}>Đang tải ảnh…</span>}
    </div>
  );
}
