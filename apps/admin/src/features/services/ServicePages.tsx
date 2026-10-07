import { Controller, useFieldArray, useWatch } from 'react-hook-form';
import { useParams } from 'react-router';
import { formatDateTime, type ContentStatus, type SeoMeta } from '@nb/shared';
import { ContentEditorShell, EditorSection, nullable, StatusBadge, useContentEditor } from '@/components/content/ContentEditor';
import { ContentListPage, TitleCell } from '@/components/content/ContentListPage';
import { SeoFields } from '@/components/content/SeoFields';
import { ChipSelect, Repeater, SlugInput } from '@/components/form/Inputs';
import { RichTextEditor } from '@/components/form/RichTextEditor';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Form';
import { useLookups } from '@/lib/content';
import { MediaIdField } from '@/features/media/MediaPicker';

export interface ServiceInput {
  name: string;
  slug: string | null;
  categoryId: string | null;
  icon: string | null;
  shortDescription: string | null;
  description: string | null;
  deliverables: string | null;
  process: { title: string; description: string | null; output: string | null }[];
  technologyIds: string[];
  relatedProjectIds: string[];
  coverMediaId: string | null;
  isFeatured: boolean;
  sortOrder: number;
  features: { title: string; description: string | null; icon: string | null }[];
  seo: SeoMeta;
}

interface ServiceListItem {
  id: string;
  name: string;
  slug: string;
  categoryName: string | null;
  shortDescription: string | null;
  isFeatured: boolean;
  sortOrder: number;
  status: ContentStatus;
  updatedAt: string | null;
}

const empty: ServiceInput = {
  name: '', slug: null, categoryId: null, icon: null, shortDescription: null, description: null, deliverables: null,
  process: [], technologyIds: [], relatedProjectIds: [], coverMediaId: null, isFeatured: false, sortOrder: 0, features: [], seo: {},
};

export function ServicesPage() {
  const lookups = useLookups();
  return (
    <ContentListPage<ServiceListItem>
      resource="services" permission="service" title="Dịch vụ" label="dịch vụ" editPath="/services" defaultSort="sortOrder,name"
      description="Mỗi dịch vụ có trang riêng /dich-vu/{slug}, tối ưu SEO theo từng dịch vụ."
      filters={[{ key: 'categoryId', label: 'Nhóm', options: (lookups.data?.serviceCategories ?? []).map((c) => ({ value: c.id, label: c.name })) }]}
      columns={[
        { id: 'name', header: 'Dịch vụ', sortKey: 'name', alwaysVisible: true,
          cell: (s) => <TitleCell title={s.name} to={`/services/${s.id}`} subtitle={s.categoryName ?? `/dich-vu/${s.slug}`} /> },
        { id: 'status', header: 'Trạng thái', sortKey: 'status', cell: (s) => <StatusBadge status={s.status} /> },
        { id: 'order', header: 'Thứ tự', sortKey: 'sortOrder', cell: (s) => s.sortOrder },
        { id: 'updated', header: 'Cập nhật', sortKey: 'updatedAt', cell: (s) => <span className="text-[13px] text-fg-muted">{formatDateTime(s.updatedAt)}</span> },
      ]}
    />
  );
}

