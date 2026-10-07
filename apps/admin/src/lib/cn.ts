import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Gop class Tailwind; class truyen sau ghi de class mac dinh cung nhom (vd w-auto thang w-full). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
