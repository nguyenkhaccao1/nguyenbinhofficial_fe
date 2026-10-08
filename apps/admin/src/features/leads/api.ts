import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PagedResult, QueryValue } from '@nb/shared';
import { api } from '@/lib/http';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'WON' | 'LOST' | 'SPAM';
export type LeadFormType = 'CONTACT' | 'QUOTE' | 'DEMO';

export const LeadStatusLabels: Record<LeadStatus, string> = {
  NEW: 'Mới', CONTACTED: 'Đã liên hệ', QUALIFIED: 'Tiềm năng', WON: 'Thành công', LOST: 'Không thành', SPAM: 'Spam',
};
export const LeadFormTypeLabels: Record<LeadFormType, string> = { CONTACT: 'Liên hệ', QUOTE: 'Báo giá', DEMO: 'Demo' };

export interface LeadListItem {
  id: string;
  formType: LeadFormType;
  status: LeadStatus;
  fullName: string;
  phone: string;
  email: string | null;
  company: string | null;
  need: string | null;
  createdAt: string;
  notifiedAt: string | null;
  notifyFailed: boolean;
}

export interface LeadDetail extends LeadListItem {
  productSlug: string | null;
  serviceSlug: string | null;
  message: string | null;
  pageUrl: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  note: string | null;
  updatedAt: string | null;
  notifyError: string | null;
}

const keys = { all: ['leads'] as const };

export function useLeads(query: Record<string, QueryValue>) {
  return useQuery({
    queryKey: [...keys.all, 'list', query],
    queryFn: ({ signal }) => api<PagedResult<LeadListItem>>('/admin/leads', { query, signal }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000, // lead moi hien ra ma khong can tai lai trang
  });
}

export function useLead(id: string | null) {
  return useQuery({
    queryKey: [...keys.all, 'detail', id],
    queryFn: ({ signal }) => api<LeadDetail>(`/admin/leads/${id}`, { signal }),
    enabled: !!id,
  });
}

export function useLeadMutations() {
  const client = useQueryClient();
  const onSuccess = () => client.invalidateQueries({ queryKey: keys.all });
  return {
    update: useMutation({
      mutationFn: ({ id, status, note }: { id: string; status: LeadStatus; note: string | null }) =>
        api<LeadDetail>(`/admin/leads/${id}`, { method: 'PUT', body: { status, note } }),
      onSuccess,
    }),
    resend: useMutation({
      mutationFn: (id: string) => api(`/admin/leads/${id}/notify`, { method: 'POST' }),
      // Email gui o hang doi nen → lam moi sau vai giay de thay ket qua.
      onSuccess: () => setTimeout(() => void onSuccess(), 3000),
    }),
    remove: useMutation({
      mutationFn: (id: string) => api(`/admin/leads/${id}`, { method: 'DELETE' }),
      onSuccess,
    }),
  };
}
