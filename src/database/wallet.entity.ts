import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsUUID,
} from 'class-validator';

import { UserEntity } from './user.entity';
import { InvoiceEntity } from './invoice.entity';
import { ActEntity } from './act.entity';

@Entity('wallet')
export class WalletEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор баланса',
    format: 'uuid',
  })
  @IsUUID()
  id!: string;

  @Column()
  @ApiProperty({
    description: 'Баланс',
    example: 0,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  sum!: number;

  @ManyToOne(() => InvoiceEntity, (invoice) => invoice.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    eager: false,
    nullable: true,
  })
  @JoinColumn()
  invoice!: InvoiceEntity | null;

  @Column({ type: 'uuid', nullable: true })
  @RelationId((wallet: WalletEntity) => wallet.invoice)
  @IsUUID()
  invoiceId!: string | null;

  @ManyToOne(() => ActEntity, (invoice) => invoice.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    eager: false,
    nullable: true,
  })
  @JoinColumn()
  act!: ActEntity | null;

  @Column({ type: 'uuid', nullable: true })
  @RelationId((wallet: WalletEntity) => wallet.act)
  @IsUUID()
  actId!: string | null;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn()
  user!: UserEntity;

  @Column({ type: 'uuid' })
  @RelationId((wallet: WalletEntity) => wallet.user)
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
