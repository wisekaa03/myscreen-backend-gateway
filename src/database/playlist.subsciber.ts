import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';

import { MonitorStatus, PlaylistStatusEnum } from '@/enums';
import { PlaylistEntity } from './playlist.entity';

@EventSubscriber()
export class MonitorSubscriber
  implements EntitySubscriberInterface<PlaylistEntity>
{
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return PlaylistEntity;
  }

  entity(entity: PlaylistEntity) {
    if (entity.monitors) {
      const monitorStatus = entity.monitors.filter(
        (monitor) => monitor.status === MonitorStatus.Online,
      );
      const monitorPlayed = entity.monitors.filter(
        (monitor) => monitor.playlistPlayed,
      );
      if (monitorPlayed.length > 0) {
        entity.status = PlaylistStatusEnum.Broadcast;
      } else if (monitorStatus.length > 0) {
        entity.status = PlaylistStatusEnum.NoBroadcast;
      } else {
        entity.status = PlaylistStatusEnum.Offline;
      }
    }
  }

  beforeUpdate(event: UpdateEvent<PlaylistEntity>) {
    if (event.entity) {
      this.entity(event.entity as PlaylistEntity);
    }
  }

  beforeInsert(event: InsertEvent<PlaylistEntity>) {
    this.entity(event.entity);
  }

  afterLoad(entity: PlaylistEntity) {
    this.entity(entity);
  }
}
