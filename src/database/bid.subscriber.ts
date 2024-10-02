import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
} from 'typeorm';

import { BidEntity } from './bid.entity';

@EventSubscriber()
export class BidSubscriber implements EntitySubscriberInterface<BidEntity> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return BidEntity;
  }

  entity(entity: BidEntity) {
    if (entity?.playlist?.files) {
      entity.playlist.files.forEach((file, index) => {
        entity.playlist.files[index].duration = Number(file.duration);
      });
    }
  }

  afterLoad(entity: BidEntity) {
    this.entity(entity);
  }
}
