import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  DataSource,
  OneToMany,
  SelectQueryBuilder,
  ViewColumn,
  ViewEntity,
} from 'typeorm';
import {
  IsDateString,
  IsDefined,
  IsEmail,
  IsEnum,
  IsISO31661Alpha2,
  IsNotEmpty,
  IsNumber,
  IsPhoneNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import { FileEntity } from './file.entity';
import { UserEntity } from './user.entity';
import { MonitorEntity } from './monitor.entity';
import { UserRole, UserRoleEnum } from '@/enums';

@ViewEntity({
  materialized: false,
  expression: (connection: DataSource) =>
    connection
      .createQueryBuilder()
      .select('"user".*')
      .from(UserEntity, 'user')
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<FileEntity>) =>
          qb
            .select('"file"."userId"')
            .addSelect('SUM("file"."filesize")', 'countUsedSpace')
            .groupBy('"file"."userId"')
            .from(FileEntity, 'file'),
        'file',
        '"file"."userId" = "user"."id"',
      ),
})
export class UserSizeEntity implements UserEntity {
  @ViewColumn()
  @ApiProperty({
    description: 'Идентификатор пользователя',
    format: 'uuid',
    example: '1234567',
  })
  @IsUUID()
  id!: string;

  @ViewColumn()
  @ApiProperty({
    description: 'EMail пользователя',
    type: 'string',
    format: 'email',
    example: 'foo@bar.baz',
  })
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ViewColumn()
  @ApiHideProperty()
  disabled!: boolean;

  @ViewColumn()
  @ApiProperty({
    type: 'string',
    description: 'Фамилия',
    example: 'Steve',
    nullable: true,
    required: false,
  })
  @IsString()
  surname!: string | null;

  @ViewColumn()
  @ApiProperty({
    type: 'string',
    description: 'Имя',
    example: 'John',
    nullable: true,
    required: false,
  })
  @IsString()
  name!: string | null;

  @ViewColumn()
  @ApiProperty({
    type: 'string',
    description: 'Отчество',
    example: 'Doe',
    nullable: true,
    required: false,
  })
  @IsString()
  middleName!: string | null;

  @ViewColumn()
  @ApiHideProperty()
  password?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Телефон пользователя',
    example: '+78002000000',
    nullable: true,
    required: false,
  })
  @IsPhoneNumber()
  phoneNumber?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Город',
    example: 'Krasnodar',
    nullable: true,
    required: false,
  })
  @IsString()
  city?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Страна',
    example: 'RU',
    nullable: true,
    required: false,
  })
  @IsISO31661Alpha2()
  country?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Компания',
    example: 'ACME corporation',
    nullable: true,
    required: false,
  })
  @IsString()
  company?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Дисковое пространство',
    example: 20000000,
    required: false,
  })
  @IsNumber()
  storageSpace?: number;

  @ViewColumn()
  @ApiProperty({
    description: 'Роль пользователя',
    enum: UserRoleEnum,
    enumName: 'UserRoleResponse',
    example: UserRoleEnum.Advertiser,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(UserRole)
  role!: UserRoleEnum;

  @ViewColumn()
  forgotConfirmKey?: string | null;

  @ViewColumn()
  emailConfirmKey?: string | null;

  @ViewColumn()
  @ApiProperty({
    description: 'EMail подтвержден',
    example: true,
    required: false,
  })
  verified!: boolean;

  @ViewColumn()
  @ApiProperty({
    description: 'Демо пользователь (дата когда включится подписка)',
    example: false,
    required: false,
  })
  isDemoUser?: boolean;

  @OneToMany(() => MonitorEntity, (monitor) => monitor.user)
  monitors?: MonitorEntity[];

  @ViewColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDateString({ strict: false })
  createdAt?: Date;

  @ViewColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDateString({ strict: false })
  updatedAt?: Date;

  @ViewColumn()
  @ApiProperty({
    description: 'Использованное место',
    example: 0,
    required: false,
  })
  countUsedSpace?: number;
}
