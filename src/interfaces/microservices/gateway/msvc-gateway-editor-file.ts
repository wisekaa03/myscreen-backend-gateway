import { MsvcGatewayFileUpload } from './msvc-gateway-file-upload';

export interface MsvcGatewayEditorFile extends MsvcGatewayFileUpload {
  editorId: string;
  playlistId?: string | null;
}
