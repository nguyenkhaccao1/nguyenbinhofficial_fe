import { useState } from 'react';
import { Controller, useFieldArray, useWatch } from 'react-hook-form';
import { useParams } from 'react-router';
import {
  BillingPeriodLabels, CommercialTypeLabels, formatDateTime, optionsOf, OwnershipTypeLabels, ProductTypeLabels,
  ProjectMediaKindLabels, type BillingPeriod, type CommercialType, type ContentStatus, type OwnershipType,
  type ProductType, type ProjectMediaKind, type SeoMeta,
} from '@nb/shared';
import { ContentEditorShell, EditorSection, nullable, StatusBadge, useContentEditor } from '@/components/content/ContentEditor';
import { ContentListPage, TitleCell } from '@/components/content/ContentListPage';
import { SeoFields } from '@/components/content/SeoFields';
import { Repeater, SlugInput, StringListInput } from '@/components/form/Inputs';
import { RichTextEditor } from '@/components/form/RichTextEditor';
import { Badge } from '@/components/ui/Feedback';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Form';
import { Tabs } from '@/components/ui/Navigation';
import { useLookups } from '@/lib/content';
import { MediaIdField } from '@/features/media/MediaPicker';

export interface ProductInput {
  name: string;
  slug: string | null;
  tagline: string | null;
  shortDescription: string | null;
  description: string | null;
  categoryId: string | null;
  productType: ProductType;
  commercialType: CommercialType;
  ownershipType: OwnershipType;
  problem: string | null;
  solution: string | null;
  targetUsers: string | null;
  integration: string | null;
  deployment: string | null;
  security: string | null;
  logoMediaId: string | null;
  heroMediaId: string | null;
  demoVideoUrl: string | null;
  demoUrl: string | null;
  pricingNote: string | null;
  isFeatured: boolean;
  sortOrder: number;
  features: { title: string; description: string | null; icon: string | null; mediaId: string | null; group: string | null }[];
  modules: { name: string; description: string | null; icon: string | null; mediaId: string | null; items: string[] }[];
  media: { kind: ProjectMediaKind; mediaId: string | null; externalUrl: string | null; caption: string | null; alt: string | null; groupKey: string | null }[];
  plans: {
    name: string; priceAmount: number | null; currency: string; billingPeriod: BillingPeriod; priceNote: string | null;
    features: string[]; isHighlighted: boolean; ctaLabel: string | null; ctaUrl: string | null;
  }[];
  faqs: { question: string; answer: string }[];
  seo: SeoMeta;
}

interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  productType: ProductType;
  commercialType: CommercialType;
  ownershipType: OwnershipType;
  categoryName: string | null;
  isFeatured: boolean;
  sortOrder: number;
  status: ContentStatus;
  updatedAt: string | null;
}

const empty: ProductInput = {
  name: '', slug: null, tagline: null, shortDescription: null, description: null, categoryId: null, productType: 'OTHER',
  commercialType: 'FOR_SALE', ownershipType: 'NGUYEN_BINH_OWNED', problem: null, solution: null, targetUsers: null,
  integration: null, deployment: null, security: null, logoMediaId: null, heroMediaId: null, demoVideoUrl: null,
  demoUrl: null, pricingNote: null, isFeatured: false, sortOrder: 0, features: [], modules: [], media: [], plans: [],
  faqs: [], seo: {},
};

export function ProductsPage() {
  return (
    <ContentListPage<ProductListItem>
      resource="products" permission="product" title="Sản phẩm" label="sản phẩm" editPath="/products" defaultSort="sortOrder,name"
      description="Phần mềm Nguyên Bình sở hữu/kinh doanh — mỗi sản phẩm có landing page riêng /san-pham/{slug}."
      filters={[{ key: 'productType', label: 'Loại', options: optionsOf(ProductTypeLabels) }]}
      columns={[
        { id: 'name', header: 'Sản phẩm', sortKey: 'name', alwaysVisible: true,
          cell: (p) => <TitleCell title={p.name} to={`/products/${p.id}`} subtitle={p.tagline ?? `/san-pham/${p.slug}`} /> },
        { id: 'type', header: 'Loại', cell: (p) => <Badge>{ProductTypeLabels[p.productType]}</Badge> },
        { id: 'commercial', header: 'Thương mại', cell: (p) => <span className="text-[13px]">{CommercialTypeLabels[p.commercialType]}</span> },
        { id: 'status', header: 'Trạng thái', sortKey: 'status', cell: (p) => <StatusBadge status={p.status} /> },
        { id: 'updated', header: 'Cập nhật', sortKey: 'updatedAt', cell: (p) => <span className="text-[13px] text-fg-muted">{formatDateTime(p.updatedAt)}</span> },
      ]}
    />
  );
}

