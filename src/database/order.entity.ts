import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '@/database/user.entity';

@Entity('order')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Generated('increment')
  @Column({ type: 'integer' })
  seqNo!: number;

  @Column({ type: 'numeric' })
  description!: number;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn()
  user!: UserEntity;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
