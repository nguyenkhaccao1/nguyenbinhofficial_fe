import { Phone } from 'lucide-react';
import type { PublicSettings } from '@nb/shared';

/** Nut lien he noi goc phai: goi dien + Zalo (lay tu Cau hinh → Lien he). */
export function FloatingContact({ settings }: { settings: PublicSettings | null }) {
  const c = settings?.contact;
  const phone = c?.hotline ?? c?.phone;
  const zalo = c?.zaloUrl ?? (c?.zaloPhone ? `https://zalo.me/${c.zaloPhone.replace(/\D/g, '')}` : null);
  if (!phone && !zalo) return null;
  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col gap-3 print:hidden sm:right-6 sm:bottom-6">
      {zalo && (
        <a href={zalo} target="_blank" rel="noopener noreferrer" aria-label="Nhắn Zalo"
          className="grid size-12 place-items-center rounded-full bg-[#0068ff] text-[13px] font-bold text-white shadow-lg ring-4 ring-white/70 transition-transform hover:scale-105">
          Zalo
        </a>
      )}
      {phone && (
        <a href={`tel:${phone.replace(/\s/g, '')}`} aria-label={`Gọi ${phone}`}
          className="relative grid size-12 place-items-center rounded-full bg-primary text-white shadow-lg ring-4 ring-white/70 transition-transform hover:scale-105">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/40 motion-reduce:hidden" aria-hidden />
          <Phone className="relative size-5" aria-hidden />
        </a>
      )}
    </div>
  );
}