export function ServiceEditorPage() {
  const { id } = useParams();
  const editor = useContentEditor<ServiceInput>(
    { resource: 'services', permission: 'service', label: 'dịch vụ', listPath: '/services', empty },
    id === 'new' ? undefined : id,
  );
  const { form, detail } = editor;
  const { register, control, formState: { errors } } = form;
  const lookups = useLookups();
  const name = useWatch({ control, name: 'name' });
  const folder = `Dịch vụ/${name?.trim() || 'Chưa đặt tên'}`;
  const steps = useFieldArray({ control, name: 'process' });
  const features = useFieldArray({ control, name: 'features' });
  const e = errors as Record<string, { message?: string }>;

  return (
    <ContentEditorShell editor={editor} title={name}>
      <EditorSection title="Thông tin chung">
        <Field label="Tên dịch vụ" required error={e.name?.message} className="sm:col-span-2">
          {(a) => <Input {...a} {...register('name', { required: 'Vui lòng nhập tên dịch vụ.' })} />}
        </Field>
        <Field label="Slug" error={e.slug?.message} className="sm:col-span-2">
          {(a) => <Controller control={control} name="slug" render={({ field }) => (
            <SlugInput {...a} value={field.value} onChange={field.onChange} source={name ?? ''} prefix="/dich-vu/"
              isPublished={detail.data?.meta.status === 'PUBLISHED'} />)} />}
        </Field>
        <Field label="Nhóm dịch vụ">{(a) => (
          <Select {...a} {...register('categoryId', nullable)}>
            <option value="">— Không —</option>
            {lookups.data?.serviceCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>)}</Field>
        <Field label="Icon (tên lucide)" hint="vd: code-2, smartphone, plug">{(a) => <Input {...a} {...register('icon')} />}</Field>
        <Field label="Mô tả ngắn" error={e.shortDescription?.message} className="sm:col-span-2">
          {(a) => <Textarea rows={2} {...a} {...register('shortDescription')} />}
        </Field>
        <Field label="Ảnh cover">{() => <Controller control={control} name="coverMediaId" render={({ field }) => (
          <MediaIdField value={field.value} onChange={field.onChange} folderPath={folder} />)} />}</Field>
        <div className="space-y-3">
          <Checkbox label="Dịch vụ nổi bật (trang chủ)" {...register('isFeatured')} />
          <Field label="Thứ tự">{(a) => <Input type="number" {...a} {...register('sortOrder', { valueAsNumber: true })} />}</Field>
        </div>
      </EditorSection>

      <EditorSection title="Nội dung chi tiết" description="Nội dung thật, cụ thể — trang dịch vụ mỏng nội dung sẽ không được xuất bản.">
        <div className="sm:col-span-2">
          <Controller control={control} name="description" render={({ field }) => (
            <RichTextEditor value={field.value} onChange={field.onChange} folderPath={folder} minHeight={220} aria-invalid={!!e.description} />)} />
          {e.description?.message && <p className="mt-1 text-[13px] text-danger">{e.description.message}</p>}
        </div>
      </EditorSection>

      <EditorSection title="Hạng mục / tính năng">
        <div className="sm:col-span-2">
          <Repeater items={features.fields} addLabel="Thêm hạng mục" emptyText="Chưa có hạng mục."
            itemLabel={(_, i) => form.getValues(`features.${i}.title`) || `Hạng mục ${i + 1}`}
            onAdd={() => features.append({ title: '', description: null, icon: null })} onRemove={features.remove} onMove={features.move}
            renderItem={(_, i) => (
              <div className="space-y-2">
                <Input aria-label="Tên hạng mục" placeholder="Tên hạng mục" {...register(`features.${i}.title`)} />
                <Textarea rows={2} aria-label="Mô tả" placeholder="Mô tả" {...register(`features.${i}.description`)} />
              </div>
            )} />
        </div>
      </EditorSection>

      <EditorSection title="Quy trình" description="Mỗi bước nêu rõ đầu ra bàn giao — không mô tả chung chung.">
        <div className="sm:col-span-2">
          <Repeater items={steps.fields} addLabel="Thêm bước" emptyText="Chưa có bước nào." max={12}
            itemLabel={(_, i) => form.getValues(`process.${i}.title`) || `Bước ${i + 1}`}
            onAdd={() => steps.append({ title: '', description: null, output: null })} onRemove={steps.remove} onMove={steps.move}
            renderItem={(_, i) => (
              <div className="grid gap-2 sm:grid-cols-2">
                <Input aria-label="Tên bước" placeholder="Tên bước (vd Discovery)" className="sm:col-span-2" {...register(`process.${i}.title`)} />
                <Textarea rows={2} aria-label="Mô tả" placeholder="Làm gì trong bước này" {...register(`process.${i}.description`)} />
                <Textarea rows={2} aria-label="Đầu ra" placeholder="Đầu ra (vd: tài liệu phạm vi, wireframe)" {...register(`process.${i}.output`)} />
              </div>
            )} />
        </div>
      </EditorSection>

      <EditorSection title="Đầu ra bàn giao">
        <div className="sm:col-span-2">
          <Controller control={control} name="deliverables" render={({ field }) => (
            <RichTextEditor value={field.value} onChange={field.onChange} folderPath={folder} minHeight={100} />)} />
        </div>
      </EditorSection>

      <EditorSection title="Liên kết" description="Công nghệ sử dụng và dự án minh hoạ cho dịch vụ.">
        <Field label="Công nghệ" className="sm:col-span-2">{() => <Controller control={control} name="technologyIds" render={({ field }) => (
          <ChipSelect label="Công nghệ" value={field.value} onChange={field.onChange}
            options={(lookups.data?.technologies ?? []).map((t) => ({ value: t.id, label: t.name }))} />)} />}</Field>
        <Field label="Dự án liên quan" className="sm:col-span-2">{() => <Controller control={control} name="relatedProjectIds" render={({ field }) => (
          <ChipSelect label="Dự án" value={field.value} onChange={field.onChange}
            options={(lookups.data?.projects ?? []).map((p) => ({ value: p.id, label: p.name }))} />)} />}</Field>
      </EditorSection>

      <SeoFields register={register} control={control} folderPath={folder} fallbackTitle={name}
        errors={errors.seo as Record<string, { message?: string }> | undefined} />
    </ContentEditorShell>
  );
}
