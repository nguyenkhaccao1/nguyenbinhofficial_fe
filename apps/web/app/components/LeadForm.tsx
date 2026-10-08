import { CheckCircle2, Loader2, Phone } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useRouteLoaderData } from 'react-router';
import type { Navigation } from '@nb/shared';
import { useSiteSettings } from '~/root';
import { cx } from './ui';

export type LeadFormType = 'CONTACT' | 'QUOTE' | 'DEMO';

const titles: Record<LeadFormType, string> = {
  CONTACT: 'Gửi yêu cầu tư vấn',
  QUOTE: 'Yêu cầu báo giá',
  DEMO: 'Đăng ký demo',
};

type Fields = 'fullName' | 'phone' | 'email' | 'company' | 'need' | 'message';
type Errors = Partial<Record<Fields | 'form', string>>;

/**
 * Form thu lead: gui thang tu trinh duyet toi /api/v1/leads (cung domain) — rate limit theo IP that cua khach.
 * Chong bot: o "website" an (nguoi that khong thay) + thoi gian dien form; server xu ly ca hai.
 */
export function LeadForm({ formType = 'CONTACT', productSlug, productName, serviceSlug, defaultNeed, className, title }: {
  formType?: LeadFormType; productSlug?: string | null; productName?: string | null; serviceSlug?: string | null; defaultNeed?: string | null;
  className?: string; title?: string;
}) {
  const settings = useSiteSettings();
  const layout = useRouteLoaderData('routes/site-layout') as { navigation: Navigation | null } | undefined;
  const services = layout?.navigation?.services ?? [];
  const id = useId();
  const startedAt = useRef(Date.now());
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const hotline = settings?.contact.hotline ?? settings?.contact.phone;

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const initialNeed = defaultNeed ?? (productName ? `Demo ${productName}` : services.find((s) => s.url === `/dich-vu/${serviceSlug}`)?.label) ?? '';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? '').trim();
    const next: Errors = {};
    if (!value('fullName')) next.fullName = 'Vui lòng nhập họ tên.';
    if (value('phone').replace(/\D/g, '').length < 9) next.phone = 'Vui lòng nhập số điện thoại hợp lệ.';
    if (value('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('email'))) next.email = 'Email không hợp lệ.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const params = new URLSearchParams(window.location.search);
    setState('sending');
    try {
      const response = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType, fullName: value('fullName'), phone: value('phone'), email: value('email') || null, company: value('company') || null,
          need: value('need') || null, message: value('message') || null, productSlug: productSlug ?? null, serviceSlug: serviceSlug ?? null,
          pageUrl: window.location.href, referrer: document.referrer || null,
          utmSource: params.get('utm_source'), utmMedium: params.get('utm_medium'), utmCampaign: params.get('utm_campaign'),
          website: value('website'), elapsedMs: Date.now() - startedAt.current,
        }),
      });
      if (response.ok) {
        setState('done');
        window.dispatchEvent(new CustomEvent('nb:lead', { detail: { formType } })); // cho GA4/GTM neu gan sau
        return;
      }
      const body = await response.json().catch(() => null) as { message?: string; errors?: Record<string, string[]> } | null;
      const fieldErrors: Errors = {};
      for (const [key, messages] of Object.entries(body?.errors ?? {})) fieldErrors[key as Fields] = messages[0];
      setErrors({ ...fieldErrors, form: response.status === 429 ? 'Bạn gửi quá nhanh. Vui lòng thử lại sau ít phút.' : body?.message ?? 'Chưa gửi được, vui lòng thử lại.' });
    } catch {
      setErrors({ form: 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.' });
    }
    setState('idle');
  }

  if (state === 'done') {
    return (
      <div className={cx('rounded-xl border border-primary/30 bg-primary/5 p-8 text-left', className)} role="status">
        <CheckCircle2 className="size-8 text-primary" aria-hidden />
        <h3 className="mt-4 text-2xl font-semibold tracking-tight">Đã nhận yêu cầu của bạn</h3>
        <p className="mt-2 leading-relaxed text-fg-muted">Nguyên Bình sẽ liên hệ lại với bạn trong thời gian sớm nhất.</p>
        {hotline && (
          <a href={`tel:${hotline.replace(/\s/g, '')}`} className="mt-5 inline-flex items-center gap-2 font-semibold text-primary hover:underline">
            <Phone className="size-4" aria-hidden />Cần gấp? Gọi {hotline}
          </a>
        )}
      </div>
    );
  }

  const field = 'h-11 w-full rounded-md border bg-white px-3 text-[15px] text-fg outline-none transition-colors placeholder:text-fg-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15';
  const input = (name: Fields, label: string, props: React.InputHTMLAttributes<HTMLInputElement> & { required?: boolean } = {}) => (
    <div>
      <label htmlFor={`${id}-${name}`} className="mb-1.5 block text-sm font-medium">{label}{props.required && <span className="text-red-600"> *</span>}</label>
      <input id={`${id}-${name}`} name={name} aria-invalid={!!errors[name] || undefined} aria-describedby={errors[name] ? `${id}-${name}-error` : undefined}
        className={cx(field, errors[name] ? 'border-red-500' : 'border-border')} {...props} required={undefined} />
      {errors[name] && <p id={`${id}-${name}-error`} className="mt-1 text-sm text-red-600">{errors[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className={cx('rounded-xl border border-border bg-white p-6 text-left text-fg shadow-[0_16px_40px_-24px_rgba(10,13,20,0.25)] sm:p-8', className)}>
      <h3 className="text-xl font-semibold tracking-tight">{title ?? titles[formType]}</h3>
      <p className="mt-1 text-sm text-fg-muted">Để lại thông tin, chúng tôi sẽ gọi lại tư vấn miễn phí.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {input('fullName', 'Họ và tên', { autoComplete: 'name', required: true, maxLength: 120 })}
        {input('phone', 'Số điện thoại', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', required: true, maxLength: 20 })}
        {input('email', 'Email', { type: 'email', autoComplete: 'email', maxLength: 200 })}
        {input('company', 'Công ty / cửa hàng', { autoComplete: 'organization', maxLength: 200 })}
      </div>
      <div className="mt-4">
        <label htmlFor={`${id}-need`} className="mb-1.5 block text-sm font-medium">Bạn cần</label>
        <select id={`${id}-need`} name="need" defaultValue={initialNeed} className={cx(field, 'border-border')}>
          <option value="">— Chọn nhu cầu —</option>
          {initialNeed && !services.some((s) => s.label === initialNeed) && <option value={initialNeed}>{initialNeed}</option>}
          {services.map((s) => <option key={s.url} value={s.label}>{s.label}</option>)}
          <option value="Khác">Khác</option>
        </select>
      </div>
      <div className="mt-4">
        <label htmlFor={`${id}-message`} className="mb-1.5 block text-sm font-medium">Nội dung</label>
        <textarea id={`${id}-message`} name="message" rows={4} maxLength={4000} placeholder="Mô tả ngắn nhu cầu, quy mô, thời gian mong muốn…"
          className={cx(field, 'h-auto py-2.5', errors.message ? 'border-red-500' : 'border-border')} />
      </div>
      {/* Bay bot: an voi nguoi dung va trinh doc man hinh. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {errors.form && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{errors.form}</p>}
      <button type="submit" disabled={state === 'sending'}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-70 sm:w-auto">
        {state === 'sending' && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {state === 'sending' ? 'Đang gửi…' : 'Gửi yêu cầu'}
      </button>
      <p className="mt-3 text-xs text-fg-muted">Thông tin chỉ dùng để liên hệ tư vấn, không chia sẻ cho bên thứ ba.</p>
    </form>
  );
}
