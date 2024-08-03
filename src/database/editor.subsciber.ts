import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
} from 'typeorm';

import { EditorEntity } from './editor.entity';

@EventSubscriber()
export class EditorSubscriber
  implements EntitySubscriberInterface<EditorEntity>
{
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return EditorEntity;
  }

  afterLoad(entity: EditorEntity) {
    entity.totalDuration = entity.totalDuration ?? 0;
  }
}
