import { FindManyOptions, FindOneOptions } from 'typeorm';

import { MonitorGroupEntity } from '@/database/monitor.group.entity';
import { PlaylistEntity } from '@/database/playlist.entity';

export type Token = string;

export type MSRangeEnum<T> = Array<T>;
export type MSRange<T> = T | Array<T>;

export interface MonitorGroupWithPlaylist extends MonitorGroupEntity {
  playlist: PlaylistEntity;
}

export interface FindManyOptionsCaseInsensitive<T> extends FindManyOptions<T> {
  caseInsensitive?: boolean;
}

export interface FindOneOptionsCaseInsensitive<T> extends FindOneOptions<T> {
  caseInsensitive?: boolean;
}
