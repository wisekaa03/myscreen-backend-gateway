import { ApiProperty } from '@nestjs/swagger';
import {
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
      ),
})
export class FolderFileNumberEntity extends FolderEntity {
  @ViewColumn()
  @ApiProperty({
    type: String,
    description: 'Число файлов в папке',
    example: 0,
    required: false,
  })
  fileNumber?: number;
}
