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
export class FolderFileNumberEntity extends FolderEntity {
  @ViewColumn()
  @ApiProperty({
    type: Number,
    description: 'Число файлов в папке',
    example: 0,
    required: false,
  })
  fileNumber?: number | null;

  @ViewColumn()
  @ApiProperty({
    type: Number,
    description: 'Число папок в папке',
    example: 0,
    required: false,
  })
  folderNumber?: number | null;

  @AfterLoad()
  after() {
    this.fileNumber = parseInt(
      (this.fileNumber as unknown as string) ?? '0',
      10,
    );
    this.folderNumber = parseInt(
      (this.folderNumber as unknown as string) ?? '0',
      10,
    );
  }
}
