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

import { IsEmail, IsUUID } from 'class-validator';
import { MonitorEntity } from '@/database/monitor.entity';
import { UserRole, UserRoleEnum } from './enums/role.enum';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор пользователя',
    format: 'uuid',
    example: '1234567',
  })
  @IsUUID()
  id!: string;

  @Column({ unique: true })
  @ApiProperty({
    description: 'EMail пользователя',
    format: 'email',
    example: 'foo@bar.baz',
  })
  @IsEmail()
  email!: string;

  @Index()
  @Column({ type: 'boolean', default: false })
  @ApiHideProperty()
  disabled!: boolean;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Фамилия', example: 'Steve', required: false })
  surname?: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Имя', example: 'John', required: false })
  name?: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Отчество', example: 'Doe', required: false })
  middleName?: string;

  @Column()
  password?: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Телефон пользователя',
    example: '+78002000000',
    required: false,
  })
  phoneNumber?: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Город', example: 'Krasnodar', required: false })
  city?: string;

  @Column({ default: 'RU', nullable: true })
  @ApiProperty({ description: 'Страна', example: 'RU', required: false })
  country?: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Компания',
    example: 'ACME corporation',
    required: false,
  })
  company?: string;

  @Column({ type: 'enum', enum: UserRoleEnum })
  @ApiProperty({
    description: 'Роль пользователя',
    enum: UserRole,
    type: UserRole,
    example: UserRoleEnum.Advertiser,
  })
  role!: UserRoleEnum;

  @Column({ type: 'varchar', nullable: true })
  forgotConfirmKey?: string | null;

  @Column({ type: 'varchar', nullable: true })
  emailConfirmKey?: string | null;

  @OneToMany(() => MonitorEntity, (monitor) => monitor.id)
  @JoinColumn()
  monitors?: MonitorEntity[];

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description: 'EMail подтвержден',
    example: true,
    required: false,
  })
  verified!: boolean;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description: 'Демо пользователь',
    example: true,
    required: false,
  })
  isDemoUser!: boolean;

  @Column({ type: 'float', default: 0 })
  @ApiProperty({
    description: 'Использованное место',
    example: 21000000,
    required: false,
  })
  countUsedSpace!: number;

  @CreateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T10:00:00.147Z',
    required: false,
  })
  createdAt?: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T10:00:00.147Z',
    required: false,
  })
  updatedAt?: Date;
}
