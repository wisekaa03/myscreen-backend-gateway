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

export enum Type {
  MonitorOwnershipDoc = 'monitor-ownership-doc',
  MonitorPhoto = 'monitor-photo',
}

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  originalFilename!: string;

  @Column()
  hash?: string;

  @Column()
  extension!: string;

  @Column({ type: 'enum', enum: Type })
  type!: Type;

  @Column({ type: 'boolean', default: true })
  uploading!: boolean;

  @ManyToOne(() => FolderEntity, (folder) => folder.id)
  @JoinColumn({ name: 'folderId' })
  folders!: FolderEntity; // why folders, folder must be ?

  @ManyToOne(() => MonitorEntity, (monitor) => monitor.id)
  @JoinColumn({ name: 'targetId' })
  monitor!: MonitorEntity;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'ownerId' })
  users!: UserEntity; // why users, user must be ?

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
