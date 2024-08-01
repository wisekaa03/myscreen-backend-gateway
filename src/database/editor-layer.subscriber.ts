import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
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

  afterLoad(entity: EditorLayerEntity) {
    entity.start = Number(entity.start || 0);
    entity.duration = Number(entity.duration || 0);
    entity.cutFrom = Number(entity.cutFrom);
    entity.cutTo = Number(entity.cutTo);
  }
}
