import { SpecificFormat } from '@/enums/specific-format.enum';
import { type WebSocket } from 'ws';
import { WebSocketClient } from '@/websocket/interface';

export const MAIL_SERVICE = 'MAIL_SERVICE';
export const FORM_SERVICE = 'FORM_SERVICE';
export const EDITOR_SERVICE = 'EDITOR_EXPORT_SERVICE';
export const FILE_SERVICE = 'FILE_SERVICE';

export const dateLocalNow = new Date();

export const administratorFolderId = '00000000-0000-0000-0000-000000000000';
export const administratorFolderName = '<Администраторская папка>';

export const formatToContentType: Record<SpecificFormat, string> = {
  [SpecificFormat.PDF]: 'application/pdf',
  [SpecificFormat.XLSX]: 'application/vnd.ms-excel',
};

export const wsClients = new Map<WebSocket, WebSocketClient>();
