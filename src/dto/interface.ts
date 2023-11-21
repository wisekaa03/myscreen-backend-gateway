import { MonitorGroupEntity } from '@/database/monitor.group.entity';
import { PlaylistEntity } from '@/database/playlist.entity';

export type Token = string;

export const dateLocalNow = new Date();

export interface MonitorGroupWithPlaylist extends MonitorGroupEntity {
  playlist: PlaylistEntity;
}
