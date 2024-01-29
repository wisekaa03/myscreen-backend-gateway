import { MonitorGroupEntity } from '@/database/monitor.group.entity';
import { PlaylistEntity } from '@/database/playlist.entity';

export type Token = string;

// export type MSRange<T> = [T, T] | T;
export type MSRange<T> = [T, T];

export interface MonitorGroupWithPlaylist extends MonitorGroupEntity {
  playlist: PlaylistEntity;
}
