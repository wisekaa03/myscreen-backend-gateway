import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsWhere } from 'typeorm';

import { LimitRequest } from './limit.request';
import { EditorPartialRequest } from './editor-partial.request';

export class EditorsGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: EditorPartialRequest,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EditorPartialRequest)
  where!: FindOptionsWhere<EditorPartialRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LimitRequest)
  scope!: LimitRequest<EditorPartialRequest>;
}
