import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsUUID } from 'class-validator';

import { UserEntity } from '@/database/user.entity';
import { MonitorEntity } from './monitor.entity';
import { PlaylistEntity } from './playlist.entity';
import { CooperationApproved } from '@/enums';

@Entity('cooperation')
export class CooperationEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор',
    format: 'uuid',
  })
  @IsUUID()
  id?: string;

  @ManyToOne(() => UserEntity, (buyer) => buyer.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: true,
  })
  @JoinColumn()
  @ApiProperty({
    description: 'Покупатель',
    items: { $ref: '#/components/schemas/UserResponse' },
  })
  buyer!: UserEntity;

  @Column({ select: false })
  @IsUUID()
  @ApiProperty({
    description: 'Покупатель ID',
    format: 'uuid',
  })
  buyerId!: string;

  @ManyToOne(() => UserEntity, (seller) => seller.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: true,
  })
  @JoinColumn()
  @ApiProperty({
    description: 'Продавец',
    items: { $ref: '#/components/schemas/UserResponse' },
  })
  seller!: UserEntity;

  @Column({ select: false })
  @IsUUID()
  @ApiProperty({
    description: 'Продавец ID',
    format: 'uuid',
  })
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
    items: { $ref: '#/components/schemas/MonitorResponse' },
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
    items: { $ref: '#/components/schemas/PlaylistResponse' },
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
    enum: CooperationApproved,
    default: CooperationApproved.NotProcessed,
  })
  @ApiProperty({
    description: 'Не обработан / Разрешен / Запрещен',
    enum: CooperationApproved,
    enumName: 'CooperationApproved',
    example: CooperationApproved.NotProcessed,
    required: true,
  })
  @IsBoolean()
  approved!: CooperationApproved;

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
  @IsDate()
  createdAt!: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDate()
  updatedAt!: Date;
}
