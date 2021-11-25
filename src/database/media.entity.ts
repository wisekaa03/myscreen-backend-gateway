import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FolderEntity } from '@/database/folder.entity';
import { UserEntity } from '@/database/user.entity';
import { EditorEntity } from '@/database/editor.entity';
import { PlaylistEntity } from '@/database/playlist.entity';
import { VideoType } from './enums/video-type.enum';

@Entity('media')
export class MediaEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column()
  originalName!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  hash?: string;

  @Column({ type: 'enum', enum: VideoType })
  type!: VideoType;

  @Column({ type: 'json', nullable: true })
  meta?: { duration: number; filesize: number };

  @ManyToOne(() => FolderEntity, (folder) => folder.id, { nullable: false })
  @JoinColumn()
  folder!: FolderEntity;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  user!: UserEntity;

  @ManyToMany(() => EditorEntity, (editor) => editor.id, { cascade: true })
  @JoinTable()
  editors!: EditorEntity[];

  @ManyToMany(() => PlaylistEntity, (playlist) => playlist.id, {
    cascade: true,
  })
  @JoinTable()
  playlists!: PlaylistEntity[];

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
