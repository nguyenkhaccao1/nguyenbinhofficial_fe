import { Controller, useWatch } from 'react-hook-form';
import { useParams } from 'react-router';
import { formatDateTime, type ContentStatus, type SeoMeta } from '@nb/shared';
import { ContentEditorShell, EditorSection, nullable, StatusBadge, useContentEditor } from '@/components/content/ContentEditor';
import { ContentListPage, TitleCell } from '@/components/content/ContentListPage';
import { SeoFields } from '@/components/content/SeoFields';
import { ChipSelect, SlugInput } from '@/components/form/Inputs';
import { RichTextEditor } from '@/components/form/RichTextEditor';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Form';
import { useLookups } from '@/lib/content';
import { MediaIdField } from '@/features/media/MediaPicker';

export interface PostInput {
  title: string;
  slug: string | null;
  excerpt: string | null;
  contentHtml: string | null;
  coverMediaId: string | null;
  authorId: string | null;
  isFeatured: boolean;
  categoryIds: string[];
  primaryCategoryId: string | null;
  tagIds: string[];
  seo: SeoMeta;
}

interface PostListItem {
  id: string;
  title: string;
  slug: string;
  authorName: string | null;
  readingMinutes: number;
  isFeatured: boolean;
  status: ContentStatus;
  publishedAt: string | null;
  updatedAt: string | null;
}

const empty: PostInput = {
  title: '', slug: null, excerpt: null, contentHtml: null, coverMediaId: null, authorId: null, isFeatured: false,
  categoryIds: [], primaryCategoryId: null, tagIds: [], seo: {},
};

export function PostsPage() {
  const lookups = useLookups();
  return (
    <ContentListPage<PostListItem>
      resource="posts" permission="blog" title="Bài viết" label="bài viết" editPath="/blog/posts" defaultSort="-updatedAt"
      filters={[
        { key: 'categoryId', label: 'Danh mục', options: (lookups.data?.postCategories ?? []).map((c) => ({ value: c.id, label: c.name })) },
        { key: 'authorId', label: 'Tác giả', options: (lookups.data?.authors ?? []).map((a) => ({ value: a.id, label: a.name })) },
      ]}
      columns={[
        { id: 'title', header: 'Bài viết', sortKey: 'title', alwaysVisible: true,
          cell: (p) => <TitleCell title={p.title} to={`/blog/posts/${p.id}`} subtitle={`/blog/${p.slug} · ${p.readingMinutes} phút đọc`} /> },
        { id: 'author', header: 'Tác giả', cell: (p) => p.authorName ?? '—' },
        { id: 'status', header: 'Trạng thái', sortKey: 'status', cell: (p) => <StatusBadge status={p.status} /> },
        { id: 'published', header: 'Xuất bản', sortKey: 'publishedAt', cell: (p) => <span className="text-[13px] text-fg-muted">{formatDateTime(p.publishedAt)}</span> },
        { id: 'updated', header: 'Cập nhật', sortKey: 'updatedAt', defaultHidden: true, cell: (p) => formatDateTime(p.updatedAt) },
      ]}
    />
  );
}

export function PostEditorPage() {
  const { id } = useParams();
  const editor = useContentEditor<PostInput>(
    { resource: 'posts', permission: 'blog', label: 'bài viết', listPath: '/blog/posts', empty, autosave: true },
    id === 'new' ? undefined : id,
  );
  const { form, detail } = editor;
  const { register, control, formState: { errors } } = form;
  const lookups = useLookups();
  const title = useWatch({ control, name: 'title' });
  const categoryIds = useWatch({ control, name: 'categoryIds' });
  const slug = useWatch({ control, name: 'slug' });
  const folder = `Blog/${slug || 'chua-dat-ten'}`;
  const e = errors as Record<string, { message?: string }>;

  return (
    <ContentEditorShell editor={editor} title={title}>
      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-5">
          <Field label="Tiêu đề" required error={e.title?.message}>
            {(a) => <Input {...a} className="h-12 text-lg font-semibold" {...register('title', { required: 'Vui lòng nhập tiêu đề.' })} />}
          </Field>
          <Field label="Slug" error={e.slug?.message}>
            {(a) => <Controller control={control} name="slug" render={({ field }) => (
              <SlugInput {...a} value={field.value} onChange={field.onChange} source={title ?? ''} prefix="/blog/"
                isPublished={detail.data?.meta.status === 'PUBLISHED'} />)} />}
          </Field>
          <Field label="Tóm tắt" error={e.excerpt?.message} hint="Hiển thị ở danh sách bài và làm mô tả SEO mặc định.">
            {(a) => <Textarea rows={2} {...a} {...register('excerpt')} />}
          </Field>
          <div>
            <p className="mb-1.5 text-[13px] font-medium">Nội dung</p>
            <Controller control={control} name="contentHtml" render={({ field }) => (
              <RichTextEditor value={field.value} onChange={field.onChange} folderPath={folder} minHeight={420}
                aria-invalid={!!e.contentHtml} placeholder="Viết nội dung bài…" />)} />
            {e.contentHtml?.message && <p className="mt-1 text-[13px] text-danger">{e.contentHtml.message}</p>}
          </div>
        </div>

        <aside className="space-y-5">
          <Field label="Ảnh cover">{() => <Controller control={control} name="coverMediaId" render={({ field }) => (
            <MediaIdField value={field.value} onChange={field.onChange} folderPath={folder} />)} />}</Field>
          <Field label="Tác giả">{(a) => (
            <Select {...a} {...register('authorId', nullable)}>
              <option value="">— Không —</option>
              {lookups.data?.authors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </Select>)}</Field>
          <Field label="Danh mục" error={e.categoryIds?.message}>{() => <Controller control={control} name="categoryIds" render={({ field }) => (
            <ChipSelect label="Danh mục" value={field.value} onChange={field.onChange}
              options={(lookups.data?.postCategories ?? []).map((c) => ({ value: c.id, label: c.name }))} />)} />}</Field>
          {categoryIds?.length > 1 && (
            <Field label="Danh mục chính" error={e.primaryCategoryId?.message}>{(a) => (
              <Select {...a} {...register('primaryCategoryId', nullable)}>
                <option value="">(Danh mục đầu tiên)</option>
                {lookups.data?.postCategories.filter((c) => categoryIds.includes(c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>)}</Field>
          )}
          <Field label="Tag">{() => <Controller control={control} name="tagIds" render={({ field }) => (
            <ChipSelect label="Tag" value={field.value} onChange={field.onChange}
              options={(lookups.data?.tags ?? []).map((t) => ({ value: t.id, label: t.name }))} />)} />}</Field>
          <Checkbox label="Bài nổi bật" {...register('isFeatured')} />
        </aside>
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <EditorSection title="Ghi chú" description="Bản nháp được tự động lưu mỗi 30 giây khi có thay đổi (xem trong Lịch sử phiên bản).">
          <div />
        </EditorSection>
        <SeoFields register={register} control={control} folderPath={folder} fallbackTitle={title}
          errors={errors.seo as Record<string, { message?: string }> | undefined} />
      </div>
    </ContentEditorShell>
  );
}
