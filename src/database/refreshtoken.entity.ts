import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

export enum Role {
  Administrator = 'administrator',
  MonitorOwner = 'monitor-owner',
  Advertiser = 'advertiser',
}

@Entity('refresh_token')
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToMany(() => UserEntity, (token) => token.id)
  user: UserEntity;

  @Column()
  isRevoked!: boolean;

  @Column({ type: 'timestamp' })
  expires!: Date;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
