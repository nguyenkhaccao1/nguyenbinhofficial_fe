import { ApiError } from '@nb/shared';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';

/**
 * Hien loi tu API: 422 → gan vao tung field cua form (ten field camelCase khop backend),
 * loi khac → toast. Tra ve true neu da gan duoc loi vao field.
 */
export function applyServerErrors<T extends FieldValues>(error: unknown, setError?: UseFormSetError<T>): boolean {
  if (error instanceof ApiError && error.isValidation && setError) {
    let applied = false;
    for (const [field, messages] of Object.entries(error.errors)) {
      if (!messages[0]) continue;
      setError(field as Path<T>, { type: 'server', message: messages[0] });
      applied = true;
    }
    if (applied) return true;
  }
  toast.error(errorMessage(error));
  return false;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Đã có lỗi xảy ra.';
}

/** Chuoi rong → null de backend luu NULL thay vi "". */
export function emptyToNull<T extends Record<string, unknown>>(values: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) result[key] = value === '' ? null : value;
  return result as T;
}
