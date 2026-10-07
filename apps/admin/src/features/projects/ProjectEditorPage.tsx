import { Info } from 'lucide-react';
import { useState } from 'react';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { useParams } from 'react-router';
import {
  CommercialTypeLabels, ExternalVideoKinds, optionsOf, OwnershipTypeLabels, ProjectContentTypeLabels,
  ProjectLinkKindLabels, ProjectMediaKindLabels, ProjectRoleLabels, ProjectStateLabels, TechnologyGroupLabels,
  type OwnershipType, type ProjectContentType, type ProjectRole, type TechnologyGroup,
} from '@nb/shared';
import { ContentEditorShell, EditorSection, nullable, useContentEditor } from '@/components/content/ContentEditor';
import { SeoFields } from '@/components/content/SeoFields';
import { ChipSelect, Repeater, SlugInput } from '@/components/form/Inputs';
import { RichTextEditor } from '@/components/form/RichTextEditor';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Form';
import { Tabs } from '@/components/ui/Navigation';
import { cn } from '@/lib/cn';
import { useLookups } from '@/lib/content';
import { MediaIdField } from '@/features/media/MediaPicker';
import { DefaultClientCredit, emptyProject, type ProjectInput } from './types';

const tabs = [
  { key: 'info', label: 'Thông tin', fields: ['name', 'slug', 'shortDescription', 'shortResult', 'industryId', 'clientId', 'productId', 'categoryIds', 'coverMediaId', 'thumbnailMediaId', 'startDate', 'endDate', 'launchDate'] },
  { key: 'ownership', label: 'Phân loại & sở hữu', fields: ['primaryContentType', 'contentTypes', 'commercialType', 'projectRoles', 'ownershipType', 'projectOwner', 'publicCreditText', 'nguyenBinhContribution'] },
  { key: 'case', label: 'Case study', fields: ['overview', 'problem', 'requirements', 'solution', 'architecture', 'architectureMediaId', 'challenge', 'challengeSolution', 'result'] },
  { key: 'media', label: 'Media & chức năng', fields: ['features', 'media', 'technologies', 'metrics'] },
  { key: 'links', label: 'Liên kết', fields: ['websiteUrl', 'demoUrl', 'androidUrl', 'iosUrl', 'githubUrl', 'qrMediaId', 'links'] },
  { key: 'seo', label: 'SEO', fields: ['seo'] },
];

const ownershipHelp: Record<OwnershipType, string> = {
  UNDISCLOSED: 'Chưa xác định — dự án KHÔNG thể xuất bản cho tới khi cấu hình.',
  NGUYEN_BINH_OWNED: 'Website được phép ghi "Sản phẩm của Nguyên Bình".',
  CLIENT_OWNED: 'Hiển thị vai trò của Nguyên Bình + câu ghi nhận, không gọi là sản phẩm của Nguyên Bình.',
  CO_OWNED: 'Đồng sở hữu với đối tác/khách hàng — cần câu ghi nhận rõ ràng.',
  PARTNER_OWNED: 'Sản phẩm của đối tác; Nguyên Bình tham gia triển khai/phát triển.',
};

