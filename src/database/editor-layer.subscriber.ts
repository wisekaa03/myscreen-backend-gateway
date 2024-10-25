import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';

import { EditorLayerEntity } from './editor-layer.entity';

@EventSubscriber()
export class EditorLayerSubscriber
  implements EntitySubscriberInterface<EditorLayerEntity>
{
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return EditorLayerEntity;
  }

  entity(entity: EditorLayerEntity) {
    entity.duration = entity.duration && Number(entity.duration);
    entity.cutFrom = entity.cutFrom && Number(entity.cutFrom);
    entity.cutTo = entity.cutTo && Number(entity.cutTo);
    entity.start = entity.start && Number(entity.start);
    entity.index = entity.index && Number(entity.index);
  }

  beforeInsert(event: InsertEvent<EditorLayerEntity>) {
    this.entity(event.entity);
  }

  beforeUpdate(event: UpdateEvent<EditorLayerEntity>) {
    if (event.entity) {
      this.entity(event.entity as EditorLayerEntity);
    }
  }

  afterLoad(entity: EditorLayerEntity) {
    this.entity(entity);
  }
}
