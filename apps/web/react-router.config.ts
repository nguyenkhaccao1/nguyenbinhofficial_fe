import type { Config } from '@react-router/dev/config';

export default {
  // SSR bat buoc: Googlebot phai doc duoc noi dung HTML truoc khi JavaScript chay (muc 3).
  ssr: true,
  appDirectory: 'app',
} satisfies Config;
