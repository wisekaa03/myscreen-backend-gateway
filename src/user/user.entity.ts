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
import { MonitorEntity } from '@/monitor/monitor.entity';
import { genKey } from '../shared/utils';

enum Role {
  Administrator = 'administrator',
  MonitorOwner = 'monitor-owner',
  Advertiser = 'advertiser',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string;

  @Column({ nullable: true })
  surname?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  middleName?: string;

  @Column()
  password!: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ default: 'RU', nullable: true })
  country?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  company?: string;

  @Column({ type: 'enum', enum: Role })
  role!: Role;

  @OneToMany(() => MonitorEntity, (monitor) => monitor.id)
  @JoinColumn()
  monitors!: MonitorEntity[];

  @Column({ nullable: true })
  forgot_confirm_key?: string;

  @Column({ nullable: true })
  email_confirm_key?: string;

  @Column({ default: false })
  verified!: boolean;

  @Column({ default: false })
  isDemoUser!: boolean;

  @Column({ type: 'float', default: 0 })
  countUsedSpace!: number;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
