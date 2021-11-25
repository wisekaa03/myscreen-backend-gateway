import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from '@/database/user.entity';
import { MonitorEntity } from '@/database/monitor.entity';
import { FolderEntity } from '@/database/folder.entity';
import { FileType } from './enums/file-type.enum';

@Entity('file')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column()
  originalFilename!: string;

  @Column()
  hash?: string;

  @Column()
  extension!: string;

  @Column({ type: 'enum', enum: FileType })
  type!: FileType;

  @Column({ type: 'boolean', default: true })
  uploading!: boolean;

  @ManyToOne(() => FolderEntity, (folder) => folder.id)
  @JoinColumn()
  folder!: FolderEntity;

  @ManyToOne(() => MonitorEntity, (monitor) => monitor.id)
  @JoinColumn()
  monitor!: MonitorEntity;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  user!: UserEntity;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
