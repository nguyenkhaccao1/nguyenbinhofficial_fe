const dateTimeFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
});

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
});

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return dateTimeFormat.format(typeof value === 'string' ? new Date(value) : value);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return dateFormat.format(typeof value === 'string' ? new Date(value) : value);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toLocaleString('vi-VN', { maximumFractionDigits: value < 10 ? 1 : 0 })} ${units[unit]}`;
}

/** "Phần mềm POS" → "phan-mem-pos" (khop voi Slug.From o backend). */
export function slugify(input: string, maxLength = 200): string {
  return input
    .trim()
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
}
