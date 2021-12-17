import type { Request as ExpressRequest } from 'express';
import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  BadRequestError,
  EditorsGetRequest,
  EditorsGetResponse,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  ServiceUnavailableError,
  Status,
  UnauthorizedError,
} from '@/dto';
import { JwtAuthGuard } from '@/guards';
import { EditorService } from '@/database/editor.service';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';

@ApiTags('editor')
@ApiResponse({
  status: 400,
  description: 'Ответ будет таким если с данным что-то не так',
  type: BadRequestError,
})
@ApiResponse({
  status: 401,
  description: 'Ответ для незарегистрированного пользователя',
  type: UnauthorizedError,
})
@ApiResponse({
  status: 403,
  description: 'Ответ для неавторизованного пользователя',
  type: ForbiddenError,
})
@ApiResponse({
  status: 404,
  description: 'Ошибка монитора',
  type: NotFoundError,
})
@ApiResponse({
  status: 500,
  description: 'Ошибка сервера',
  type: InternalServerError,
})
@ApiResponse({
  status: 503,
  description: 'Ошибка сервера',
  type: ServiceUnavailableError,
})
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('/editor')
export class EditorController {
  logger = new Logger(EditorController.name);

  constructor(private readonly editorService: EditorService) {}

  @Post('/')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'editors_get',
    summary: 'Получение списка редакторов',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: EditorsGetResponse,
  })
  async getEditors(
    @Req() { user }: ExpressRequest,
    @Body() { where, scope }: EditorsGetRequest,
  ): Promise<EditorsGetResponse> {
    const [data, count] = await this.editorService.find({
      ...paginationQueryToConfig(scope),
      where: {
        userId: user.id,
        ...where,
      },
    });

    return {
      status: Status.Success,
      count,
      data,
    };
  }
}
