import { EntityManager, FindManyOptions, FindOneOptions } from 'typeorm';

import { MonitorGroupEntity } from '@/database/monitor.group.entity';
import { PlaylistEntity } from '@/database/playlist.entity';

export type Token = string;

export type MSRangeEnum<T> = T[];
export type MSRange<T> = T | T[];

export interface MonitorGroupWithPlaylist
  extends Pick<
    MonitorGroupEntity,
    | 'id'
    | 'col'
    | 'row'
    | 'parentMonitor'
    | 'parentMonitorId'
    | 'user'
    | 'userId'
  > {
  playlist: PlaylistEntity;
}

export interface FindManyOptionsExt<T> extends FindManyOptions<T> {
  caseInsensitive?: boolean;
  fromView?: boolean;
  signedUrl?: boolean;
  userId?: string;
  role?: string;
  transact?: EntityManager;
}

export interface FindOneOptionsExt<T> extends FindOneOptions<T> {
  caseInsensitive?: boolean;
  fromView?: boolean;
  signedUrl?: boolean;
  userId?: string;
  role?: string;
  transact?: EntityManager;
}
