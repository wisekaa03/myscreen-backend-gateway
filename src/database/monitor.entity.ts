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
import { UserEntity } from '@/user/user.entity';
import { FileEntity } from '@/file/file.entity';

export enum Orientation {
  Horizontal = 'Horizontal',
  Vertical = 'Vertical',
}

@Entity('monitors')
export class MonitorEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ type: 'json' })
  address!: Record<string, string>;

  @Column({ type: 'numeric' })
  category!: number;

  @Column({ type: 'json' })
  price!: unknown;

  @Column({ type: 'enum', enum: Orientation })
  orientation!: Orientation;

  @Column({ type: 'json' })
  monitor!: any;

  @Column({ type: 'boolean', default: false })
  attached?: boolean;

  @Column()
  code!: string;

  // Fuck this
  @Column({ type: 'simple-array', default: [], array: true })
  media!: string[];

  @Column({ default: 'offline' })
  status!: string;

  @Column({ nullable: true })
  last_seen?: string;

  @Column({ type: 'uuid', nullable: true })
  currentPlaylistId?: string;

  @Column({ type: 'float', nullable: true })
  latitude?: number;

  @Column({ type: 'float', nullable: true })
  longitude?: number;

  // @ForeignKey(() => User)
  // @Column(DataType.UUID)
  // ownerId!: string;

  // @BelongsTo(() => User)
  // users?: User;

  @OneToMany(() => FileEntity, (file) => file.id)
  @JoinColumn()
  files?: FileEntity[];

  // @ManyToMany(() => PlaylistEntity)
  // @JoinTable()
  // playlists?: PlaylistEntity[];

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
