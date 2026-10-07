import { toast } from 'sonner';
import { errorMessage } from '@/lib/forms';
import { ACCEPTED_EXTENSIONS, useMediaMutations, type MediaItem } from './api';

const MAX_FILES_PER_REQUEST = 50;

/**
 * Upload nhieu file, bao ket qua tung file (backend co the tu choi tung file rieng le).
 * folderPath (vd "Dự án/PerfectKey Workforce") → backend tu tao cay thu muc va dat file vao do.
 */
export function useUpload() {
  const { upload } = useMediaMutations();

  const run = async (fileList: FileList | File[], folderId: string | null, folderPath?: string): Promise<MediaItem[]> => {
    const files = [...fileList];
    const rejected = files.filter((f) => !ACCEPTED_EXTENSIONS.includes(extension(f.name)));
    const accepted = files.filter((f) => !rejected.includes(f));
    for (const f of rejected) toast.error(`${f.name}: định dạng không được hỗ trợ.`);
    if (accepted.length === 0) return [];

    const uploaded: MediaItem[] = [];
    for (let i = 0; i < accepted.length; i += MAX_FILES_PER_REQUEST) {
      const batch = accepted.slice(i, i + MAX_FILES_PER_REQUEST);
      try {
        const results = await upload.mutateAsync({ files: batch, folderId, folderPath });
        for (const r of results) {
          if (r.success && r.media) uploaded.push(r.media);
          else toast.error(`${r.fileName}: ${r.error}`);
        }
      } catch (error) {
        toast.error(errorMessage(error));
      }
    }

    if (uploaded.length > 0) toast.success(`Đã tải lên ${uploaded.length} file.`);
    return uploaded;
  };

  return { upload: run, isUploading: upload.isPending };
}

function extension(name: string) {
  const dot = name.lastIndexOf('.');
  return dot < 0 ? '' : name.slice(dot).toLowerCase();
}
