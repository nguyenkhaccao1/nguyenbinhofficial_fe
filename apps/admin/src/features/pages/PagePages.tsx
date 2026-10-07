import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, Eye, EyeOff, GripVertical, LayoutTemplate, Plus, Settings2, Trash2 } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { useParams } from 'react-router';
import { formatDateTime, optionsOf, PageTypeLabels, Permissions, type ContentStatus, type PageType, type SeoMeta } from '@nb/shared';
import { usePermission } from '@/auth/session';
import { ContentEditorShell, EditorSection, nullable, StatusBadge, useContentEditor } from '@/components/content/ContentEditor';
import { ContentListPage, TitleCell } from '@/components/content/ContentListPage';
import { SeoFields } from '@/components/content/SeoFields';
import { Button, IconButton } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Badge, EmptyState } from '@/components/ui/Feedback';
import { Field, Input, Select } from '@/components/ui/Form';
import { Tabs } from '@/components/ui/Navigation';
import { cn } from '@/lib/cn';
import { useLookups } from '@/lib/content';
import { BlockFields } from './BlockFields';
import { blockByType, blockRegistry, blockSettingFields, blockSummary, sectionSettingFields } from './blockRegistry';

type Json = Record<string, unknown>;

interface BlockInput {
  type: string;
  isEnabled: boolean;
  data: Json;
  settings: Json;
}

interface SectionInput {
  name: string | null;
  isEnabled: boolean;
  settings: Json;
  blocks: BlockInput[];
}

export interface PageInput {
  title: string;
  path: string;
  pageType: PageType;
  industryId: string | null;
  sections: SectionInput[];
  seo: SeoMeta;
}

interface PageListItem {
  id: string;
  title: string;
  path: string;
  pageType: PageType;
  industryName: string | null;
  sectionCount: number;
  status: ContentStatus;
  updatedAt: string | null;
}

const empty: PageInput = { title: '', path: '', pageType: 'STANDARD', industryId: null, sections: [], seo: {} };
const defaultSectionSettings: Json = { tone: 'light', width: 'content', padding: 'lg', align: 'left', animation: 'fade-up' };

export function PagesPage() {
  return (
    <ContentListPage<PageListItem>
      resource="pages" permission="page" title="Trang & Landing" label="trang" editPath="/content/pages" defaultSort="path"
      description="Trang chủ, trang giới thiệu, landing SEO và landing giải pháp theo ngành — dựng bằng Page Builder."
      filters={[{ key: 'pageType', label: 'Loại trang', options: optionsOf(PageTypeLabels) }]}
      columns={[
        { id: 'title', header: 'Trang', sortKey: 'title', alwaysVisible: true,
          cell: (p) => <TitleCell title={p.title} to={`/content/pages/${p.id}`} subtitle={<span className="font-mono">{p.path}</span>} /> },
        { id: 'type', header: 'Loại', sortKey: 'pageType', cell: (p) => <Badge>{PageTypeLabels[p.pageType]}</Badge> },
        { id: 'sections', header: 'Section', cell: (p) => p.sectionCount },
        { id: 'status', header: 'Trạng thái', sortKey: 'status', cell: (p) => <StatusBadge status={p.status} /> },
        { id: 'updated', header: 'Cập nhật', sortKey: 'updatedAt', cell: (p) => <span className="text-[13px] text-fg-muted">{formatDateTime(p.updatedAt)}</span> },
      ]}
    />
  );
}

type Selection = { section: number; block?: number } | null;

