import { useEffect, type RefObject } from 'react';

/**
 * Hieu ung GSAP cho trang page builder (trang chu, gioi thieu, landing...).
 *
 * Nguyen tac:
 * - Noi dung luon co trong HTML (SSR) — chi an tam khi <html class="motion"> (script dau trang dat, xem root.tsx),
 *   va tu hien lai sau 2.5s neu GSAP khong tai duoc (khong bao gio de trang trong).
 * - prefers-reduced-motion: khong gan class "motion" → khong co hieu ung nao.
 * - GSAP tai dong (code-split) sau khi trang da hien → khong anh huong LCP/TTI.
 *
 * Danh dau trong JSX bang data-anim:
 *   hero-title (tach dong) | hero-item (truot len, lan luot) | hero-shot (anh hero bay vao + nghieng theo chuot)
 *   heading | cards (moi phan tu con hien theo nhom khi cuon) | count (dem so) | steps (duong tien do) | cta (phong nhe)
 *   data-parallax: anh troi nhe khi cuon; data-marquee: dai chay ngang vo tan.
 */
export function usePageMotion(root: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useEffect(() => {
    const el = root.current;
    if (!el || !document.documentElement.classList.contains('motion')) return;
    let revert: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }, { SplitText }] = await Promise.all([
        import('gsap'), import('gsap/ScrollTrigger'), import('gsap/SplitText'),
      ]);
      // Tai qua cham (da qua 2.5s, noi dung da hien lai) → bo qua hieu ung de khong lam nhay noi dung.
      if (cancelled || !document.documentElement.classList.contains('motion')) return;
      gsap.registerPlugin(ScrollTrigger, SplitText);
      window.__nbMotion = true;

      const ctx = gsap.context((self) => {
        const q = <T extends Element = HTMLElement>(sel: string) => gsap.utils.toArray<T>(sel, el);
        const ease = 'power3.out';

        // ---- Hero: tieu de hien theo dong, noi dung truot len lan luot, anh bay vao.
        const heroTl = gsap.timeline({ defaults: { ease } });
        q('[data-anim="hero-title"]').forEach((title) => {
          const split = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
          gsap.set(title, { autoAlpha: 1 });
          heroTl.from(split.lines, { yPercent: 105, duration: 0.9, stagger: 0.09 }, 0);
        });
        heroTl.fromTo(q('[data-anim="hero-item"]'), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.25);
        heroTl.from(q('[data-anim="hero-main"]'), { y: 40, rotateX: 6, scale: 0.97, duration: 1.2, ease: 'expo.out' }, 0);
        heroTl.fromTo(q('[data-anim="hero-shot"]'),
          { autoAlpha: 0, y: 60, rotateX: 8, scale: 0.96 },
          { autoAlpha: 1, y: 0, rotateX: 0, scale: 1, duration: 1.1, stagger: 0.15, ease: 'expo.out' }, 0.15);

        // Anh hero nghieng nhe theo chuot (chi thiet bi co chuot that).
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
          q('[data-anim="hero-montage"]').forEach((montage) => {
            const shots = gsap.utils.toArray<HTMLElement>('[data-anim="hero-main"], [data-anim="hero-shot"]', montage);
            const movers = shots.map((shot, i) => ({
              x: gsap.quickTo(shot, 'x', { duration: 0.8, ease: 'power3' }),
              y: gsap.quickTo(shot, 'y', { duration: 0.8, ease: 'power3' }),
              depth: (i + 1) * 8,
            }));
            const onMove = (e: PointerEvent) => {
              const r = montage.getBoundingClientRect();
              const dx = (e.clientX - r.left) / r.width - 0.5;
              const dy = (e.clientY - r.top) / r.height - 0.5;
              movers.forEach((m) => { m.x(dx * m.depth); m.y(dy * m.depth); });
            };
            const onLeave = () => movers.forEach((m) => { m.x(0); m.y(0); });
            montage.addEventListener('pointermove', onMove);
            montage.addEventListener('pointerleave', onLeave);
            self.add(() => () => {
              montage.removeEventListener('pointermove', onMove);
              montage.removeEventListener('pointerleave', onLeave);
            });
          });
        }

        // ---- Tieu de section: hien khi cuon toi.
        q('[data-anim="heading"]').forEach((heading) => {
          gsap.fromTo(heading, { autoAlpha: 0, y: 32 }, {
            autoAlpha: 1, y: 0, duration: 0.8, ease,
            scrollTrigger: { trigger: heading, start: 'top 85%', once: true },
          });
        });

        // ---- The (du an, dich vu, san pham, bai viet, tinh nang): hien theo tung nhom vao man hinh.
        const cards = q('[data-anim="cards"] > *');
        gsap.set(cards, { autoAlpha: 0, y: 40 });
        ScrollTrigger.batch(cards, {
          start: 'top 88%',
          once: true,
          onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1, ease, overwrite: true }),
        });

        // ---- Anh troi nhe khi cuon (parallax trong khung the).
        q('[data-parallax]').forEach((img) => {
          gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, {
            yPercent: 6, ease: 'none',
            scrollTrigger: { trigger: img.parentElement ?? img, start: 'top bottom', end: 'bottom top', scrub: true },
          });
        });

        // ---- So lieu: dem tu 0 toi gia tri (giu tien to/hau to: "10+", "99%", "1.200").
        q('[data-anim="count"]').forEach((node) => {
          const text = node.textContent ?? '';
          const match = text.match(/^(\D*)([\d.,]+)(.*)$/);
          if (!match) return;
          const [, prefix = '', raw = '', suffix = ''] = match;
          // "1.200" / "1,200" la phan nghin; "4,5" la so thap phan (cach viet tieng Viet).
          const target = Number(raw.replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.'));
          if (!Number.isFinite(target)) return;
          const decimals = /[.,]\d{3}\b/.test(raw) ? 0 : (raw.split(',')[1]?.length ?? 0);
          const format = (v: number) => prefix + v.toLocaleString('vi-VN', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }) + suffix;
          const counter = { v: 0 };
          node.textContent = format(0);
          gsap.to(counter, {
            v: target, duration: 1.6, ease: 'power2.out',
            onUpdate: () => { node.textContent = format(counter.v); },
            onComplete: () => { node.textContent = text; },
            scrollTrigger: { trigger: node, start: 'top 90%', once: true },
          });
        });

        // ---- Quy trinh: duong tien do chay theo cuon, cac buoc sang dan.
        q('[data-anim="steps"]').forEach((list) => {
          const line = list.querySelector<HTMLElement>('[data-anim="steps-line"]');
          // An/hien noi dung trong o (khong an ca o — nen luoi dung lam duong ke).
          const steps = gsap.utils.toArray<HTMLElement>('li > *', list);
          if (line) {
            gsap.fromTo(line, { scaleX: 0 }, {
              scaleX: 1, ease: 'none', transformOrigin: 'left center',
              scrollTrigger: { trigger: list, start: 'top 80%', end: 'bottom 60%', scrub: 0.6 },
            });
          }
          gsap.fromTo(steps, { autoAlpha: 0, y: 30 }, {
            autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.05, ease,
            scrollTrigger: { trigger: list, start: 'top 82%', once: true },
          });
        });

        // ---- CTA cuoi trang: phong nhe tu 0.94.
        q('[data-anim="cta"]').forEach((cta) => {
          gsap.fromTo(cta, { autoAlpha: 0, scale: 0.94, y: 30 }, {
            autoAlpha: 1, scale: 1, y: 0, duration: 0.9, ease: 'expo.out',
            scrollTrigger: { trigger: cta, start: 'top 85%', once: true },
          });
        });

        // ---- Dai cong nghe chay ngang vo tan (noi dung duoc nhan doi san trong HTML).
        q('[data-marquee]').forEach((track) => {
          const tween = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
          track.addEventListener('pointerenter', () => tween.timeScale(0.15));
          track.addEventListener('pointerleave', () => tween.timeScale(1));
        });
      }, el);

      // Anh lazy-load lam doi chieu cao trang → tinh lai vi tri trigger.
      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener('load', onLoad);
      revert = () => {
        window.removeEventListener('load', onLoad);
        ctx.revert();
      };
    })().catch((error: unknown) => {
      // GSAP loi → hien toan bo noi dung (khong de trang bi an).
      console.warn('[motion]', error);
      document.documentElement.classList.remove('motion');
    });

    return () => {
      cancelled = true;
      revert?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

declare global {
  interface Window {
    __nbMotion?: boolean;
  }
}

/**
 * Script dat trong <head>: gan class "motion" truoc khi trinh duyet ve (tranh nhay noi dung),
 * tru khi nguoi dung chon giam chuyen dong. Neu sau 2.5s GSAP chua chay → go class, hien noi dung.
 */
export const motionBootScript = `(function(){try{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;var d=document.documentElement;d.classList.add('motion');setTimeout(function(){if(!window.__nbMotion)d.classList.remove('motion')},2500)}catch(e){}})();`;
