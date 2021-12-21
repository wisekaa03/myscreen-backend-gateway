import type { Request as ExpressRequest } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
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
  EditorUpdateRequest,
  EditorGetResponse,
  EditorsGetRequest,
  EditorsGetResponse,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
  SuccessResponse,
  EditorCreateRequest,
} from '@/dto';
import { JwtAuthGuard } from '@/guards';
import { Status } from '@/enums/status.enum';
import { EditorService } from '@/database/editor.service';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';

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
@ApiTags('editor')
@Controller('editor')
export class EditorController {
  logger = new Logger(EditorController.name);

  constructor(private readonly editorService: EditorService) {}

  @Post('/')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'editors-get',
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

  @Put('/')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'editor-create',
    summary: 'Создание редактора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: EditorGetResponse,
  })
  async createEditor(
    @Req() { user }: ExpressRequest,
    @Body() body: EditorCreateRequest,
  ): Promise<EditorGetResponse> {
    const data = await this.editorService.update(user, body);
    return {
      status: Status.Success,
      data,
    };
  }

  @Get('/:editorId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'editor-get',
    summary: 'Получение редактора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: EditorGetResponse,
  })
  async getEditor(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) id: string,
  ): Promise<EditorGetResponse> {
    const data = await this.editorService.findOne({
      where: {
        userId: user.id,
        id,
      },
    });
    if (!data) {
      throw new NotFoundException('File not found');
    }
    return {
      status: Status.Success,
      data,
    };
  }

  @Patch('/:editorId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'editor-update',
    summary: 'Изменить редактор',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: EditorGetResponse,
  })
  async updateEditor(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) id: string,
    @Body() update: EditorUpdateRequest,
  ): Promise<EditorGetResponse> {
    const editor = await this.editorService.findOne({
      where: {
        userId: user.id,
        id,
      },
    });
    if (!editor) {
      throw new NotFoundException('Editor not found');
    }

    const data = await this.editorService.update(user, {
      ...editor,
      ...update,
    });
    if (!data) {
      throw new BadRequestException('Editor exists and not exists ?');
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Delete('/:editorId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'editor-delete',
    summary: 'Удаление редактора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async deleteEditor(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse> {
    const editor = await this.editorService.findOne({
      where: { userId: user.id, id },
    });
    if (!editor) {
      throw new NotFoundException(`Editor '${id}' is not found`);
    }

    await this.editorService.delete(user, editor);

    return {
      status: Status.Success,
    };
  }
}
