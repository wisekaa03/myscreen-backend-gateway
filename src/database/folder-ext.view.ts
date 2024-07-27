import { ApiProperty } from '@nestjs/swagger';
import {
  AfterLoad,
  DataSource,
  SelectQueryBuilder,
  ViewColumn,
  ViewEntity,
} from 'typeorm';

import { FileEntity } from './file.entity';
import { FolderEntity } from './folder.entity';

@ViewEntity({
  name: 'folder_ext',
  materialized: false,
  expression: (connection: DataSource) =>
    connection
      .createQueryBuilder()
      .select('"folder".*')
      .from(FolderEntity, 'folder')
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<FileEntity>) =>
          qb
            .select('"file"."folderId"')
            .addSelect('COUNT("file"."id")', 'fileNumber')
            .groupBy('"file"."folderId"')
            .from(FileEntity, 'file'),
        'file',
        '"file"."folderId" = "folder"."id"',
      )
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<FolderEntity>) =>
          qb
            .select('"folder"."parentFolderId"', 'subParentFolderId')
            .addSelect('COUNT("folder"."id")', 'folderNumber')
            .groupBy('"subParentFolderId"')
            .from(FolderEntity, 'folder'),
        'folderSub',
        '"folderSub"."subParentFolderId" = "folder"."id"',
      ),
})
export class FolderExtView extends FolderEntity {
  @ViewColumn()
  fileNumber?: number | null;

  @ViewColumn()
  folderNumber?: number | null;

  @ApiProperty({
    type: Boolean,
    description: 'Подчиненные в этой папке',
    example: true,
    required: false,
  })
  empty?: boolean;

  @AfterLoad()
  after() {
    const fileNumber = parseInt(
      (this.fileNumber as unknown as string) ?? '0',
      10,
    );
    const folderNumber = parseInt(
      (this.folderNumber as unknown as string) ?? '0',
      10,
    );
    this.fileNumber = undefined;
    this.folderNumber = undefined;
    if (fileNumber > 0 || folderNumber > 0) {
      this.empty = false;
    } else {
      this.empty = true;
    }
  }
}
