import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('folders')
export class FolderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  // @ForeignKey(() => User)
  // @Column(DataType.UUID)
  // userId!: string;

  // @BelongsTo(() => User)
  // users?: User;

  @Column({ type: 'uuid', nullable: true })
  parentFolderId!: string | null;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
