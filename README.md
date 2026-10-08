# Nguyên Bình Official — Frontend

Monorepo (npm workspaces) cho website public và Admin CMS của **nguyenbinhofficial.com.vn**.
Backend + tài liệu thiết kế: repo `nguyenbinhofficial_be` (`docs/design/`).

```text
apps/
├── web/      Website public — React Router 7 (framework mode) SSR, Tailwind v4
└── admin/    Admin CMS — Vite + React SPA phục vụ dưới /admin
packages/
└── shared/   API client (fetch + ApiError), kiểu dữ liệu settings, mã permission, format/slug
```

## System Requirements

- Node.js ≥ 22 (đang dùng 24), npm ≥ 10
- Backend API chạy ở `http://localhost:5080` (xem README backend)

## Local Setup

```bash
npm install
npm run dev:admin   # http://localhost:5174/admin  (proxy /api, /media → :5080)
npm run dev:web     # http://localhost:5173        (SSR, gọi API qua INTERNAL_API_URL)
```

Admin dùng proxy cùng origin nên cookie refresh (`SameSite=Strict`, httpOnly) hoạt động khi dev, giống production (nginx: `/` → web, `/admin` → admin, `/api` + `/media` → API).

## Environment Variables

| Biến | App | Mặc định | Mô tả |
|------|-----|----------|-------|
| `INTERNAL_API_URL` | web | `http://localhost:5080` | API cho SSR gọi qua mạng nội bộ |
| `SITE_INDEXABLE` | web | `false` | Chỉ đặt `true` ở Production. Khác `true` → mọi trang `noindex, nofollow` |
| `PORT` | web | `3000` | Cổng server SSR khi chạy bản build |
| `API_URL` | admin (dev) | `http://localhost:5080` | Đích proxy của Vite dev server |

Không có ID tracking/secret nào trong code — GA4/GTM/Pixel/Clarity cấu hình trong Admin → Cấu hình website → Tracking.

## Build & Run

```bash
npm run build                      # admin → apps/admin/dist, web → apps/web/build
npm start -w @nb/web               # chạy SSR bản build (react-router-serve)
```

`apps/admin/dist` là file tĩnh, phục vụ bằng nginx tại `/admin/` với fallback `index.html`.

## Testing

```bash
npm run typecheck
npm test
```

## Quy ước

- **Không mock data**: mọi nội dung lấy từ API/CMS.
- Quyền ở UI (`<Can>`, `RequirePermission`) chỉ để ẩn/hiện — backend luôn kiểm tra lại.
- Access token chỉ giữ trong memory; refresh token trong cookie httpOnly. Refresh được single-flight trong tab và khoá giữa các tab bằng Web Locks (backend coi việc dùng lại token cũ là bị đánh cắp và huỷ phiên).
- Danh sách admin đồng bộ tham số với URL (`?q=&page=&sort=`) để F5/chia sẻ link giữ nguyên trạng thái.

## Phiên bản thư viện

Đang dùng React 19, React Router 7.18, Vite 7, TypeScript 5.9, TanStack Table 8, Vitest 5. Các bản major mới hơn (React Router 8, Vite 8, TypeScript 7, TanStack Table 9) đã phát hành; nâng cấp nên làm thành một thay đổi riêng có kiểm thử.

> npm 11.3 có lỗi arborist (`Cannot read properties of null (reading 'edgesOut')`) với vitest 4.x — repo dùng vitest 5 để tránh lỗi này.

## Cập nhật & triển khai

Web và admin được build và deploy cùng backend. Sau khi commit, chạy từ repo backend (Git Bash):

```bash
cd ../nguyenbinhofficial_be
deploy/release.sh          # test → push 2 repo lên GitHub → SSH vào server pull + build + chạy lại
```

Hoặc làm tay: `git push origin main` ở repo này, rồi
`ssh -i ~/.ssh/vietnix_ed25519 root@103.200.22.167 "cd ~/apps/nguyenbinhofficial_be && bash deploy/deploy.sh --pull"`.

Hướng dẫn đầy đủ (log, rollback, lưu ý): README của repo backend, mục **Cập nhật & triển khai**.
