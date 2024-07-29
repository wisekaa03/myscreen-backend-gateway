import { EditorEntity } from '@/database/editor.entity';

export interface MsvcEditorExport {
  editor: EditorEntity;
  customOutputArgs: string[];
}
