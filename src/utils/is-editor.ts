import { EditorEntity } from '@/database/editor.entity';

export const isEditor = (editor: any): editor is EditorEntity => {
  return (
    typeof editor === 'object' &&
    typeof editor.name === 'string' &&
    typeof editor.width === 'number' &&
    typeof editor.height === 'number' &&
    editor.renderingStatus !== undefined &&
    typeof editor.playlist === 'object' &&
    typeof editor.videoLayers === 'object' &&
    typeof editor.audioLayers === 'object' &&
    typeof editor.user === 'object'
  );
};
