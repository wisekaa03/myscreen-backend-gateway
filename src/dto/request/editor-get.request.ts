import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { LimitRequest } from './limit.request';
import { EditorPartialRequest } from './editor-partial.request';

export class EditorGetRequest {
  @ApiProperty({
    description: 'Запрос',
    title: 'EditorRequest',
    type: EditorPartialRequest,
    required: false,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EditorPartialRequest)
  where?: Partial<EditorPartialRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    title: 'LimitRequest',
    type: LimitRequest,
    required: false,
  })
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<EditorPartialRequest>;
}
