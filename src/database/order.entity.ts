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

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'numeric' })
  @Generated('increment')
  seqNo!: number;

  @Column({ type: 'numeric' })
  description!: number;

  // @ForeignKey(() => User)
  // @Column(DataType.UUID)
  // userId!: string;

  // @BelongsTo(() => User)
  // users?: User;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