export function PageEditorPage() {
  const { id } = useParams();
  const editor = useContentEditor<PageInput>(
    { resource: 'pages', permission: 'page', label: 'trang', listPath: '/content/pages', empty, autosave: true },
    id === 'new' ? undefined : id,
  );
  const { form } = editor;
  const { register, control, formState: { errors } } = form;
  const lookups = useLookups();
  const [tab, setTab] = useState('builder');
  const title = useWatch({ control, name: 'title' });
  const pageType = useWatch({ control, name: 'pageType' });
  const path = useWatch({ control, name: 'path' });
  const folder = `Trang/${title?.trim() || 'Chưa đặt tên'}`;
  const e = errors as Record<string, { message?: string }>;

  return (
    <ContentEditorShell editor={editor} title={title}>
      <Tabs value={tab} onChange={setTab} items={[
        { key: 'builder', label: <span className="flex items-center gap-1.5">Nội dung trang{e.sections && <span className="size-1.5 rounded-full bg-danger" />}</span> },
        { key: 'settings', label: <span className="flex items-center gap-1.5">Cài đặt trang{(e.title || e.path) && <span className="size-1.5 rounded-full bg-danger" />}</span> },
        { key: 'seo', label: 'SEO' },
      ]}>
        <div className="pt-6">
          {tab === 'builder' && (
            <>
              {e.sections?.message && <p role="alert" className="mb-3 text-[13px] text-danger">{e.sections.message}</p>}
              <PageBuilder folder={folder} />
            </>
          )}
          {tab === 'settings' && (
            <EditorSection title="Thông tin trang">
              <Field label="Tiêu đề" required error={e.title?.message} className="sm:col-span-2">
                {(a) => <Input {...a} {...register('title', { required: 'Vui lòng nhập tiêu đề trang.' })} />}
              </Field>
              <Field label="Loại trang" error={e.pageType?.message}>
                {(a) => <Select {...a} {...register('pageType')}>{optionsOf(PageTypeLabels).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>}
              </Field>
              <Field label="Đường dẫn" error={e.path?.message}
                hint={pageType === 'HOME' ? 'Trang chủ luôn là “/”.' : pageType === 'SOLUTION' ? 'Tự đặt dưới /giai-phap/.' : 'vd /gioi-thieu, /phan-mem-pos-nha-hang'}>
                {(a) => <Input {...a} className="font-mono" disabled={pageType === 'HOME'} placeholder="/duong-dan" {...register('path')} />}
              </Field>
              {pageType === 'SOLUTION' && (
                <Field label="Ngành" hint="Trang giải pháp hiển thị dự án/sản phẩm cùng ngành.">
                  {(a) => (
                    <Select {...a} {...register('industryId', nullable)}>
                      <option value="">— Chọn ngành —</option>
                      {lookups.data?.industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </Select>
                  )}
                </Field>
              )}
              {pageType === 'LANDING' && (
                <p className="rounded-md bg-warning-soft px-3 py-2 text-[13px] text-warning sm:col-span-2">
                  Landing SEO cần nội dung giá trị thật, khác biệt với các landing khác — không nhân bản hàng loạt trang na ná nhau.
                </p>
              )}
              {path && <p className="text-[13px] text-fg-muted sm:col-span-2">Địa chỉ: <span className="font-mono">{pageType === 'HOME' ? '/' : path}</span></p>}
            </EditorSection>
          )}
          {tab === 'seo' && (
            <SeoFields register={register} control={control} folderPath={folder} fallbackTitle={title}
              errors={errors.seo as Record<string, { message?: string }> | undefined} />
          )}
        </div>
      </Tabs>
    </ContentEditorShell>
  );
}

/** Canvas (trai) + inspector (phai). Keo tha section/block, bat tat, nhan ban, xoa. */
function PageBuilder({ folder }: { folder: string }) {
  const { control, getValues, setValue } = useFormContext<PageInput>();
  const sections = useFieldArray({ control, name: 'sections' });
  const [selected, setSelected] = useState<Selection>(null);
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const onSectionDrag = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = sections.fields.findIndex((f) => f.id === active.id);
    const to = sections.fields.findIndex((f) => f.id === over.id);
    sections.move(from, to);
    setSelected((s) => (s && s.section === from ? { ...s, section: to } : null));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0 space-y-3">
        {sections.fields.length === 0 && (
          <EmptyState icon={<LayoutTemplate />} title="Trang chưa có section" description="Thêm section rồi thêm block (Hero, dự án, CTA…) vào section." />
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSectionDrag}>
          <SortableContext items={sections.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            {sections.fields.map((field, s) => (
              <SectionCard key={field.id} id={field.id} index={s} selected={selected} onSelect={setSelected}
                onDuplicate={() => {
                  const copy = structuredClone(getValues(`sections.${s}`));
                  sections.insert(s + 1, { ...copy, name: `${copy.name ?? 'Section'} (bản sao)` });
                }}
                onRemove={() => {
                  sections.remove(s);
                  setSelected(null);
                }}
                onAddBlock={() => setPickerFor(s)} />
            ))}
          </SortableContext>
        </DndContext>
        <Button variant="secondary" icon={<Plus className="size-4" />}
          onClick={() => {
            sections.append({ name: `Section ${sections.fields.length + 1}`, isEnabled: true, settings: { ...defaultSectionSettings }, blocks: [] });
            setSelected({ section: sections.fields.length });
          }}>Thêm section</Button>
      </div>

      <aside className="xl:sticky xl:top-36 xl:max-h-[calc(100vh-10rem)] xl:overflow-y-auto">
        <Inspector selected={selected} folder={folder} />
      </aside>

      {pickerFor !== null && (
        <BlockPicker onClose={() => setPickerFor(null)} onPick={(type) => {
          const def = blockByType.get(type)!;
          const blocks = getValues(`sections.${pickerFor}.blocks`) ?? [];
          const next = [...blocks, { type, isEnabled: true, data: structuredClone(def.defaults), settings: {} }];
          setValue(`sections.${pickerFor}.blocks`, next, { shouldDirty: true });
          setSelected({ section: pickerFor, block: next.length - 1 });
          setPickerFor(null);
        }} />
      )}
    </div>
  );
}

function SectionCard({ id, index, selected, onSelect, onDuplicate, onRemove, onAddBlock }: {
  id: string; index: number; selected: Selection; onSelect: (s: Selection) => void;
  onDuplicate: () => void; onRemove: () => void; onAddBlock: () => void;
}) {
  const { control, register, setValue, getValues } = useFormContext<PageInput>();
  const blocks = useFieldArray({ control, name: `sections.${index}.blocks` });
  const name = useWatch({ control, name: `sections.${index}.name` });
  const enabled = useWatch({ control, name: `sections.${index}.isEnabled` });
  const tone = useWatch({ control, name: `sections.${index}.settings.tone` }) as string | undefined;
  const sortable = useSortable({ id });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const isSelected = selected?.section === index && selected.block === undefined;

  const onBlockDrag = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = blocks.fields.findIndex((f) => f.id === active.id);
    const to = blocks.fields.findIndex((f) => f.id === over.id);
    blocks.move(from, to);
    onSelect({ section: index, block: to });
  };

  return (
    <div ref={sortable.setNodeRef} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
      className={cn('rounded-lg border bg-white', isSelected ? 'border-primary ring-2 ring-primary/15' : 'border-border',
        !enabled && 'opacity-60', sortable.isDragging && 'z-10 shadow-lg')}>
      <div className={cn('flex items-center gap-2 rounded-t-lg border-b border-border px-3 py-2', tone === 'dark' ? 'bg-dark text-white' : tone === 'subtle' ? 'bg-bg-subtle' : 'bg-white')}>
        <button type="button" className="cursor-grab touch-none text-current/60" aria-label={`Kéo để sắp xếp section ${index + 1}`}
          {...sortable.attributes} {...sortable.listeners}><GripVertical className="size-4" /></button>
        <input aria-label="Tên section" className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" placeholder={`Section ${index + 1}`}
          {...register(`sections.${index}.name`)} />
        {!enabled && <Badge>Đang tắt</Badge>}
        <SectionAction label="Cài đặt section" active={isSelected} onClick={() => onSelect({ section: index })}><Settings2 /></SectionAction>
        <SectionAction label={enabled ? 'Tắt section' : 'Bật section'}
          onClick={() => setValue(`sections.${index}.isEnabled`, !enabled, { shouldDirty: true })}>{enabled ? <Eye /> : <EyeOff />}</SectionAction>
        <SectionAction label="Nhân bản section" onClick={onDuplicate}><Copy /></SectionAction>
        <SectionAction label={`Xoá section ${name ?? ''}`} onClick={onRemove}><Trash2 /></SectionAction>
      </div>

      <div className="space-y-1.5 p-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onBlockDrag}>
          <SortableContext items={blocks.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            {blocks.fields.map((b, i) => (
              <BlockRow key={b.id} id={b.id} section={index} index={i}
                selected={selected?.section === index && selected.block === i}
                onSelect={() => onSelect({ section: index, block: i })}
                onDuplicate={() => {
                  const copy = structuredClone(getValues(`sections.${index}.blocks.${i}`));
                  blocks.insert(i + 1, copy);
                }}
                onRemove={() => {
                  blocks.remove(i);
                  onSelect({ section: index });
                }} />
            ))}
          </SortableContext>
        </DndContext>
        <button type="button" onClick={onAddBlock}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-[13px] text-fg-muted hover:border-primary hover:text-primary">
          <Plus className="size-4" /> Thêm block
        </button>
      </div>
    </div>
  );
}

function SectionAction({ label, onClick, children, active }: { label: string; onClick: () => void; children: ReactNode; active?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick}
      className={cn('grid size-7 place-items-center rounded hover:bg-black/10 [&>svg]:size-4', active && 'bg-black/10')}>{children}</button>
  );
}

function BlockRow({ id, section, index, selected, onSelect, onDuplicate, onRemove }: {
  id: string; section: number; index: number; selected: boolean; onSelect: () => void; onDuplicate: () => void; onRemove: () => void;
}) {
  const { control, setValue } = useFormContext<PageInput>();
  const block = useWatch({ control, name: `sections.${section}.blocks.${index}` }) as BlockInput | undefined;
  const sortable = useSortable({ id });
  const canCustomHtml = usePermission(Permissions.page.customHtml);
  if (!block) return null;
  const def = blockByType.get(block.type);
  const locked = block.type === 'CUSTOM_HTML' && !canCustomHtml;

  return (
    <div ref={sortable.setNodeRef} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
      className={cn('flex items-center gap-2 rounded-md border px-2 py-1.5', selected ? 'border-primary bg-primary-soft/40' : 'border-border bg-bg-subtle/40 hover:border-fg/20',
        !block.isEnabled && 'opacity-60')}>
      <button type="button" className="cursor-grab touch-none text-fg-muted" aria-label={`Kéo để sắp xếp block ${def?.label ?? block.type}`}
        {...sortable.attributes} {...sortable.listeners}><GripVertical className="size-4" /></button>
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onSelect} disabled={locked}>
        <span className="text-[13px] font-medium">{def?.label ?? block.type}</span>
        <span className="ml-2 truncate text-xs text-fg-muted">{blockSummary(block.type, block.data)}</span>
        {locked && <span className="ml-2 text-xs text-warning">(cần quyền Custom HTML)</span>}
      </button>
      <IconButton label={block.isEnabled ? 'Tắt block' : 'Bật block'} className="size-7 w-7"
        icon={block.isEnabled ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
        onClick={() => setValue(`sections.${section}.blocks.${index}.isEnabled`, !block.isEnabled, { shouldDirty: true })} />
      {!locked && <IconButton label="Nhân bản block" className="size-7 w-7" icon={<Copy className="size-3.5" />} onClick={onDuplicate} />}
      {!locked && <IconButton label="Xoá block" className="size-7 w-7 text-danger" icon={<Trash2 className="size-3.5" />} onClick={onRemove} />}
    </div>
  );
}

function Inspector({ selected, folder }: { selected: Selection; folder: string }) {
  const { control } = useFormContext<PageInput>();
  const blockType = useWatch({ control, name: selected?.block !== undefined ? `sections.${selected.section}.blocks.${selected.block}.type` : 'title' }) as string;
  const [tab, setTab] = useState('content');

  if (!selected) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-[13px] text-fg-muted">
        Chọn một section hoặc block để chỉnh nội dung và giao diện.
      </div>
    );
  }

  if (selected.block === undefined) {
    return (
      <div className="rounded-lg border border-border bg-white p-4">
        <h3 className="mb-4 font-semibold">Cài đặt section</h3>
        <BlockFields key={`s-${selected.section}`} fields={sectionSettingFields} prefix={`sections.${selected.section}.settings`} folder={folder} />
      </div>
    );
  }

  const def = blockByType.get(blockType);
  const prefix = `sections.${selected.section}.blocks.${selected.block}`;
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <h3 className="font-semibold">{def?.label ?? blockType}</h3>
      {def?.description && <p className="mt-0.5 mb-3 text-[13px] text-fg-muted">{def.description}</p>}
      <Tabs value={tab} onChange={setTab} items={[{ key: 'content', label: 'Nội dung' }, { key: 'style', label: 'Hiển thị' }]}>
        <div className="pt-3" key={prefix}>
          {tab === 'content'
            ? def ? <BlockFields fields={def.fields} prefix={`${prefix}.data`} folder={folder} /> : <p className="text-[13px] text-danger">Loại block không xác định.</p>
            : <BlockFields fields={blockSettingFields} prefix={`${prefix}.settings`} folder={folder} />}
        </div>
      </Tabs>
    </div>
  );
}

