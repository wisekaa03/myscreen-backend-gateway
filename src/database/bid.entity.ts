import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsUUID,
  Validate,
} from 'class-validator';

import { BidApprove, BidStatus } from '@/enums';
import { IsDateStringOrNull } from '@/utils/is-date-string-or-null';
import { UserEntity } from './user.entity';
import { MonitorEntity } from '@/database/monitor.entity';
import { PlaylistEntity } from './playlist.entity';

@Entity('application', { comment: 'Заявки' })
export class BidEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_bid_id' })
  @ApiProperty({
    description: 'Идентификатор взаимодействия',
    format: 'uuid',
  })
  @IsUUID()
  id?: string;

  @Generated('increment')
  @Index('bidSeqNoIndex')
  @Column({ type: 'integer' })
  @ApiProperty({
    description: 'Номер заявки',
  })
  @IsNumber()
  seqNo!: number;

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
    allOf: [{ $ref: '#/components/schemas/UserResponse' }],
  })
  buyer!: UserEntity | null;

  @Column({ nullable: true })
  @Index('bidBuyerIdIndex')
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
    allOf: [{ $ref: '#/components/schemas/UserResponse' }],
  })
  seller!: UserEntity;

  @Column()
  @Index('bidSellerIdIndex')
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

  @Column()
  @ApiProperty({
    description: 'Монитор ID',
    format: 'uuid',
  })
  @IsUUID()
  monitorId!: string;

  @Column({
    type: 'enum',
    enum: BidStatus,
    default: BidStatus.OK,
  })
  @Index('bidStatusIndex')
  @ApiProperty({
    description: 'OK / Подождите',
    enum: BidStatus,
    enumName: 'BidStatus',
    example: BidStatus.OK,
    default: BidStatus.OK,
    required: false,
  })
  @IsEnum(BidStatus, { each: true })
  status!: BidStatus;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description: 'Скрытый',
    default: false,
    example: false,
    required: false,
  })
  @IsBoolean()
  hide!: boolean;

  @ManyToOne(() => BidEntity, (bid) => bid.id, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn({ foreignKeyConstraintName: 'bidParentRequestIdConstraint' })
  @Index('bidParentRequestIdIndex')
  parentRequest?: BidEntity;

  @Column({ nullable: true })
  @IsUUID()
  parentRequestId?: string;

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
  @ApiProperty({
    description: 'Плэйлист ID',
    format: 'uuid',
  })
  @IsUUID()
  playlistId!: string;

  @Column({
    type: 'enum',
    enum: BidApprove,
    default: BidApprove.NOTPROCESSED,
  })
  @Index('bidApprovedIndex')
  @ApiProperty({
    description: 'Не обработан / Разрешен / Запрещен',
    enum: BidApprove,
    enumName: 'BidApprove',
    example: BidApprove.NOTPROCESSED,
    required: true,
  })
  @IsEnum(BidApprove, { each: true })
  approved!: BidApprove;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  @Index('bidDateWhenIndex')
  @ApiProperty({
    type: 'string',
    format: 'date',
    description: 'Время когда',
    example: '2021-01-01',
    required: true,
  })
  @IsDateString({ strict: false })
  dateWhen!: Date;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  @Index('bidDateBeforeIndex')
  @ApiProperty({
    type: 'string',
    format: 'date',
    description: 'Время до',
    example: '2021-10-01',
    nullable: true,
    required: false,
  })
  @Validate(IsDateStringOrNull)
  dateBefore!: Date | null;

  @Column({ type: 'boolean', nullable: false, default: false })
  @ApiProperty({
    description: 'Смена текущего плэйлиста: сразу/когда закончится',
    example: false,
    required: true,
  })
  @IsBoolean()
  playlistChange!: boolean;

  @Column({ type: 'integer', default: 0 })
  @ApiProperty({
    description: 'Сумма списания',
    example: 10,
    required: true,
  })
  @IsNumber()
  sum!: number;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn()
  user!: UserEntity;

  @Column({ select: false })
  @Index('bidUserIdIndex')
  @IsUUID()
  userId!: string;

  @CreateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T00:00:00.000Z',
    examples: {
      one: '2021-01-01',
      two: ['2021-12-30', '2021-12-31T10:10:10'],
    },
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsDateString({ strict: false })
  createdAt?: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T00:00:00.000Z',
    examples: {
      one: '2021-01-01',
      two: ['2021-12-30', '2021-12-31T10:10:10'],
    },
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsDateString({ strict: false })
  updatedAt?: Date;
}
