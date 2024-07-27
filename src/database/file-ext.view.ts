import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  AfterLoad,
  DataSource,
  SelectQueryBuilder,
  ViewColumn,
  ViewEntity,
} from 'typeorm';

import { FileEntity } from './file.entity';
import { EditorLayerEntity } from './editor-layer.entity';

@ViewEntity({
  name: 'file_ext',
  materialized: false,
  expression: (connection: DataSource) =>
    connection
      .createQueryBuilder()
      .select('"file".*')
      .from(FileEntity, 'file')
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<EditorLayerEntity>) =>
          qb
            .select('"editorLayer"."fileId"', 'editorLayerFile')
            .addSelect('COUNT(*)', 'editorLayerFileCount')
            .groupBy('"editorLayer"."fileId"')
            .from(EditorLayerEntity, 'editorLayer'),
        'editorLayer',
        '"file"."id" = "editorLayerFile"',
      ),
})
export class FileExtView extends FileEntity {
  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  editorLayerFileCount!: string | null;

  @ApiProperty({
    description: 'Используется',
    required: false,
  })
  used!: boolean;

  @AfterLoad()
  generate() {
    const playlistCount = this.playlists?.length ?? 0;
    const editorCount = Number(this.editorLayerFileCount);

    this.used = playlistCount + editorCount > 0 ? true : false;
  }
}
