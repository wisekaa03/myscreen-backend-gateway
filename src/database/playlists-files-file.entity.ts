import { Entity, PrimaryColumn } from 'typeorm';

@Entity('playlist_files_file', {
  comment: 'Файлы плейлистов',
  synchronize: false,
})
export class PlaylistFilesFileEntity {
  @PrimaryColumn({ type: 'uuid' })
  playlistId!: string;

  @PrimaryColumn({ type: 'uuid' })
  fileId!: string;
}
