import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

/**
 * Tham so danh sach (q, page, pageSize, sort, filter) dong bo voi URL → F5/chia se link giu nguyen trang thai.
 * Tim kiem duoc debounce 300ms.
 */
export function useListParams(defaults: { pageSize?: number; sort?: string } = {}) {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');

  const values = useMemo(() => {
    const filters: Record<string, string> = {};
    params.forEach((value, key) => {
      if (!['q', 'page', 'pageSize', 'sort'].includes(key)) filters[key] = value;
    });
    return {
      q: params.get('q') ?? '',
      page: Number(params.get('page') ?? 1),
      pageSize: Number(params.get('pageSize') ?? defaults.pageSize ?? 20),
      sort: params.get('sort') ?? defaults.sort ?? '',
      filters,
    };
  }, [params, defaults.pageSize, defaults.sort]);

  const update = useCallback((changes: Record<string, string | number | null>, resetPage = true) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, String(value));
      }
      if (resetPage && !('page' in changes)) next.delete('page');
      return next;
    }, { replace: true });
  }, [setParams]);

  useEffect(() => {
    if (search === values.q) return;
    const timer = setTimeout(() => update({ q: search }), 300);
    return () => clearTimeout(timer);
  }, [search, values.q, update]);

  return {
    ...values,
    search,
    setSearch,
    setPage: (page: number) => update({ page }, false),
    setPageSize: (pageSize: number) => update({ pageSize }),
    setSort: (sort: string) => update({ sort }),
    setFilter: (key: string, value: string | null) => update({ [key]: value }),
  };
}
