import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router';
import { Permissions, type AllSettings, type MediaRef, type SettingGroupKey } from '@nb/shared';
import { toast } from 'sonner';
import { usePermission } from '@/auth/session';
import { Button } from '@/components/ui/Button';
import { Card, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback';
import { Checkbox, Field, Input, Textarea } from '@/components/ui/Form';
import { Tabs } from '@/components/ui/Navigation';
import { applyServerErrors } from '@/lib/forms';
import { api } from '@/lib/http';
import { MediaField } from '@/features/media/MediaPicker';

type FieldType = 'text' | 'textarea' | 'email' | 'url' | 'tel' | 'color' | 'media' | 'emails' | 'checkbox';

interface FieldDef {
  name: string;
  label: string;
  type?: FieldType;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  wide?: boolean;
}

interface GroupDef {
  key: SettingGroupKey;
  label: string;
  description: string;
  fields: FieldDef[];
}

const groups: GroupDef[] = [
  {
    key: 'brand', label: 'Thương hiệu',
    description: 'Tên và logo hiển thị trên website, email và kết quả tìm kiếm. Đổi tên thương hiệu không cần sửa code.',
    fields: [
      { name: 'siteName', label: 'Tên thương hiệu', required: true, placeholder: 'Nguyên Bình Technology' },
      { name: 'shortName', label: 'Tên ngắn', required: true, placeholder: 'Nguyên Bình' },
      { name: 'legalName', label: 'Tên pháp lý', hint: 'Dùng trong footer và trang điều khoản.', wide: true },
      { name: 'tagline', label: 'Thông điệp chính', type: 'textarea', wide: true },
      { name: 'description', label: 'Thông điệp phụ', type: 'textarea', wide: true },
      { name: 'logo', label: 'Logo (nền sáng)', type: 'media' },
      { name: 'logoDark', label: 'Logo (nền tối)', type: 'media' },
      { name: 'favicon', label: 'Favicon', type: 'media', hint: 'Ảnh vuông, tối thiểu 512×512px.' },
    ],
  },
  {
    key: 'theme', label: 'Màu sắc',
    description: 'Màu thương hiệu dùng cho nút, liên kết và điểm nhấn. Giữ độ tương phản đủ để đọc được.',
    fields: [
      { name: 'primaryColor', label: 'Màu chính', type: 'color' },
      { name: 'accentColor', label: 'Màu nhấn', type: 'color' },
      { name: 'darkColor', label: 'Màu nền tối', type: 'color' },
    ],
  },
  {
    key: 'contact', label: 'Liên hệ',
    description: 'Hiển thị ở header, footer, trang liên hệ và nút gọi/Zalo trên mobile.',
    fields: [
      { name: 'phone', label: 'Điện thoại', type: 'tel' },
      { name: 'hotline', label: 'Hotline', type: 'tel' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'workingHours', label: 'Giờ làm việc', placeholder: 'Thứ 2 – Thứ 6, 8:30 – 17:30' },
      { name: 'address', label: 'Địa chỉ', type: 'textarea', wide: true },
      { name: 'mapUrl', label: 'Link Google Maps', type: 'url', wide: true },
      { name: 'zaloPhone', label: 'Số Zalo', type: 'tel' },
      { name: 'zaloUrl', label: 'Link Zalo', type: 'url', placeholder: 'https://zalo.me/…' },
      { name: 'messengerUrl', label: 'Link Messenger', type: 'url', placeholder: 'https://m.me/…' },
      { name: 'taxCode', label: 'Mã số thuế' },
    ],
  },
  {
    key: 'social', label: 'Mạng xã hội',
    description: 'Dùng cho footer và dữ liệu cấu trúc Organization (sameAs).',
    fields: [
      { name: 'facebook', label: 'Facebook', type: 'url' },
      { name: 'linkedIn', label: 'LinkedIn', type: 'url' },
      { name: 'youTube', label: 'YouTube', type: 'url' },
      { name: 'tikTok', label: 'TikTok', type: 'url' },
      { name: 'gitHub', label: 'GitHub', type: 'url' },
      { name: 'x', label: 'X (Twitter)', type: 'url' },
    ],
  },
  {
    key: 'tracking', label: 'Tracking',
    description: 'Mã theo dõi được website nạp tự động — không cần sửa code. Để trống để tắt.',
    fields: [
      { name: 'ga4MeasurementId', label: 'Google Analytics 4', placeholder: 'G-XXXXXXXXXX' },
      { name: 'gtmContainerId', label: 'Google Tag Manager', placeholder: 'GTM-XXXXXXX' },
      { name: 'googleSiteVerification', label: 'Google Search Console', hint: 'Giá trị content của thẻ meta google-site-verification.' },
      { name: 'bingSiteVerification', label: 'Bing Webmaster' },
      { name: 'metaPixelId', label: 'Meta Pixel ID' },
      { name: 'clarityProjectId', label: 'Microsoft Clarity' },
    ],
  },
  {
    key: 'seo', label: 'SEO mặc định',
    description: 'Áp dụng khi trang chưa có SEO riêng. Môi trường SIT/UAT luôn chặn index bất kể cấu hình này.',
    fields: [
      { name: 'siteUrl', label: 'URL website', type: 'url', required: true, wide: true },
      { name: 'titleTemplate', label: 'Mẫu tiêu đề', required: true, hint: '%s được thay bằng tiêu đề trang.', wide: true },
      { name: 'defaultTitle', label: 'Tiêu đề mặc định', hint: 'Tối đa 70 ký tự.', wide: true },
      { name: 'defaultDescription', label: 'Mô tả mặc định', type: 'textarea', hint: 'Khoảng 150–160 ký tự.', wide: true },
      { name: 'defaultOgImage', label: 'Ảnh chia sẻ mặc định (OG)', type: 'media', hint: 'Khuyến nghị 1200×630px.' },
      { name: 'twitterHandle', label: 'Tài khoản X', placeholder: '@nguyenbinh' },
      { name: 'robotsExtra', label: 'Bổ sung robots.txt', type: 'textarea', wide: true },
    ],
  },
  {
    key: 'forms', label: 'Form & thông báo',
    description: 'Nhận email khi có lead, yêu cầu báo giá hoặc demo mới (không hiển thị public).',
    fields: [
      { name: 'notificationEmails', label: 'Email nhận thông báo', type: 'emails', hint: 'Mỗi email một dòng, tối đa 10.', wide: true },
      { name: 'sendAutoReply', label: 'Gửi email xác nhận tự động cho khách', type: 'checkbox', wide: true },
    ],
  },
];

export function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (groups.find((g) => g.key === params.get('tab')) ?? groups[0]!).key;
  const settings = useQuery({
    queryKey: ['settings'],
    queryFn: ({ signal }) => api<AllSettings>('/admin/settings', { signal }),
  });

  return (
    <>
      <PageHeader title="Cấu hình website" description="Thay đổi có hiệu lực trên website sau tối đa 1 phút (cache)." />
      <Card className="px-4 pb-2 lg:px-6">
        <Tabs items={groups.map((g) => ({ key: g.key, label: g.label }))} value={tab}
          onChange={(key) => setParams({ tab: key }, { replace: true })}>
          {settings.error ? <ErrorState error={settings.error} onRetry={() => void settings.refetch()} />
            : !settings.data ? (
              <div className="space-y-4 py-6">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : (
              <GroupForm key={tab} group={groups.find((g) => g.key === tab)!}
                initial={settings.data[tab] as unknown as Record<string, unknown>} />
            )}
        </Tabs>
      </Card>
    </>
  );
}

function toFormValues(group: GroupDef, data: Record<string, unknown>) {
  const values: Record<string, unknown> = {};
  for (const f of group.fields) {
    const v = data[f.name];
    if (f.type === 'media') values[f.name] = v ?? null;
    else if (f.type === 'emails') values[f.name] = ((v as string[] | undefined) ?? []).join('\n');
    else if (f.type === 'checkbox') values[f.name] = !!v;
    else values[f.name] = (v as string | null) ?? '';
  }
  return values;
}

function toPayload(group: GroupDef, values: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};
  for (const f of group.fields) {
    const v = values[f.name];
    if (f.type === 'media') payload[f.name] = v ? { id: (v as MediaRef).id } : null;
    else if (f.type === 'emails') payload[f.name] = String(v ?? '').split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    else if (f.type === 'checkbox') payload[f.name] = !!v;
    else payload[f.name] = typeof v === 'string' && v.trim() === '' ? null : typeof v === 'string' ? v.trim() : v;
  }
  return payload;
}

