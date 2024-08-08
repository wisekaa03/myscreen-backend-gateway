import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { BidApprove, BidStatus } from '@/enums';
import { UserEntity } from './user.entity';
import { MonitorEntity } from '@/database/monitor.entity';
import { PlaylistEntity } from './playlist.entity';

@Entity('bid', { comment: 'Заявки на воспроизведение' })
export class BidEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_bid' })
  @ApiProperty({
    description: 'Идентификатор взаимодействия',
    format: 'uuid',
    required: true,
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  id!: string;

  @Generated('increment')
  @Index('bidSeqNo')
  @Column({ type: 'integer' })
  @ApiProperty({
    description: 'Номер заявки',
  })
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  seqNo!: number;

  @ManyToOne(() => UserEntity, (buyer) => buyer.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
    cascade: true,
    eager: true,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_bid_buyer' })
  @ApiProperty({
    description: 'Покупатель',
    allOf: [{ $ref: '#/components/schemas/UserResponse' }],
  })
  buyer!: UserEntity | null;

  @Column({ type: 'uuid', nullable: true })
  @Index('bidBuyer')
  @ApiProperty({
    description: 'Покупатель ID',
    format: 'uuid',
    nullable: true,
    required: false,
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  buyerId!: string | null;

  @ManyToOne(() => UserEntity, (seller) => seller.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: true,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_bid_seller' })
  @ApiProperty({
    description: 'Продавец',
    type: 'string',
    allOf: [{ $ref: '#/components/schemas/UserResponse' }],
  })
  seller!: UserEntity;

  @Column({ type: 'uuid' })
  @Index('bidSeller')
  @ApiProperty({
    description: 'Продавец ID',
    format: 'uuid',
    required: false,
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  sellerId!: string;

  @ManyToOne(() => MonitorEntity, (monitor) => monitor.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: true,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_bid_monitor' })
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
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  monitorId!: string;

  @Column({
    type: 'enum',
    enum: BidStatus,
    default: BidStatus.OK,
  })
  @Index('bidStatus')
  @ApiProperty({
    description: 'OK / Подождите',
    enum: BidStatus,
    enumName: 'BidStatus',
    example: BidStatus.OK,
    default: BidStatus.OK,
    required: false,
  })
  @IsEnum(BidStatus, {
    each: true,
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  status!: BidStatus;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description: 'Скрытый',
    default: false,
    example: false,
    required: false,
  })
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  hide!: boolean;

  @ManyToOne(() => BidEntity, (bid) => bid.id, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_bid_parent_bid' })
  @Index('bidParentBid')
  parentRequest?: BidEntity;

  @Column({ type: 'uuid', nullable: true })
  @RelationId((bid: BidEntity) => bid.parentRequest)
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  parentRequestId!: string | null;

  @ManyToOne(() => PlaylistEntity, (playlist) => playlist.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: true,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_bid_playlist' })
  @ApiProperty({
    description: 'Плэйлист',
    type: 'string',
    allOf: [{ $ref: '#/components/schemas/PlaylistResponse' }],
  })
  playlist!: PlaylistEntity;

  @Column({ type: 'uuid', select: false })
  @ApiProperty({
    description: 'Плэйлист ID',
    format: 'uuid',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  playlistId!: string;

  @Column({
    type: 'enum',
    enum: BidApprove,
    default: BidApprove.NOTPROCESSED,
  })
  @Index('bidApproved')
  @ApiProperty({
    description: 'Не обработан / Разрешен / Запрещен',
    enum: BidApprove,
    enumName: 'BidApprove',
    example: BidApprove.NOTPROCESSED,
    required: true,
  })
  @IsEnum(BidApprove, {
    each: true,
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  approved!: BidApprove;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  @Index('bidDateWhen')
  @ApiProperty({
    type: 'string',
    format: 'date',
    description: 'Время когда',
    example: '2021-01-01',
    required: true,
  })
  @IsDateString(
    { strict: false },
    { message: i18nValidationMessage('validation.IS_DATE') },
  )
  dateWhen!: Date;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  @Index('bidDateBefore')
  @ApiProperty({
    type: 'string',
    format: 'date',
    description: 'Время до',
    example: '2021-10-01',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: i18nValidationMessage('validation.IS_DATE') },
  )
  @ValidateIf((object, value) => value !== null)
  dateBefore!: Date | null;

  @Column({ type: 'boolean', nullable: false, default: false })
  @ApiProperty({
    description: 'Смена текущего плэйлиста: сразу/когда закончится',
    example: false,
    required: true,
  })
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  playlistChange!: boolean;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  @ApiProperty({
    description: 'Сумма списания',
    example: 10,
    required: true,
  })
  @IsNumberString(
    {},
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  sum!: number;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_bid_user' })
  user?: UserEntity;

  @Column({ type: 'uuid' })
  @RelationId((bid: BidEntity) => bid.user)
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'Пользователь ID',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
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
  @IsDateString(
    { strict: false },
    { message: i18nValidationMessage('validation.IS_DATE') },
  )
  createdAt!: Date;

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
  @IsDateString(
    { strict: false },
    { message: i18nValidationMessage('validation.IS_DATE') },
  )
  updatedAt!: Date;
}
