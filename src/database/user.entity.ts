import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { MonitorEntity } from '@/database/monitor.entity';

export enum Role {
  Administrator = 'administrator',
  MonitorOwner = 'monitor-owner',
  Advertiser = 'advertiser',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @Column()
  @ApiProperty({ example: 'foo@bar.baz' })
  email!: string;

  @Column({ nullable: true })
  @ApiProperty({ example: 'Steve' })
  surname?: string;

  @Column({ nullable: true })
  @ApiProperty({ example: 'John' })
  name?: string;

  @Column({ nullable: true })
  @ApiProperty({ example: 'Doe' })
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
  @ApiProperty({ enum: Role, example: Role.Administrator })
  role!: Role;

  @OneToMany(() => MonitorEntity, (monitor) => monitor.id)
  @JoinColumn()
  monitors!: MonitorEntity[];

  @Column({ nullable: true })
  forgot_confirm_key?: string;

  @Column({ nullable: true })
  email_confirm_key?: string;

  @Column({ type: 'boolean', default: false })
  verified!: boolean;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({ example: true })
  isDemoUser!: boolean;

  @Column({ type: 'float', default: 0 })
  @ApiProperty({ example: 21000000 })
  countUsedSpace!: number;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