function BlockPicker({ onClose, onPick }: { onClose: () => void; onPick: (type: string) => void }) {
  const canCustomHtml = usePermission(Permissions.page.customHtml);
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const map = new Map<string, typeof blockRegistry>();
    for (const b of blockRegistry) {
      if (b.type === 'CUSTOM_HTML' && !canCustomHtml) continue;
      if (q && !`${b.label} ${b.description}`.toLowerCase().includes(q.toLowerCase())) continue;
      map.set(b.category, [...(map.get(b.category) ?? []), b]);
    }
    return [...map.entries()];
  }, [q, canCustomHtml]);

  return (
    <Dialog open onClose={onClose} size="lg" title="Thêm block">
      <Input autoFocus aria-label="Tìm block" placeholder="Tìm block…" className="mb-4 h-9" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="space-y-5">
        {groups.map(([category, blocks]) => (
          <div key={category}>
            <p className="mb-2 text-xs font-semibold tracking-wider text-fg-muted uppercase">{category}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {blocks.map((b) => (
                <button key={b.type} type="button" onClick={() => onPick(b.type)}
                  className="rounded-md border border-border p-3 text-left hover:border-primary hover:bg-primary-soft/40">
                  <span className="block font-medium">{b.label}</span>
                  <span className="block text-xs text-fg-muted">{b.description}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
