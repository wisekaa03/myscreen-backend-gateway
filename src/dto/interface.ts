import { MonitorMultipleEntity } from '@/database/monitor.multiple.entity';
import { PlaylistEntity } from '@/database/playlist.entity';

export type Token = string;

export const dateLocalNow = new Date();

export interface MonitorMultipleWithPlaylist extends MonitorMultipleEntity {
  playlist: PlaylistEntity;
}
