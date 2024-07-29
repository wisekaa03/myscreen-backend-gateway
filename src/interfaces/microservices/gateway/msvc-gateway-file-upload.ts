export interface MsvcGatewayFileUpload {
  userId: string;
  folderId: string;
  name: string;
  mimetype: string;
  info?: string;
  buffer: Buffer;
}
