import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';

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

  // @ForeignKey(() => Monitors)
  // targetId!: string;

  @Column({ type: 'boolean', default: true })
  uploading!: boolean;

  // @ForeignKey(() => User)
  // ownerId!: string;

  // @ForeignKey(() => Folders)
  // folderId!: string;

  // @BelongsTo(() => Folders)
  // folders?: string[];

  // @BelongsTo(() => Monitors, 'targetId')
  // monitor?: Monitors;

  // @BelongsTo(() => User)
  // users?: string[];

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