const tabs = [
  { key: 'info', label: 'Thông tin' },
  { key: 'content', label: 'Nội dung' },
  { key: 'features', label: 'Tính năng & module' },
  { key: 'media', label: 'Màn hình & video' },
  { key: 'pricing', label: 'Bảng giá' },
  { key: 'faq', label: 'FAQ' },
  { key: 'seo', label: 'SEO' },
];

export function ProductEditorPage() {
  const { id } = useParams();
  const editor = useContentEditor<ProductInput>(
    { resource: 'products', permission: 'product', label: 'sản phẩm', listPath: '/products', empty },
    id === 'new' ? undefined : id,
  );
  const { form, detail } = editor;
  const { register, control, formState: { errors } } = form;
  const lookups = useLookups();
  const [tab, setTab] = useState('info');
  const name = useWatch({ control, name: 'name' });
  const folder = `Sản phẩm/${name?.trim() || 'Chưa đặt tên'}`;
  const features = useFieldArray({ control, name: 'features' });
  const modules = useFieldArray({ control, name: 'modules' });
  const media = useFieldArray({ control, name: 'media' });
  const plans = useFieldArray({ control, name: 'plans' });
  const faqs = useFieldArray({ control, name: 'faqs' });
  const e = errors as Record<string, { message?: string }>;

  return (
    <ContentEditorShell editor={editor} title={name}>
      <Tabs items={tabs} value={tab} onChange={setTab}>
        <div className="pt-6">
          {tab === 'info' && (
            <>
              <EditorSection title="Thông tin chung" description="Hiển thị ở hero của landing page sản phẩm.">
                <Field label="Tên sản phẩm" required error={e.name?.message} className="sm:col-span-2">
                  {(a) => <Input {...a} {...register('name', { required: 'Vui lòng nhập tên sản phẩm.' })} />}
                </Field>
                <Field label="Slug" error={e.slug?.message} className="sm:col-span-2">
                  {(a) => <Controller control={control} name="slug" render={({ field }) => (
                    <SlugInput {...a} value={field.value} onChange={field.onChange} source={name ?? ''} prefix="/san-pham/"
                      isPublished={detail.data?.meta.status === 'PUBLISHED'} />)} />}
                </Field>
                <Field label="Thông điệp chính (tagline)" error={e.tagline?.message} className="sm:col-span-2">
                  {(a) => <Input {...a} {...register('tagline')} />}
                </Field>
                <Field label="Mô tả ngắn" error={e.shortDescription?.message} className="sm:col-span-2">
                  {(a) => <Textarea rows={2} {...a} {...register('shortDescription')} />}
                </Field>
              </EditorSection>
              <EditorSection title="Phân loại">
                <Field label="Loại sản phẩm">{(a) => (
                  <Select {...a} {...register('productType')}>
                    {optionsOf(ProductTypeLabels).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>)}</Field>
                <Field label="Danh mục">{(a) => (
                  <Select {...a} {...register('categoryId', nullable)}>
                    <option value="">— Không —</option>
                    {lookups.data?.productCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>)}</Field>
                <Field label="Mô hình thương mại">{(a) => (
                  <Select {...a} {...register('commercialType')}>
                    {optionsOf(CommercialTypeLabels).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>)}</Field>
                <Field label="Quyền sở hữu">{(a) => (
                  <Select {...a} {...register('ownershipType')}>
                    {optionsOf(OwnershipTypeLabels).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>)}</Field>
              </EditorSection>
              <EditorSection title="Hình ảnh & demo">
                <Field label="Logo">{() => <Controller control={control} name="logoMediaId" render={({ field }) => (
                  <MediaIdField value={field.value} onChange={field.onChange} folderPath={folder} />)} />}</Field>
                <Field label="Ảnh hero">{() => <Controller control={control} name="heroMediaId" render={({ field }) => (
                  <MediaIdField value={field.value} onChange={field.onChange} folderPath={folder} />)} />}</Field>
                <Field label="Video demo (YouTube/Vimeo)" error={e.demoVideoUrl?.message}>
                  {(a) => <Input type="url" {...a} {...register('demoVideoUrl')} />}</Field>
                <Field label="Link dùng thử / demo" error={e.demoUrl?.message}>{(a) => <Input type="url" {...a} {...register('demoUrl')} />}</Field>
              </EditorSection>
              <EditorSection title="Hiển thị">
                <Checkbox label="Sản phẩm nổi bật (trang chủ)" {...register('isFeatured')} />
                <Field label="Thứ tự">{(a) => <Input type="number" {...a} {...register('sortOrder', { valueAsNumber: true })} />}</Field>
              </EditorSection>
            </>
          )}

          {tab === 'content' && (
            ([
              ['description', 'Giới thiệu', 'Mô tả tổng quan sản phẩm.'],
              ['problem', 'Vấn đề', 'Khách hàng đang gặp khó khăn gì?'],
              ['solution', 'Giải pháp', 'Sản phẩm giải quyết thế nào?'],
              ['targetUsers', 'Đối tượng sử dụng', 'Loại hình doanh nghiệp phù hợp.'],
              ['integration', 'Tích hợp', 'Kết nối với hệ thống nào.'],
              ['deployment', 'Triển khai', 'Cloud / tại chỗ, thời gian triển khai.'],
              ['security', 'Bảo mật', 'Phân quyền, sao lưu, bảo mật dữ liệu.'],
            ] as const).map(([n, title, description]) => (
              <EditorSection key={n} title={title} description={description}>
                <div className="sm:col-span-2">
                  <Controller control={control} name={n} render={({ field }) => (
                    <RichTextEditor value={field.value} onChange={field.onChange} folderPath={folder} minHeight={110} />)} />
                </div>
              </EditorSection>
            ))
          )}

          {tab === 'features' && (
            <>
              <EditorSection title="Tính năng" description="Nhóm tính năng (tuỳ chọn) để chia cột trên landing page.">
                <div className="sm:col-span-2">
                  <Repeater items={features.fields} addLabel="Thêm tính năng" emptyText="Chưa có tính năng."
                    itemLabel={(_, i) => form.getValues(`features.${i}.title`) || `Tính năng ${i + 1}`}
                    onAdd={() => features.append({ title: '', description: null, icon: null, mediaId: null, group: null })}
                    onRemove={features.remove} onMove={features.move}
                    renderItem={(_, i) => (
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <div className="space-y-2">
                          <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
                            <Input aria-label="Tên tính năng" placeholder="Tên tính năng" aria-invalid={!!errors.features?.[i]?.title} {...register(`features.${i}.title`)} />
                            <Input aria-label="Nhóm" placeholder="Nhóm (tuỳ chọn)" {...register(`features.${i}.group`)} />
                          </div>
                          <Textarea rows={2} aria-label="Mô tả" placeholder="Mô tả" {...register(`features.${i}.description`)} />
                        </div>
                        <Controller control={control} name={`features.${i}.mediaId`} render={({ field }) => (
                          <MediaIdField value={field.value} onChange={field.onChange} folderPath={folder} compact />)} />
                      </div>
                    )} />
                </div>
              </EditorSection>
              <EditorSection title="Module" description="Các phân hệ của sản phẩm và chức năng trong từng phân hệ.">
                <div className="sm:col-span-2">
                  <Repeater items={modules.fields} addLabel="Thêm module" emptyText="Chưa có module."
                    itemLabel={(_, i) => form.getValues(`modules.${i}.name`) || `Module ${i + 1}`}
                    onAdd={() => modules.append({ name: '', description: null, icon: null, mediaId: null, items: [] })}
                    onRemove={modules.remove} onMove={modules.move}
                    renderItem={(_, i) => (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Input aria-label="Tên module" placeholder="Tên module (vd: Bán hàng)" {...register(`modules.${i}.name`)} />
                          <Textarea rows={2} aria-label="Mô tả module" placeholder="Mô tả" {...register(`modules.${i}.description`)} />
                          <Controller control={control} name={`modules.${i}.mediaId`} render={({ field }) => (
                            <MediaIdField value={field.value} onChange={field.onChange} folderPath={folder} compact />)} />
                        </div>
                        <Controller control={control} name={`modules.${i}.items`} render={({ field }) => (
                          <StringListInput label="Chức năng" value={field.value} onChange={field.onChange} placeholder="Chức năng" />)} />
                      </div>
                    )} />
                </div>
              </EditorSection>
            </>
          )}

          {tab === 'media' && (
            <EditorSection title="Màn hình & video" description="Ảnh giao diện thật. Nhóm (vd “Bán hàng”, “Bếp”) để chia tab xem màn hình.">
              <div className="sm:col-span-2">
                <Repeater items={media.fields} addLabel="Thêm màn hình" emptyText="Chưa có ảnh/video."
                  itemLabel={(_, i) => form.getValues(`media.${i}.caption`) || `Media ${i + 1}`}
                  onAdd={() => media.append({ kind: 'DESKTOP', mediaId: null, externalUrl: null, caption: null, alt: null, groupKey: null })}
                  onRemove={media.remove} onMove={media.move}
                  renderItem={(_, i) => (
                    <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
                      <div className="space-y-2">
                        <Select aria-label="Loại" {...register(`media.${i}.kind`)}>
                          {optionsOf(ProjectMediaKindLabels).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </Select>
                        <Input aria-label="Nhóm" placeholder="Nhóm tab" {...register(`media.${i}.groupKey`)} />
                      </div>
                      <div className="space-y-2">
                        <Controller control={control} name={`media.${i}.mediaId`} render={({ field }) => (
                          <MediaIdField value={field.value} onChange={field.onChange} folderPath={folder} kind="ANY" compact />)} />
                        <Input type="url" aria-label="Link video" placeholder="Hoặc link YouTube/Vimeo" {...register(`media.${i}.externalUrl`)} />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input aria-label="Chú thích" placeholder="Chú thích" {...register(`media.${i}.caption`)} />
                          <Input aria-label="Alt" placeholder="Alt" {...register(`media.${i}.alt`)} />
                        </div>
                        {errors.media?.[i]?.mediaId && <p className="text-[13px] text-danger">{errors.media[i]?.mediaId?.message}</p>}
                      </div>
                    </div>
                  )} />
              </div>
            </EditorSection>
          )}

          {tab === 'pricing' && (
            <>
              <EditorSection title="Ghi chú giá" description="vd: “Giá chưa gồm VAT”, “Liên hệ để nhận báo giá theo quy mô”.">
                <Field label="Ghi chú" className="sm:col-span-2">{(a) => <Input {...a} {...register('pricingNote')} />}</Field>
              </EditorSection>
              <EditorSection title="Gói giá" description="Chọn kỳ “Liên hệ” khi không công bố giá.">
                <div className="sm:col-span-2">
                  <Repeater items={plans.fields} addLabel="Thêm gói" emptyText="Chưa có gói giá." max={6}
                    itemLabel={(_, i) => form.getValues(`plans.${i}.name`) || `Gói ${i + 1}`}
                    onAdd={() => plans.append({ name: '', priceAmount: null, currency: 'VND', billingPeriod: 'CONTACT', priceNote: null, features: [], isHighlighted: false, ctaLabel: null, ctaUrl: null })}
                    onRemove={plans.remove} onMove={plans.move}
                    renderItem={(_, i) => (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Input aria-label="Tên gói" placeholder="Tên gói" {...register(`plans.${i}.name`)} />
                          <div className="grid grid-cols-[1fr_80px] gap-2">
                            <Input type="number" min={0} aria-label="Giá" placeholder="Giá"
                              {...register(`plans.${i}.priceAmount`, { setValueAs: (v) => (v === '' || v === null ? null : Number(v)) })} />
                            <Input aria-label="Tiền tệ" {...register(`plans.${i}.currency`)} />
                          </div>
                          {errors.plans?.[i]?.priceAmount && <p className="text-[13px] text-danger">{errors.plans[i]?.priceAmount?.message}</p>}
                          <Select aria-label="Kỳ thanh toán" {...register(`plans.${i}.billingPeriod`)}>
                            {optionsOf(BillingPeriodLabels).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </Select>
                          <Input aria-label="Ghi chú giá" placeholder="Ghi chú giá" {...register(`plans.${i}.priceNote`)} />
                          <div className="grid grid-cols-2 gap-2">
                            <Input aria-label="Nhãn nút" placeholder="Nhãn nút" {...register(`plans.${i}.ctaLabel`)} />
                            <Input aria-label="Link nút" placeholder="/yeu-cau-demo" {...register(`plans.${i}.ctaUrl`)} />
                          </div>
                          <Checkbox label="Gói nổi bật" {...register(`plans.${i}.isHighlighted`)} />
                        </div>
                        <Controller control={control} name={`plans.${i}.features`} render={({ field }) => (
                          <StringListInput label="Quyền lợi" value={field.value} onChange={field.onChange} placeholder="Quyền lợi trong gói" />)} />
                      </div>
                    )} />
                </div>
              </EditorSection>
            </>
          )}

          {tab === 'faq' && (
            <EditorSection title="Câu hỏi thường gặp" description="Hiển thị trên trang sản phẩm và dùng cho dữ liệu cấu trúc FAQPage.">
              <div className="sm:col-span-2">
                <Repeater items={faqs.fields} addLabel="Thêm câu hỏi" emptyText="Chưa có câu hỏi."
                  itemLabel={(_, i) => form.getValues(`faqs.${i}.question`) || `Câu hỏi ${i + 1}`}
                  onAdd={() => faqs.append({ question: '', answer: '' })} onRemove={faqs.remove} onMove={faqs.move}
                  renderItem={(_, i) => (
                    <div className="space-y-2">
                      <Input aria-label="Câu hỏi" placeholder="Câu hỏi" aria-invalid={!!errors.faqs?.[i]?.question} {...register(`faqs.${i}.question`)} />
                      <Textarea rows={3} aria-label="Trả lời" placeholder="Câu trả lời" aria-invalid={!!errors.faqs?.[i]?.answer} {...register(`faqs.${i}.answer`)} />
                    </div>
                  )} />
              </div>
            </EditorSection>
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
