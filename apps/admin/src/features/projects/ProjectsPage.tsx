import { Star } from 'lucide-react';
import {
  formatDateTime, optionsOf, OwnershipTypeLabels, Permissions, ProjectContentTypeLabels, ProjectRoleLabels,
} from '@nb/shared';
import { ContentListPage, TitleCell } from '@/components/content/ContentListPage';
import { StatusBadge } from '@/components/content/ContentEditor';
import { Badge } from '@/components/ui/Feedback';
import { useLookups } from '@/lib/content';
import type { ProjectListItem } from './types';

const ownershipTone = {
  NGUYEN_BINH_OWNED: 'primary',
  CLIENT_OWNED: 'neutral',
  CO_OWNED: 'neutral',
  PARTNER_OWNED: 'neutral',
  UNDISCLOSED: 'warning',
} as const;

export function ProjectsPage() {
  const lookups = useLookups();
  return (
    <ContentListPage<ProjectListItem>
      resource="projects"
      permission="project"
      title="Dự án"
      label="dự án"
      description="Dự án đã triển khai và case study. Phân biệt rõ sản phẩm Nguyên Bình sở hữu với dự án làm theo yêu cầu khách hàng."
      editPath="/projects"
      defaultSort="sortOrder,-updatedAt"
      filters={[
        { key: 'contentType', label: 'Loại', options: optionsOf(ProjectContentTypeLabels) },
        { key: 'ownership', label: 'Sở hữu', options: optionsOf(OwnershipTypeLabels) },
        { key: 'industryId', label: 'Ngành', options: (lookups.data?.industries ?? []).map((i) => ({ value: i.id, label: i.name })) },
        { key: 'featured', label: 'Nổi bật', options: [{ value: 'true', label: 'Nổi bật' }, { value: 'false', label: 'Không' }] },
      ]}
      columns={[
        {
          id: 'name', header: 'Dự án', sortKey: 'name', alwaysVisible: true,
          cell: (p) => (
            <div className="flex items-center gap-2">
              {p.isFeatured && <Star className="size-4 shrink-0 fill-warning text-warning" aria-label="Nổi bật" />}
              <TitleCell title={p.name} to={`/projects/${p.id}`}
                subtitle={[p.industryName, p.clientName].filter(Boolean).join(' · ') || `/du-an/${p.slug}`} />
            </div>
          ),
        },
        {
          id: 'type', header: 'Loại',
          cell: (p) => (
            <div className="flex max-w-64 flex-wrap gap-1">
              {p.contentTypes.slice(0, 3).map((t) => <Badge key={t}>{ProjectContentTypeLabels[t]}</Badge>)}
              {p.contentTypes.length > 3 && <Badge>+{p.contentTypes.length - 3}</Badge>}
            </div>
          ),
        },
        { id: 'ownership', header: 'Sở hữu', cell: (p) => <Badge tone={ownershipTone[p.ownershipType]}>{OwnershipTypeLabels[p.ownershipType]}</Badge> },
        {
          id: 'roles', header: 'Vai trò NB', defaultHidden: true,
          cell: (p) => <span className="text-[13px]">{p.projectRoles.map((r) => ProjectRoleLabels[r]).join(', ') || '—'}</span>,
        },
        { id: 'status', header: 'Trạng thái', sortKey: 'status', cell: (p) => <StatusBadge status={p.status} /> },
        { id: 'order', header: 'Thứ tự', sortKey: 'sortOrder', defaultHidden: true, cell: (p) => p.sortOrder },
        { id: 'updated', header: 'Cập nhật', sortKey: 'updatedAt', cell: (p) => <span className="text-[13px] text-fg-muted">{formatDateTime(p.updatedAt)}</span> },
      ]}
    />
  );
}

export const projectPermissions = Permissions.project;
