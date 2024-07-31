import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  DataSource,
  SelectQueryBuilder,
  ViewColumn,
  ViewEntity,
} from 'typeorm';

import { FileEntity } from './file.entity';
import { FolderEntity } from './folder.entity';
import { Exclude } from 'class-transformer';

@ViewEntity({
  name: 'folder_ext',
  materialized: false,
  expression: (connection: DataSource) =>
    connection
      .createQueryBuilder()
      .select('"folder".*')
      .addSelect('"folderNumber"')
      .addSelect('"fileNumber"')
      .from(FolderEntity, 'folder')
      .leftJoin(
        (qb: SelectQueryBuilder<FileEntity>) =>
          qb
            .select('"file"."folderId"')
            .addSelect('COUNT("file"."id")', 'fileNumber')
            .groupBy('"file"."folderId"')
            .from(FileEntity, 'file'),
        'file',
        '"file"."folderId" = "folder"."id"',
      )
      .leftJoin(
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
  @ApiHideProperty()
  @Exclude()
  fileNumber!: string | null;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  folderNumber!: string | null;

  @ApiProperty({
    type: Boolean,
    description: 'Подчиненные в этой папке',
    example: true,
    required: false,
  })
  empty?: boolean;
}
