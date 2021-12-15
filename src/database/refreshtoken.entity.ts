import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '@/database/user.entity';

@Entity('refresh_token')
@Index('IDX_id_expires', ['id', 'expires'])
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  user!: UserEntity;

  @Column({ type: 'boolean' })
  isRevoked!: boolean;

  @Column({ type: 'timestamp', default: () => 'now()' })
  expires!: Date;

  @Column({ default: '' })
  fingerprint?: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
