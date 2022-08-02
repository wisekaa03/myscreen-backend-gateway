import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsWhere } from 'typeorm';

import { LimitRequest } from './limit.request';
import { FilePartialRequest } from './file-partial.request';

export class FilesGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: FilePartialRequest,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => FilePartialRequest)
  where!: FindOptionsWhere<FilePartialRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LimitRequest)
  scope!: LimitRequest<FilePartialRequest>;
}
