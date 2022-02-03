import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
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
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
  Req,
  Res,
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
  EditorLayerCreateRequest,
  EditorLayerGetResponse,
  EditorLayerUpdateRequest,
  EditorGetRenderingStatusResponse,
  EditorLayerMoveRequest,
  EditorExportRequest,
} from '@/dto';
import { JwtAuthGuard } from '@/guards';
import { VideoType, Status } from '@/enums';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';
import { EditorService } from '@/database/editor.service';
import { FileService } from '@/database/file.service';
import { EditorLayerEntity } from '@/database/editor-layer.entity';

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

  constructor(
    private readonly editorService: EditorService,
    private readonly fileService: FileService,
  ) {}

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
    const [data, count] = await this.editorService.findAndCount({
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
    if (!data) {
      throw new NotFoundException('Editor not found');
    }

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
      relations: ['videoLayers', 'audioLayers', 'renderedFile'],
    });
    if (!data) {
      throw new NotFoundException('Editor not found');
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
      select: ['id', 'userId'],
    });
    if (!editor) {
      throw new NotFoundException(`Editor '${id}' is not found`);
    }

    const { affected } = await this.editorService.delete(user, editor);
    if (!affected) {
      throw new NotFoundException('This editor is not exists');
    }

    return {
      status: Status.Success,
    };
  }

  @Put('/layer/:editorId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'editor-layer-create',
    summary: 'Создание слоя редактора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: EditorLayerGetResponse,
  })
  async createEditorLayer(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) id: string,
    @Body() body: EditorLayerCreateRequest,
  ): Promise<EditorLayerGetResponse> {
    if (body.duration !== body.cutTo - body.cutFrom) {
      throw new BadRequestException('Duration must be cutTo - cutFrom');
    }

    const editor = await this.editorService.findOne({
      where: { id, userId: user.id },
    });
    if (!editor) {
      throw new NotFoundException(`The editor ${id} is not found`);
    }

    const file = await this.fileService.findOne({
      where: { id: body.file, userId: user.id },
    });
    if (!file) {
      throw new NotFoundException(`The file ${body.file} is not found`);
    }

    const update: Partial<EditorLayerEntity> = {
      ...body,
      file,
    };
    if (file.videoType === VideoType.Audio) {
      update.audio = [editor];
    } else {
      update.video = [editor];
    }

    const result = await this.editorService.updateLayer(user, id, update);
    if (!result) {
      throw new NotFoundException('This editor layer is not exists');
    }
    await this.editorService.correctLayers(user, editor.id);
    const data = await this.editorService.findOneLayer({
      where: {
        id: result.id,
      },
      relations: ['file'],
    });
    if (!data) {
      throw new NotFoundException('This editor layer is not exists');
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Get('/layer/:editorId/:layerId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'editor-layer-get',
    summary: 'Получение слоя редактора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: EditorLayerGetResponse,
  })
  async getEditorLayer(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) id: string,
    @Param('layerId', ParseUUIDPipe) layerId: string,
  ): Promise<EditorLayerGetResponse> {
    const editor = await this.editorService.findOne({
      where: {
        userId: user.id,
        id,
      },
    });
    if (!editor) {
      throw new NotFoundException('Editor not found');
    }

    const editorLayer = await this.editorService.findOneLayer({
      where: {
        id: layerId,
      },
    });
    if (!editorLayer) {
      throw new NotFoundException('This editor layer is not exists');
    }

    return {
      status: Status.Success,
      data: editorLayer,
    };
  }

  @Patch('/layer/:editorId/:layerId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'editor-layer-update',
    summary: 'Изменить слой редактора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: EditorLayerGetResponse,
  })
  async updateEditorLayer(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) id: string,
    @Param('layerId', ParseUUIDPipe) layerId: string,
    @Body() body: EditorLayerUpdateRequest,
  ): Promise<EditorLayerGetResponse> {
    const editor = await this.editorService.findOne({
      where: {
        userId: user.id,
        id,
      },
    });
    if (!editor) {
      throw new NotFoundException('Editor not found');
    }

    const editorLayer = await this.editorService.findOneLayer({
      where: {
        id: layerId,
      },
    });
    if (!editorLayer) {
      throw new NotFoundException('Editor layer not found');
    }

    const update: Partial<EditorLayerEntity> = {
      ...editorLayer,
      ...body,
    };
    const data = await this.editorService.updateLayer(user, id, update);
    if (!data) {
      throw new NotFoundException('This editor layer is not exists');
    }

    await this.editorService.correctLayers(user, editor.id);

    return {
      status: Status.Success,
      data,
    };
  }

  @Put('/layer/:editorId/:layerId/:moveIndex')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'editor-layer-move',
    summary: 'Изменить очередь слоя редактора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async moveEditorLayer(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) editorId: string,
    @Param('layerId', ParseUUIDPipe) layerId: string,
    @Param('moveIndex', ParseIntPipe) moveIndex: number,
  ): Promise<SuccessResponse> {
    /* await */ this.editorService.moveIndex(
      user,
      editorId,
      layerId,
      moveIndex,
    );

    return {
      status: Status.Success,
    };
  }

  @Delete('/layer/:editorId/:layerId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'editor-layer-delete',
    summary: 'Удаление слоя редактора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async deleteEditorLayer(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) id: string,
    @Param('layerId', ParseUUIDPipe) layerId: string,
  ): Promise<SuccessResponse> {
    const editor = await this.editorService.findOne({
      where: { userId: user.id, id },
    });
    if (!editor) {
      throw new NotFoundException(`Editor '${id}' is not found`);
    }

    const editorLayer = await this.editorService.findOneLayer(
      {
        where: { id: layerId },
      },
      false,
    );
    if (!editorLayer) {
      throw new NotFoundException(`Editor layer '${layerId}' is not found`);
    }

    const { affected } = await this.editorService.deleteLayer(editorLayer);
    if (!affected) {
      throw new NotFoundException('This editor layer is not exists');
    }

    await this.editorService.correctLayers(user, editor.id);

    return {
      status: Status.Success,
    };
  }

  @Post('/frame/:editorId/:time')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'editor-frame-get',
    summary: 'Получение кадра из редактора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    content: {
      'image/jpeg': {
        encoding: {
          image_jpeg: {
            contentType: 'image/jpeg',
          },
        },
      },
    },
  })
  async postEditorFrame(
    @Req() { user }: ExpressRequest,
    @Res() res: ExpressResponse,
    @Param('editorId', ParseUUIDPipe) id: string,
    @Param('time', ParseIntPipe) time: number,
  ): Promise<void> {
    const editor = await this.editorService.findOne({
      where: {
        userId: user.id,
        id,
      },
      relations: ['videoLayers', 'audioLayers'],
    });
    if (!editor) {
      throw new NotFoundException('Editor not found');
    }

    const capturedFrame = await this.editorService.captureFrame(editor, time);
    capturedFrame.pipe(res);
  }

  @Get('/export/:editorId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'editor-get-export',
    summary: 'Узнать статус экспорта видео из редактора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: EditorGetRenderingStatusResponse,
  })
  async getEditorExportStatus(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) id: string,
  ): Promise<EditorGetRenderingStatusResponse> {
    const data = await this.editorService.findOne({
      where: {
        userId: user.id,
        id,
      },
      select: [
        'id',
        'renderingStatus',
        'renderingPercent',
        'renderingError',
        'renderedFile',
      ],
    });
    if (!data) {
      throw new NotFoundException('Editor not found');
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Post('/export/:editorId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'editor-export',
    summary: 'Экспорт видео из редактора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: EditorGetResponse,
  })
  async postEditorExport(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) id: string,
    @Body() body?: EditorExportRequest,
  ): Promise<EditorGetResponse> {
    const data = await this.editorService.export(user, id, body?.rerender);

    return {
      status: Status.Success,
      data,
    };
  }
}
