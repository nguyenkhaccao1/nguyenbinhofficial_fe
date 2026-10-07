import { describe, expect, it } from 'vitest';
import { ApiError, toQueryString } from './api';
import { formatBytes, slugify } from './format';

describe('slugify', () => {
  it.each([
    ['POS Nguyên Bình', 'pos-nguyen-binh'],
    ['Phần mềm quản lý khách sạn', 'phan-mem-quan-ly-khach-san'],
    ['Đặt món & Thanh toán', 'dat-mon-thanh-toan'],
    ['  ASP.NET   Core 9 ', 'asp-net-core-9'],
    ['---', ''],
  ])('%s → %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});

describe('formatBytes', () => {
  it('formats sizes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1,5 KB');
    expect(formatBytes(15 * 1024 * 1024)).toBe('15 MB');
  });
});

describe('toQueryString', () => {
  it('skips empty values', () => {
    expect(toQueryString({ q: 'pos', page: 2, role: '', x: undefined, active: false })).toBe('?q=pos&page=2&active=false');
    expect(toQueryString({})).toBe('');
  });
});

describe('ApiError', () => {
  it('exposes validation errors', () => {
    const error = new ApiError(422, 'Dữ liệu không hợp lệ.', { email: ['Email không hợp lệ.'] });
    expect(error.isValidation).toBe(true);
    expect(error.errors.email).toEqual(['Email không hợp lệ.']);
  });
});
