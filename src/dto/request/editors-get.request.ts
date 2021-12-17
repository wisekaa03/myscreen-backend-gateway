import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { EditorEntity } from '@/database/editor.entity';
import { LimitRequest } from './limit.request';
import { EditorRequest } from './editor.request';

export class EditorsGetRequest {
  @ApiProperty({
    description: 'Запрос',
    title: 'EditorRequest',
    type: EditorRequest,
    required: false,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EditorRequest)
  where?: EditorRequest;

  @ApiProperty({
    description: 'Рамки для запроса',
    title: 'LimitRequest',
    type: LimitRequest,
    required: false,
  })
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<EditorEntity>;
}
