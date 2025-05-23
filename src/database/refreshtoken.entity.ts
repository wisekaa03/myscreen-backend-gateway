import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { UserEntity } from '@/database/user.entity';

@Entity('refresh_token', { comment: 'Токены обновления' })
@Index('IDX_id_expires', ['id', 'expires'])
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_refreshtoken_id',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  id?: string;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn()
  user!: UserEntity;

  @Column({ type: 'uuid' })
  @RelationId((refreshToken: RefreshTokenEntity) => refreshToken.user)
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  userId!: string;

  @Column({ type: 'boolean' })
  isRevoked!: boolean;

  @Column({ type: 'timestamp', default: () => 'now()' })
  expires!: Date;

  @Column({ default: '' })
  fingerprint?: string;

  @Column({ default: '' })
  userAgent?: string;

  @CreateDateColumn({ select: false })
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

  @UpdateDateColumn({ select: false })
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
