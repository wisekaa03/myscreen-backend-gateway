import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
} from 'typeorm';

import { FolderExtView } from './folder-ext.view';

@EventSubscriber()
export class FolderExtSubscriber
  implements EntitySubscriberInterface<FolderExtView>
{
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return FolderExtView;
  }

  afterLoad(entity: FolderExtView) {
    const fileNumber = Number(entity.fileNumber ?? 0);
    const folderNumber = Number(entity.folderNumber ?? 0);

    entity.empty = fileNumber + folderNumber > 0 ? false : true;
  }
}
