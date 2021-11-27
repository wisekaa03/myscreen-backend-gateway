import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { MonitorEntity } from '@/database/monitor.entity';
import { UserRole } from './enums/role.enum';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiHideProperty()
  id?: string;

  @Column({ unique: true })
  @ApiProperty({ example: 'foo@bar.baz' })
  email!: string;

  @Index()
  @Column({ type: 'boolean', default: false })
  @ApiHideProperty()
  disabled: boolean;

  @Column({ nullable: true })
  @ApiProperty({ example: 'Steve', required: false })
  surname?: string;

  @Column({ nullable: true })
  @ApiProperty({ example: 'John', required: false })
  name?: string;

  @Column({ nullable: true })
  @ApiProperty({ example: 'Doe', required: false })
  middleName?: string;

  @Column()
  @ApiHideProperty()
  password!: string;

  @Column({ nullable: true })
  @ApiProperty({ example: '+78002000000', required: false })
  phoneNumber?: string;

  @Column({ default: 'RU', nullable: true })
  @ApiProperty({ example: 'RU', required: false })
  country?: string;

  @Column({ nullable: true })
  @ApiProperty({ example: 'Moscow', required: false })
  city?: string;

  @Column({ nullable: true })
  @ApiProperty({ example: 'Acme company Ltd', required: false })
  company?: string;

  @Column({ type: 'enum', enum: UserRole })
  @ApiProperty({ enum: UserRole, example: UserRole.Administrator })
  role!: UserRole;

  @OneToMany(() => MonitorEntity, (monitor) => monitor.id)
  @JoinColumn()
  @ApiHideProperty()
  monitors?: MonitorEntity[];

  @Column({ nullable: true })
  @ApiHideProperty()
  forgotConfirmKey?: string;

  @Column({ nullable: true })
  @ApiHideProperty()
  emailConfirmKey?: string;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({ example: true, required: false })
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
