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
import { UserEntity } from '@/database/user.entity';
import { PlaylistEntity } from '@/database/playlist.entity';

@Entity('video')
export class VideoEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  hash!: true;

  @Column({ nullable: true })
  originalName?: string;

  @Column({ type: 'integer' })
  duration!: number;

  @Column({ type: 'integer' })
  filesize!: number;

  @Column({ nullable: true })
  preview?: string;

  @Column()
  extension!: string;

  @Column({ type: 'integer' })
  width!: number;

  @Column({ type: 'integer' })
  height!: number;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  user!: UserEntity;

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
