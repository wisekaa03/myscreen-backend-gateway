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
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
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

  @Column({ nullable: true })
  @Index()
  @IsOptional()
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

  @Column({ nullable: true })
  @Index()
  @IsOptional()
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

  @Column()
  @Index()
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
