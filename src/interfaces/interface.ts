import { MonitorGroupEntity } from '@/database/monitor.group.entity';
import { PlaylistEntity } from '@/database/playlist.entity';

export type Token = string;

export type MSRangeEnum<T> = Array<T>;
export type MSRange<T> = T | Array<T>;

export interface MonitorGroupWithPlaylist extends MonitorGroupEntity {
  playlist: PlaylistEntity;
}
