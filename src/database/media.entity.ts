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

export enum Type {
  Video = 'video',
  Image = 'image',
  Audio = 'audio',
}

@Entity('media')
export class MediaEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  original_name!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  hash?: string;

  @Column({ type: 'enum', enum: Type })
  type!: Type;

  @Column({ type: 'json', nullable: true })
  meta?: { duration: number; filesize: number };

  @ManyToOne(() => FolderEntity, (folder) => folder.id, { nullable: false })
  @JoinColumn()
  folder!: FolderEntity;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'ownerId' })
  users!: UserEntity; // why users, user must be ?

  @ManyToMany(() => EditorEntity, (editor) => editor.id)
  @JoinTable({ name: 'media_editor_map' })
  editors!: EditorEntity; // why editors, editor must be ?

  @ManyToMany(() => PlaylistEntity, (playlist) => playlist.id)
  @JoinTable({ name: 'media_playlist_map' })
  playlist!: PlaylistEntity;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
