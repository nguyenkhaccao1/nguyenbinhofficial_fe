/** Envelope chuan cua moi response API: { success, data, message, errors }. */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  errors: Record<string, string[]> | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/** Loi tu API: giu status, thong bao tieng Viet, loi theo field (422) va data chi tiet (vd 409). */
export class ApiError extends Error {
  readonly status: number;
  readonly errors: Record<string, string[]>;
  readonly data: unknown;

  constructor(status: number, message: string, errors?: Record<string, string[]> | null, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors ?? {};
    this.data = data;
  }

  get isValidation() {
    return this.status === 422;
  }
}

export type QueryValue = string | number | boolean | null | undefined;

export function toQueryString(params?: Record<string, QueryValue>): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, QueryValue>;
  /** Object → JSON; FormData giu nguyen (multipart). */
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
}

/**
 * Goi API va tra ve `data` da unwrap. Response loi (hoac success=false) → ApiError.
 * Dung chung cho web (SSR, fetch tren server) va admin (them lop auth o tren).
 */
export async function requestJson<T>(baseUrl: string, path: string, options: RequestOptions = {},
  fetchImpl: typeof fetch = fetch): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetchImpl(`${baseUrl}${path}${toQueryString(options.query)}`, {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: options.signal,
      credentials: options.credentials,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiError(0, 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.');
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? ((await response.json()) as ApiResponse<T>) : null;

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      response.status,
      payload?.message ?? defaultMessage(response.status),
      payload?.errors,
      payload?.data,
    );
  }

  return payload.data as T;
}

function defaultMessage(status: number): string {
  switch (status) {
    case 401: return 'Phiên đăng nhập đã hết hạn.';
    case 403: return 'Bạn không có quyền thực hiện thao tác này.';
    case 404: return 'Không tìm thấy dữ liệu.';
    case 413: return 'Dữ liệu gửi lên quá lớn.';
    case 429: return 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.';
    default: return status >= 500 ? 'Máy chủ gặp sự cố. Vui lòng thử lại sau.' : 'Yêu cầu không hợp lệ.';
  }
}