export function ProjectEditorPage() {
  const { id } = useParams();
  const editor = useContentEditor<ProjectInput>(
    { resource: 'projects', permission: 'project', label: 'dự án', listPath: '/projects', empty: emptyProject },
    id === 'new' ? undefined : id,
  );
  const { form, detail } = editor;
  const { register, control, formState: { errors } } = form;
  const lookups = useLookups();
  const [tab, setTab] = useState('info');

  const name = useWatch({ control, name: 'name' });
  const ownership = useWatch({ control, name: 'ownershipType' });
  const roles = useWatch({ control, name: 'projectRoles' });
  const credit = useWatch({ control, name: 'publicCreditText' });
  const folder = `Dự án/${name?.trim() || 'Chưa đặt tên'}`;

  const features = useFieldArray({ control, name: 'features' });
  const media = useFieldArray({ control, name: 'media' });
  const metrics = useFieldArray({ control, name: 'metrics' });
  const links = useFieldArray({ control, name: 'links' });

  const errorTabs = new Set(tabs.filter((t) => t.fields.some((f) => f in errors)).map((t) => t.key));
  const e = errors as Record<string, { message?: string } & Record<string, unknown>>;

  return (
    <ContentEditorShell editor={editor} title={name}>
      <Tabs value={tab} onChange={setTab}
        items={tabs.map((t) => ({
          key: t.key,
          label: <span className="flex items-center gap-1.5">{t.label}{errorTabs.has(t.key) && <span className="size-1.5 rounded-full bg-danger" aria-label="có lỗi" />}</span>,
        }))}>
        <div className="pt-6">
          {tab === 'info' && (
            <>
              <EditorSection title="Thông tin chung" description="Tên, đường dẫn và mô tả ngắn hiển thị trên card dự án.">
                <Field label="Tên dự án" required error={e.name?.message} className="sm:col-span-2">
                  {(a) => <Input {...a} {...register('name', { required: 'Vui lòng nhập tên dự án.' })} />}
                </Field>
                <Field label="Slug" error={e.slug?.message} className="sm:col-span-2">
                  {(a) => <Controller control={control} name="slug" render={({ field }) => (
                    <SlugInput {...a} value={field.value} onChange={field.onChange} source={name ?? ''} prefix="/du-an/"
                      isPublished={detail.data?.meta.status === 'PUBLISHED'} />
                  )} />}
                </Field>
                <Field label="Mô tả ngắn" error={e.shortDescription?.message} className="sm:col-span-2"
                  hint="1–2 câu: khách hàng cần gì, Nguyên Bình làm gì. Bắt buộc khi xuất bản.">
                  {(a) => <Textarea rows={2} {...a} {...register('shortDescription')} />}
                </Field>
                <Field label="Kết quả ngắn (cho card)" error={e.shortResult?.message} className="sm:col-span-2"
                  hint="Chỉ ghi kết quả có thật. Không bịa số liệu doanh thu, người dùng, traffic.">
                  {(a) => <Input {...a} {...register('shortResult')} />}
                </Field>
              </EditorSection>

              <EditorSection title="Khách hàng & ngành">
                <Field label="Ngành" error={e.industryId?.message}>
                  {(a) => (
                    <Select {...a} {...register('industryId', nullable)}>
                      <option value="">— Chọn ngành —</option>
                      {lookups.data?.industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="Khách hàng" error={e.clientId?.message} hint="Chỉ hiển thị khi bật 'Được công bố tên khách hàng'.">
                  {(a) => (
                    <Select {...a} {...register('clientId', nullable)}>
                      <option value="">— Không chọn —</option>
                      {lookups.data?.clients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="Sản phẩm liên quan" error={e.productId?.message} hint="Khi đây là case study triển khai sản phẩm của Nguyên Bình.">
                  {(a) => (
                    <Select {...a} {...register('productId', nullable)}>
                      <option value="">— Không —</option>
                      {lookups.data?.products.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="Tình trạng" error={e.projectState?.message}>
                  {(a) => (
                    <Select {...a} {...register('projectState')}>
                      {optionsOf(ProjectStateLabels).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="Danh mục" className="sm:col-span-2" error={e.categoryIds?.message}>
                  {() => <Controller control={control} name="categoryIds" render={({ field }) => (
                    <ChipSelect label="Danh mục" value={field.value} onChange={field.onChange}
                      options={(lookups.data?.projectCategories ?? []).map((c) => ({ value: c.id, label: c.name }))} />
                  )} />}
                </Field>
              </EditorSection>

              <EditorSection title="Thời gian">
                <Field label="Bắt đầu" error={e.startDate?.message}>{(a) => <Input type="date" {...a} {...register('startDate', nullable)} />}</Field>
                <Field label="Kết thúc" error={e.endDate?.message}>{(a) => <Input type="date" {...a} {...register('endDate', nullable)} />}</Field>
                <Field label="Ra mắt" error={e.launchDate?.message}>{(a) => <Input type="date" {...a} {...register('launchDate', nullable)} />}</Field>
              </EditorSection>

              <EditorSection title="Ảnh đại diện" description="Ảnh giao diện thật (dashboard, website, app). Không dùng ảnh stock.">
                <Field label="Ảnh cover" error={e.coverMediaId?.message}>
                  {() => <Controller control={control} name="coverMediaId" render={({ field }) => (
                    <MediaIdField value={field.value} onChange={field.onChange} folderPath={folder} />)} />}
                </Field>
                <Field label="Thumbnail (card)" error={e.thumbnailMediaId?.message}>
                  {() => <Controller control={control} name="thumbnailMediaId" render={({ field }) => (
                    <MediaIdField value={field.value} onChange={field.onChange} folderPath={folder} />)} />}
                </Field>
              </EditorSection>

              <EditorSection title="Hiển thị">
                <Checkbox label="Dự án nổi bật (trang chủ)" {...register('isFeatured')} />
                <Field label="Thứ tự nổi bật">{(a) => <Input type="number" {...a} {...register('featuredOrder', { valueAsNumber: true })} />}</Field>
                <Field label="Thứ tự trong danh sách">{(a) => <Input type="number" {...a} {...register('sortOrder', { valueAsNumber: true })} />}</Field>
              </EditorSection>
            </>
          )}

          {tab === 'ownership' && (
            <>
              <EditorSection title="Phân loại" description="Loại dự án và mô hình thương mại.">
                <Field label="Loại chính" error={e.primaryContentType?.message}>
                  {(a) => (
                    <Select {...a} {...register('primaryContentType')}>
                      {optionsOf(ProjectContentTypeLabels).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="Mô hình thương mại" error={e.commercialType?.message}>
                  {(a) => (
                    <Select {...a} {...register('commercialType')}>
                      {optionsOf(CommercialTypeLabels).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="Các loại khác" className="sm:col-span-2" error={e.contentTypes?.message}>
                  {() => <Controller control={control} name="contentTypes" render={({ field }) => (
                    <ChipSelect<ProjectContentType> label="Loại dự án" value={field.value} onChange={field.onChange}
                      options={optionsOf(ProjectContentTypeLabels).map((o) => ({
                        ...o, hint: o.value === 'OWN_PRODUCT' ? 'Chỉ dùng khi Nguyên Bình sở hữu sản phẩm' : undefined,
                      }))} />
                  )} />}
                </Field>
              </EditorSection>

              <EditorSection title="Quyền sở hữu & vai trò"
                description="Quan trọng: website không được tự gọi dự án của khách hàng là “Sản phẩm của Nguyên Bình”.">
                <fieldset className="sm:col-span-2">
                  <legend className="mb-2 text-[13px] font-medium">Quyền sở hữu <span className="text-danger">*</span></legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(Object.keys(OwnershipTypeLabels) as OwnershipType[]).map((o) => (
                      <label key={o} className={cn('flex cursor-pointer gap-2.5 rounded-md border p-3',
                        ownership === o ? 'border-primary bg-primary-soft/50' : 'border-border')}>
                        <input type="radio" value={o} className="mt-0.5 accent-primary" {...register('ownershipType')} />
                        <span>
                          <span className="block font-medium">{OwnershipTypeLabels[o]}</span>
                          <span className="block text-xs text-fg-muted">{ownershipHelp[o]}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {e.ownershipType?.message && <p role="alert" className="mt-1.5 text-[13px] text-danger">{e.ownershipType.message}</p>}
                </fieldset>
                <Field label="Vai trò của Nguyên Bình" className="sm:col-span-2" error={e.projectRoles?.message} required>
                  {() => <Controller control={control} name="projectRoles" render={({ field }) => (
                    <ChipSelect<ProjectRole> label="Vai trò" value={field.value} onChange={field.onChange} options={optionsOf(ProjectRoleLabels)} />
                  )} />}
                </Field>
                <Field label="Chủ sở hữu (ghi chú)" error={e.projectOwner?.message} hint="Nội bộ, không hiển thị nếu chưa được phép.">
                  {(a) => <Input {...a} {...register('projectOwner')} />}
                </Field>
                <div />
                <Field label="Câu ghi nhận công khai" className="sm:col-span-2" error={e.publicCreditText?.message}
                  required={ownership !== 'NGUYEN_BINH_OWNED'}
                  hint={ownership !== 'NGUYEN_BINH_OWNED' && !credit ? (
                    <button type="button" className="text-primary hover:underline"
                      onClick={() => form.setValue('publicCreditText', DefaultClientCredit, { shouldDirty: true })}>
                      Dùng câu mẫu: “{DefaultClientCredit}”
                    </button>
                  ) : undefined}>
                  {(a) => <Textarea rows={2} {...a} {...register('publicCreditText')} />}
                </Field>
                <div className="flex gap-2 rounded-md bg-bg-subtle p-3 text-[13px] sm:col-span-2">
                  <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="font-medium">Website sẽ hiển thị:</p>
                    <p className="text-fg-muted">
                      {ownership === 'NGUYEN_BINH_OWNED' ? 'Nhãn “Sản phẩm của Nguyên Bình”' : `Vai trò: ${roles?.map((r) => ProjectRoleLabels[r]).join(', ') || '(chưa chọn)'}`}
                      {ownership !== 'NGUYEN_BINH_OWNED' && credit ? ` — “${credit}”` : ''}
                    </p>
                  </div>
                </div>
              </EditorSection>

              <EditorSection title="Phần đóng góp của Nguyên Bình" description="Phạm vi công việc thực tế đã làm.">
                <div className="sm:col-span-2">
                  <Controller control={control} name="nguyenBinhContribution" render={({ field }) => (
                    <RichTextEditor value={field.value} onChange={field.onChange} folderPath={folder} minHeight={120} />
                  )} />
                </div>
              </EditorSection>

              <EditorSection title="Quyền công bố" description="Chỉ bật những gì khách hàng cho phép công bố.">
                <Checkbox label="Được công bố tên khách hàng" {...register('canShowClient')} />
                <Checkbox label="Được hiển thị logo khách hàng" {...register('canShowClientLogo')} />
                <Checkbox label="Được hiển thị ảnh màn hình" {...register('canShowScreenshots')} />
                <Checkbox label="Được hiển thị số liệu" {...register('canShowMetrics')} />
                <Checkbox label="Được hiển thị công nghệ" {...register('canShowTechnology')} />
                <Checkbox label="Được hiển thị link website/app" {...register('canShowLiveUrl')} />
              </EditorSection>
            </>
          )}

          {tab === 'case' && (
            <>
              {([
                ['overview', 'Tổng quan', 'Bối cảnh dự án.'],
                ['problem', 'Bài toán', 'Khách hàng cần giải quyết vấn đề gì?'],
                ['requirements', 'Yêu cầu', 'Yêu cầu nghiệp vụ / kỹ thuật chính.'],
                ['solution', 'Giải pháp', 'Giải pháp được xây dựng thế nào?'],
                ['architecture', 'Kiến trúc hệ thống', 'Thành phần, công nghệ, tích hợp.'],
                ['challenge', 'Thách thức', 'Khó khăn khi triển khai.'],
                ['challengeSolution', 'Cách giải quyết', 'Đã vượt qua thách thức ra sao.'],
                ['result', 'Kết quả', 'Kết quả có thật. Không dùng câu quảng cáo chung chung.'],
              ] as const).map(([name, title, description]) => (
                <EditorSection key={name} title={title} description={description}>
                  <div className="space-y-3 sm:col-span-2">
                    <Controller control={control} name={name} render={({ field }) => (
                      <RichTextEditor value={field.value} onChange={field.onChange} folderPath={folder} minHeight={110}
                        aria-invalid={!!e[name]} />
                    )} />
                    {name === 'architecture' && (
                      <Field label="Sơ đồ kiến trúc">
                        {() => <Controller control={control} name="architectureMediaId" render={({ field }) => (
                          <MediaIdField value={field.value} onChange={field.onChange} folderPath={folder} />)} />}
                      </Field>
                    )}
                  </div>
                </EditorSection>
              ))}
            </>
          )}

          {tab === 'media' && (
            <>
              <EditorSection title="Chức năng chính" description="Bỏ chọn “Công khai” với chức năng chưa được phép công bố.">
                <div className="sm:col-span-2">
                  <Repeater items={features.fields} addLabel="Thêm chức năng" emptyText="Chưa có chức năng."
                    itemLabel={(_, i) => form.getValues(`features.${i}.title`) || `Chức năng ${i + 1}`}
                    onAdd={() => features.append({ title: '', description: null, icon: null, mediaId: null, isPublic: true })}
                    onRemove={features.remove} onMove={features.move}
                    renderItem={(_, i) => (
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <div className="space-y-2">
                          <Input aria-label="Tên chức năng" placeholder="Tên chức năng" aria-invalid={!!errors.features?.[i]?.title}
                            {...register(`features.${i}.title`)} />
                          {errors.features?.[i]?.title && <p className="text-[13px] text-danger">{errors.features[i]?.title?.message}</p>}
                          <Textarea rows={2} aria-label="Mô tả" placeholder="Mô tả ngắn" {...register(`features.${i}.description`)} />
                          <Checkbox label="Công khai" {...register(`features.${i}.isPublic`)} />
                        </div>
                        <Controller control={control} name={`features.${i}.mediaId`} render={({ field }) => (
                          <MediaIdField value={field.value} onChange={field.onChange} folderPath={folder} compact />)} />
                      </div>
                    )} />
                </div>
              </EditorSection>

              <EditorSection title="Ảnh & video" description="Desktop, mobile, dashboard, before/after, video YouTube/Vimeo, PDF. Kéo lên/xuống để sắp xếp.">
                <div className="sm:col-span-2">
                  <Repeater items={media.fields} addLabel="Thêm media" emptyText="Chưa có ảnh/video."
                    itemLabel={(_, i) => ProjectMediaKindLabels[form.getValues(`media.${i}.kind`)] ?? `Media ${i + 1}`}
                    onAdd={() => media.append({ kind: 'DESKTOP', mediaId: null, externalUrl: null, caption: null, alt: null, groupKey: null, isPublic: true })}
                    onRemove={media.remove} onMove={media.move}
                    renderItem={(_, i) => <MediaRow index={i} folder={folder} />} />
                </div>
              </EditorSection>

              <EditorSection title="Công nghệ">
                <div className="sm:col-span-2">
                  <Controller control={control} name="technologies" render={({ field }) => {
                    const ids = field.value.map((t) => t.technologyId);
                    const groups = new Map<string, { value: string; label: string }[]>();
                    for (const t of lookups.data?.technologies ?? []) {
                      const g = TechnologyGroupLabels[(t.extra ?? 'OTHER') as TechnologyGroup] ?? 'Khác';
                      groups.set(g, [...(groups.get(g) ?? []), { value: t.id, label: t.name }]);
                    }
                    return (
                      <div className="space-y-3">
                        {[...groups.entries()].map(([g, options]) => (
                          <div key={g}>
                            <p className="mb-1.5 text-xs font-medium tracking-wide text-fg-muted uppercase">{g}</p>
                            <ChipSelect label={g} options={options} value={ids.filter((id) => options.some((o) => o.value === id))}
                              onChange={(selected) => {
                                const others = field.value.filter((t) => !options.some((o) => o.value === t.technologyId));
                                const kept = field.value.filter((t) => selected.includes(t.technologyId));
                                const added = selected.filter((s) => !kept.some((k) => k.technologyId === s)).map((technologyId) => ({ technologyId, note: null }));
                                field.onChange([...others, ...kept, ...added]);
                              }} />
                          </div>
                        ))}
                      </div>
                    );
                  }} />
                </div>
              </EditorSection>

              <EditorSection title="Số liệu" description="Chỉ nhập số liệu có thật, được phép công bố. Để trống nếu chưa có.">
                <div className="sm:col-span-2">
                  <Repeater items={metrics.fields} addLabel="Thêm số liệu" emptyText="Chưa có số liệu."
                    itemLabel={(_, i) => form.getValues(`metrics.${i}.label`) || `Số liệu ${i + 1}`}
                    onAdd={() => metrics.append({ label: '', value: '', unit: null, description: null })}
                    onRemove={metrics.remove} onMove={metrics.move}
                    renderItem={(_, i) => (
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Input aria-label="Tên chỉ số" placeholder="Tên chỉ số" {...register(`metrics.${i}.label`)} />
                        <Input aria-label="Giá trị" placeholder="Giá trị" {...register(`metrics.${i}.value`)} />
                        <Input aria-label="Đơn vị" placeholder="Đơn vị" {...register(`metrics.${i}.unit`)} />
                      </div>
                    )} />
                </div>
              </EditorSection>
            </>
          )}

          {tab === 'links' && (
            <>
              <EditorSection title="Liên kết chính" description="Chỉ hiển thị khi bật “Được hiển thị link website/app”.">
                {([
                  ['websiteUrl', 'Website'], ['demoUrl', 'Demo'], ['iosUrl', 'App Store'], ['androidUrl', 'Google Play'], ['githubUrl', 'GitHub'],
                ] as const).map(([n, label]) => (
                  <Field key={n} label={label} error={e[n]?.message}>{(a) => <Input type="url" placeholder="https://" {...a} {...register(n)} />}</Field>
                ))}
                <Field label="Mã QR tải app">
                  {() => <Controller control={control} name="qrMediaId" render={({ field }) => (
                    <MediaIdField value={field.value} onChange={field.onChange} folderPath={folder} compact />)} />}
                </Field>
              </EditorSection>
              <EditorSection title="Liên kết khác">
                <div className="sm:col-span-2">
                  <Repeater items={links.fields} addLabel="Thêm liên kết" emptyText="Chưa có liên kết."
                    itemLabel={(_, i) => form.getValues(`links.${i}.label`) || form.getValues(`links.${i}.url`) || `Liên kết ${i + 1}`}
                    onAdd={() => links.append({ kind: 'OTHER', label: null, url: '' })}
                    onRemove={links.remove} onMove={links.move}
                    renderItem={(_, i) => (
                      <div className="grid gap-2 sm:grid-cols-[160px_1fr_2fr]">
                        <Select aria-label="Loại" {...register(`links.${i}.kind`)}>
                          {optionsOf(ProjectLinkKindLabels).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </Select>
                        <Input aria-label="Nhãn" placeholder="Nhãn" {...register(`links.${i}.label`)} />
                        <Input aria-label="URL" type="url" placeholder="https://" aria-invalid={!!errors.links?.[i]?.url} {...register(`links.${i}.url`)} />
                      </div>
                    )} />
                </div>
              </EditorSection>
            </>
          )}

          {tab === 'seo' && (
            <SeoFields register={register} control={control} folderPath={folder} fallbackTitle={name}
              errors={errors.seo as Record<string, { message?: string }> | undefined} />
          )}
        </div>
      </Tabs>
    </ContentEditorShell>
  );
}

function MediaRow({ index, folder }: { index: number; folder: string }) {
  const { control, register, formState: { errors } } = useFormContext<ProjectInput>();
  const kind = useWatch({ control, name: `media.${index}.kind` });
  const external = ExternalVideoKinds.includes(kind);
  return (
    <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
      <div className="space-y-2">
        <Select aria-label="Loại media" {...register(`media.${index}.kind`)}>
          {optionsOf(ProjectMediaKindLabels).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Checkbox label="Công khai" {...register(`media.${index}.isPublic`)} />
      </div>
      <div className="space-y-2">
        {external ? (
          <Input type="url" aria-label="Link video" placeholder="https://www.youtube.com/watch?v=…"
            aria-invalid={!!errors.media?.[index]?.externalUrl} {...register(`media.${index}.externalUrl`)} />
        ) : (
          <Controller control={control} name={`media.${index}.mediaId`} render={({ field }) => (
            <MediaIdField value={field.value} onChange={field.onChange} folderPath={folder}
              kind={kind === 'PDF' ? 'DOCUMENT' : kind === 'VIDEO' ? 'VIDEO' : 'IMAGE'} compact />)} />
        )}
        {(errors.media?.[index]?.mediaId || errors.media?.[index]?.externalUrl) && (
          <p className="text-[13px] text-danger">{errors.media[index]?.mediaId?.message ?? errors.media[index]?.externalUrl?.message}</p>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <Input aria-label="Chú thích" placeholder="Chú thích" {...register(`media.${index}.caption`)} />
          <Input aria-label="Alt" placeholder="Alt (mô tả ảnh)" {...register(`media.${index}.alt`)} />
        </div>
        {(kind === 'BEFORE' || kind === 'AFTER') && (
          <Input aria-label="Nhóm before/after" placeholder="Mã nhóm ghép cặp before/after (vd: dashboard)" {...register(`media.${index}.groupKey`)} />
        )}
      </div>
    </div>
  );
}