function GroupForm({ group, initial }: { group: GroupDef; initial: Record<string, unknown> }) {
  const canEdit = usePermission(Permissions.settings.update);
  const client = useQueryClient();
  const { register, control, handleSubmit, setError, reset, watch,
    formState: { errors, isDirty, isSubmitting } } = useForm<Record<string, unknown>>({
    defaultValues: toFormValues(group, initial),
  });

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api<Record<string, unknown>>(`/admin/settings/${group.key}`, { method: 'PUT', body: payload }),
    onSuccess: (data) => {
      client.setQueryData<AllSettings>(['settings'], (old) => (old ? { ...old, [group.key]: data } : old));
      reset(toFormValues(group, data));
      toast.success('Đã lưu cấu hình.');
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync(toPayload(group, values));
    } catch (error) {
      applyServerErrors(error, setError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="py-6">
      <p className="mb-6 max-w-2xl text-fg-muted">{group.description}</p>
      <fieldset disabled={!canEdit} className="grid max-w-4xl gap-x-6 gap-y-5 sm:grid-cols-2">
        {group.fields.map((f) => {
          const error = errors[f.name]?.message as string | undefined;
          const className = f.wide ? 'sm:col-span-2' : undefined;

          if (f.type === 'checkbox') {
            return <Checkbox key={f.name} className={className} label={f.label} {...register(f.name)} />;
          }

          if (f.type === 'media') {
            return (
              <Field key={f.name} label={f.label} error={error} hint={f.hint} className={className}>
                {() => (
                  <Controller control={control} name={f.name} render={({ field }) => (
                    <MediaField value={field.value as MediaRef | null} onChange={field.onChange} disabled={!canEdit} />
                  )} />
                )}
              </Field>
            );
          }

          if (f.type === 'color') {
            const value = String(watch(f.name) ?? '');
            return (
              <Field key={f.name} label={f.label} error={error} hint={f.hint} className={className}>
                {(p) => (
                  <div className="flex items-center gap-2">
                    <span className="size-10 shrink-0 rounded-md border border-border" style={{ background: value }} aria-hidden />
                    <Input {...p} className="font-mono uppercase" maxLength={7} placeholder="#RRGGBB"
                      {...register(f.name, { pattern: { value: /^#[0-9A-Fa-f]{6}$/, message: 'Màu phải dạng #RRGGBB.' } })} />
                  </div>
                )}
              </Field>
            );
          }

          const multiline = f.type === 'textarea' || f.type === 'emails';
          return (
            <Field key={f.name} label={f.label} error={error} hint={f.hint} required={f.required} className={className}>
              {(p) => multiline ? (
                <Textarea {...p} rows={f.type === 'emails' ? 4 : 3} placeholder={f.placeholder} {...register(f.name)} />
              ) : (
                <Input {...p} type={f.type === 'url' || f.type === 'email' || f.type === 'tel' ? f.type : 'text'}
                  placeholder={f.placeholder}
                  {...register(f.name, f.required ? { validate: (v) => String(v ?? '').trim() !== '' || 'Không được để trống.' } : {})} />
              )}
            </Field>
          );
        })}
      </fieldset>

      {canEdit && (
        <div className="mt-8 flex gap-2 border-t border-border pt-5">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>Lưu thay đổi</Button>
          <Button variant="ghost" disabled={!isDirty || isSubmitting} onClick={() => reset()}>Huỷ thay đổi</Button>
        </div>
      )}
    </form>
  );
}
