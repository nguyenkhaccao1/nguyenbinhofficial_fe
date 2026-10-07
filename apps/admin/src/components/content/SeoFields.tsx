import { Controller, useWatch, type Control, type FieldValues, type Path, type UseFormRegister } from 'react-hook-form';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Form';
import { MediaIdField } from '@/features/media/MediaPicker';
import { EditorSection } from './ContentEditor';

/**
 * Truong SEO chuan cho moi noi dung (muc 27). De trong → website tu sinh tu noi dung / SEO mac dinh.
 * Hien bo dem ky tu de giu tieu de ≤ 60 va mo ta ~150–160 ky tu.
 */
export function SeoFields<T extends FieldValues>({ register, control, errors, folderPath, fallbackTitle }: {
  register: UseFormRegister<T>;
  control: Control<T>;
  errors: Record<string, { message?: string }> | undefined;
  folderPath?: string;
  fallbackTitle?: string;
}) {
  const p = (name: string) => `seo.${name}` as Path<T>;
  const title = useWatch({ control, name: p('title') }) as string | null;
  const description = useWatch({ control, name: p('description') }) as string | null;

  return (
    <EditorSection title="SEO" description="Để trống sẽ tự dùng tên và mô tả ngắn của nội dung.">
      <Field label="Tiêu đề SEO" className="sm:col-span-2" error={errors?.title?.message}
        hint={<Counter value={title} max={60} fallback={fallbackTitle} />}>
        {(a) => <Input {...a} placeholder={fallbackTitle} {...register(p('title'))} />}
      </Field>
      <Field label="Mô tả SEO" className="sm:col-span-2" error={errors?.description?.message}
        hint={<Counter value={description} max={160} />}>
        {(a) => <Textarea rows={2} {...a} {...register(p('description'))} />}
      </Field>
      <Field label="Canonical URL" error={errors?.canonicalUrl?.message} hint="Chỉ điền khi nội dung trùng với trang khác.">
        {(a) => <Input type="url" {...a} {...register(p('canonicalUrl'))} />}
      </Field>
      <Field label="Robots" error={errors?.robots?.message}>
        {(a) => (
          <Select {...a} {...register(p('robots'), { setValueAs: (v) => v || null })}>
            <option value="">Mặc định (index, follow)</option>
            <option value="noindex,follow">noindex, follow</option>
            <option value="index,nofollow">index, nofollow</option>
            <option value="noindex,nofollow">noindex, nofollow</option>
          </Select>
        )}
      </Field>
      <Field label="Tiêu đề khi chia sẻ (OG)" error={errors?.ogTitle?.message}>
        {(a) => <Input {...a} {...register(p('ogTitle'))} />}
      </Field>
      <Field label="Mô tả khi chia sẻ (OG)" error={errors?.ogDescription?.message}>
        {(a) => <Input {...a} {...register(p('ogDescription'))} />}
      </Field>
      <Field label="Ảnh chia sẻ (OG, 1200×630)" error={errors?.ogImageId?.message}>
        {() => <Controller control={control} name={p('ogImageId')} render={({ field }) => (
          <MediaIdField value={field.value as string | null} onChange={field.onChange} folderPath={folderPath} compact />
        )} />}
      </Field>
      <Field label="Ảnh Twitter" error={errors?.twitterImageId?.message}>
        {() => <Controller control={control} name={p('twitterImageId')} render={({ field }) => (
          <MediaIdField value={field.value as string | null} onChange={field.onChange} folderPath={folderPath} compact />
        )} />}
      </Field>
      <Field label="Schema JSON-LD (tuỳ chọn)" className="sm:col-span-2" error={errors?.schemaJson?.message}
        hint="Ghi đè dữ liệu cấu trúc tự sinh. Chỉ dùng khi thực sự cần.">
        {(a) => <Textarea rows={3} className="font-mono text-xs" {...a} {...register(p('schemaJson'))} />}
      </Field>
      <Checkbox className="sm:col-span-2" label="Không đưa vào sitemap.xml" {...register(p('excludeFromSitemap'))} />
    </EditorSection>
  );
}

function Counter({ value, max, fallback }: { value: string | null | undefined; max: number; fallback?: string }) {
  const length = (value ?? '').length;
  if (!length) return <span>{fallback ? `Mặc định: ${fallback}` : `Khuyến nghị ≤ ${max} ký tự.`}</span>;
  return <span className={length > max ? 'text-warning' : undefined}>{length}/{max} ký tự</span>;
}
