import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
} from 'typeorm';

import { FileEntity } from './file.entity';

@EventSubscriber()
export class FileSubscriber implements EntitySubscriberInterface<FileEntity> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return FileEntity;
  }

  afterLoad(entity: FileEntity) {
    entity.duration = entity.duration ?? 0;
  }
}
