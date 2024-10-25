import { EditorEntity } from '@/database/editor.entity';

export interface MsvcEditorExport {
  folderId: string;
  editor: EditorEntity;
  customOutputArgs?: string[];
}
