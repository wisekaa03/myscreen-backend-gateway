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
import { PlaylistFilesFileEntity } from './playlists-files-file.entity';

@ViewEntity({
  name: 'file_ext',
  materialized: false,
  expression: (connection: DataSource) =>
    connection
      .createQueryBuilder()
      .select('"editorLayerFileCount"')
      .addSelect('"playlistFilesFileCount"')
      .addSelect('"file".*')
      .from(FileEntity, 'file')
      .leftJoin(
        (qb: SelectQueryBuilder<EditorLayerEntity>) =>
          qb
            .select('"editorLayer"."fileId"', 'editorLayerFile')
            .addSelect('COUNT(*)', 'editorLayerFileCount')
            .groupBy('"editorLayer"."fileId"')
            .from(EditorLayerEntity, 'editorLayer'),
        'editorLayer',
        '"file"."id" = "editorLayerFile"',
      )
      .leftJoin(
        (qb: SelectQueryBuilder<PlaylistFilesFileEntity>) =>
          qb
            .select('"playlistFilesFile"."fileId"', 'playlistFilesFileFileId')
            .addSelect('COUNT(*)', 'playlistFilesFileCount')
            .groupBy('"playlistFilesFile"."fileId"')
            .from(PlaylistFilesFileEntity, 'playlistFilesFile'),
        'playlistFilesFile',
        '"file"."id" = "playlistFilesFileFileId"',
      ),
})
export class FileExtView extends FileEntity {
  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  editorLayerFileCount!: string | null;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  playlistFilesFileCount!: string | null;

  @ApiProperty({
    description: 'Используется',
    required: false,
  })
  used!: boolean;

  @AfterLoad()
  generate() {
    const playlistCount = Number(this.playlistFilesFileCount ?? 0);
    const editorCount = Number(this.editorLayerFileCount ?? 0);

    this.used = playlistCount + editorCount > 0 ? true : false;
  }
}
