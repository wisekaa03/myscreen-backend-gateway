import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsUUID } from 'class-validator';

import { IsDateStringOrNull } from '../shared/is-date-string-or-null';
import { ApplicationApproved } from '../enums/application-approved.enum';
import { UserEntity } from './user.entity';
import { MonitorEntity } from './monitor.entity';
import { PlaylistEntity } from './playlist.entity';

@Entity('application')
export class ApplicationEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор взаимодействия',
    format: 'uuid',
  })
  @IsUUID()
  id?: string;

  @ManyToOne(() => UserEntity, (buyer) => buyer.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
    cascade: true,
    eager: true,
  })
  @JoinColumn()
  @ApiProperty({
    description: 'Покупатель',
    type: 'string',
    allOf: [{ $ref: '#/components/schemas/UserExtEntity' }],
  })
  buyer!: UserEntity | null;

  @Column({ select: false, nullable: true })
  @ApiProperty({
    description: 'Покупатель ID',
    format: 'uuid',
    nullable: true,
    required: false,
  })
  @IsUUID()
  buyerId!: string | null;

  @ManyToOne(() => UserEntity, (seller) => seller.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: true,
  })
  @JoinColumn()
  @ApiProperty({
    description: 'Продавец',
    type: 'string',
    allOf: [{ $ref: '#/components/schemas/UserExtEntity' }],
  })
  seller!: UserEntity;

  @Column({ select: false })
  @ApiProperty({
    description: 'Продавец ID',
    format: 'uuid',
    required: false,
  })
  @IsUUID()
  sellerId!: string;

  @ManyToOne(() => MonitorEntity, (monitor) => monitor.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: true,
  })
  @JoinColumn()
  @ApiProperty({
    description: 'Монитор',
    type: 'string',
    allOf: [{ $ref: '#/components/schemas/MonitorResponse' }],
  })
  monitor!: MonitorEntity;

  @Column({ select: false })
  @IsUUID()
  @ApiProperty({
    description: 'Монитор ID',
    format: 'uuid',
  })
  monitorId!: string;

  @ManyToOne(() => PlaylistEntity, (playlist) => playlist.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: true,
  })
  @JoinColumn()
  @ApiProperty({
    description: 'Плэйлист',
    type: 'string',
    allOf: [{ $ref: '#/components/schemas/PlaylistResponse' }],
  })
  playlist!: PlaylistEntity;

  @Column({ select: false })
  @IsUUID()
  @ApiProperty({
    description: 'Плэйлист ID',
    format: 'uuid',
  })
  playlistId!: string;

  @Column({
    type: 'enum',
    enum: ApplicationApproved,
    default: ApplicationApproved.NotProcessed,
  })
  @Index()
  @ApiProperty({
    description: 'Не обработан / Разрешен / Запрещен',
    enum: ApplicationApproved,
    enumName: 'ApplicationApproved',
    example: ApplicationApproved.NotProcessed,
    required: true,
  })
  @IsEnum(ApplicationApproved, { each: true })
  approved!: ApplicationApproved | Array<ApplicationApproved>;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'Время когда',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDateString({ strict: false })
  dateWhen!: Date;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  @Index()
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'Время до',
    example: '2021-10-01T10:00:00.147Z',
    nullable: true,
    required: false,
  })
  @IsDateStringOrNull({ strict: false })
  dateBefore!: Date | null;

  @Column({ type: 'boolean', nullable: false, default: false })
  @ApiProperty({
    description: 'Смена текущего плэйлиста: сразу/когда закончится',
    example: false,
    required: true,
  })
  @IsBoolean()
  playlistChange!: boolean;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn()
  user!: UserEntity;

  @Column({ select: false })
  @IsUUID()
  userId!: string;

  @CreateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDateString({ strict: false })
  createdAt!: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDateString({ strict: false })
  updatedAt!: Date;
}
