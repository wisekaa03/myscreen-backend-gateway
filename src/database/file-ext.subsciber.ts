import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
} from 'typeorm';

import { FileExtView } from './file-ext.view';

@EventSubscriber()
export class FileExtSubscriber
  implements EntitySubscriberInterface<FileExtView>
{
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return FileExtView;
  }

  afterLoad(entity: FileExtView) {
    const playlistCount = Number(entity.playlistFilesFileCount ?? 0);
    const editorCount = Number(entity.editorLayerFileCount ?? 0);

    entity.used = playlistCount + editorCount > 0 ? true : false;
  }
}
