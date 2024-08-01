import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
} from 'typeorm';

import { MonitorEntity } from './monitor.entity';

@EventSubscriber()
export class MonitorSubscriber
  implements EntitySubscriberInterface<MonitorEntity>
{
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return MonitorEntity;
  }

  afterLoad(entity: MonitorEntity) {
    entity.price1s = Number(entity.price1s);
  }
}
