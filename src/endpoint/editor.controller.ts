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
  InternalServerErrorException,
  NotAcceptableException,
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
  EditorExportRequest,
} from '@/dto';
import { JwtAuthGuard, Roles, RolesGuard } from '@/guards';
import { VideoType, Status, UserRoleEnum } from '@/enums';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';
import { EditorService } from '@/database/editor.service';
import { FileService } from '@/database/file.service';
import { EditorLayerEntity } from '@/database/editor-layer.entity';
import { TypeOrmFind } from '@/shared/typeorm.find';

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
@Roles(
  UserRoleEnum.Administrator,
  UserRoleEnum.Advertiser,
  UserRoleEnum.MonitorOwner,
)
@UseGuards(JwtAuthGuard, RolesGuard)
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
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() { where, select, scope }: EditorsGetRequest,
  ): Promise<EditorsGetResponse> {
    const [data, count] = await this.editorService.findAndCount({
      ...paginationQueryToConfig(scope),
      select,
      where: TypeOrmFind.Where(where, userId),
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
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() body: EditorCreateRequest,
  ): Promise<EditorGetResponse> {
    const editor = await this.editorService.find({
      where: { userId, name: body.name },
    });
    if (Array.isArray(editor) && editor.length > 0) {
      throw new BadRequestException('This name is already taken');
    }
    const data = await this.editorService.update(userId, body);
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
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) id: string,
  ): Promise<EditorGetResponse> {
    const data = await this.editorService.findOne({
      where: {
        userId,
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
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) id: string,
    @Body() update: EditorUpdateRequest,
  ): Promise<EditorGetResponse> {
    const editor = await this.editorService.findOne({
      where: {
        userId,
        id,
      },
    });
    if (!editor) {
      throw new NotFoundException('Editor not found');
    }
    const editorFound = await this.editorService.find({
      where: {
        userId,
        name: update.name,
      },
    });
    if (Array.isArray(editorFound) && editorFound.length > 0) {
      throw new NotFoundException('This name already taken');
    }

    const data = await this.editorService.update(userId, {
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
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse> {
    const editor = await this.editorService.findOne({
      where: { userId, id },
      select: ['id', 'userId'],
    });
    if (!editor) {
      throw new NotFoundException(`Editor '${id}' is not found`);
    }

    const { affected } = await this.editorService.delete(userId, editor);
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
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) editorId: string,
    @Body() body: EditorLayerCreateRequest,
  ): Promise<EditorLayerGetResponse> {
    const editor = await this.editorService.findOne({
      where: { id: editorId, userId },
      select: ['id', 'userId'],
      relations: [],
    });
    if (!editor) {
      throw new NotFoundException(`The editor ${editorId} is not found`);
    }
    const file = await this.fileService.findOne({
      where: { id: body.file, userId },
      select: ['id', 'userId', 'videoType', 'meta', 'duration'],
      relations: [],
    });
    if (!file) {
      throw new NotFoundException(`The file ${body.file} is not found`);
    }

    const create: Partial<EditorLayerEntity> = {
      ...body,
      file,
    };
    if (file.videoType === VideoType.Audio) {
      create.audio = [editor];
    } else {
      create.video = [editor];
    }

    const data = await this.editorService.createLayer(userId, editorId, create);
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
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) editorId: string,
    @Param('layerId', ParseUUIDPipe) layerId: string,
  ): Promise<EditorLayerGetResponse> {
    const editor = await this.editorService.findOne({
      where: {
        userId,
        id: editorId,
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
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) editorId: string,
    @Param('layerId', ParseUUIDPipe) layerId: string,
    @Body() body: EditorLayerUpdateRequest,
  ): Promise<EditorLayerGetResponse> {
    const editor = await this.editorService.findOne({
      where: {
        userId,
        id: editorId,
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

    const data = await this.editorService.updateLayer(
      userId,
      editorId,
      editorLayer,
      body,
    );
    if (!data) {
      throw new NotFoundException('This editor layer is not exists');
    }

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
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) editorId: string,
    @Param('layerId', ParseUUIDPipe) layerId: string,
    @Param('moveIndex', ParseIntPipe) moveIndex: number,
  ): Promise<SuccessResponse> {
    // TODO: catch error
    /* await */ this.editorService.moveIndex(
      userId,
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
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) editorId: string,
    @Param('layerId', ParseUUIDPipe) layerId: string,
  ): Promise<SuccessResponse> {
    // TODO: разобраться
    const editor = await this.editorService.findOne({
      where: { userId, id: editorId },
      select: ['id', 'userId'],
      relations: [],
    });
    if (!editor) {
      throw new NotFoundException(`Editor '${editorId}' is not found`);
    }
    const editorLayer = await this.editorService.findOneLayer({
      where: { id: layerId },
      select: ['id'],
      relations: [],
      order: {},
    });
    if (!editorLayer) {
      throw new NotFoundException(`Editor layer '${layerId}' is not found`);
    }

    const { affected } = await this.editorService.deleteLayer(
      userId,
      editorId,
      layerId,
    );
    if (!affected) {
      throw new NotFoundException('This editor layer is not exists');
    }

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
    @Req() { user: { id: userId } }: ExpressRequest,
    @Res() res: ExpressResponse,
    @Param('editorId', ParseUUIDPipe) id: string,
    @Param('time', ParseIntPipe) time: number,
  ): Promise<void> {
    const editor = await this.editorService.findOne({
      where: {
        userId,
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
    operationId: 'editor-export-status',
    summary: 'Узнать статус экспорта видео из редактора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: EditorGetRenderingStatusResponse,
  })
  async getEditorExportStatus(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) id: string,
  ): Promise<EditorGetRenderingStatusResponse> {
    const data = await this.editorService.findOne({
      where: {
        userId,
        id,
      },
    });
    if (!data) {
      throw new NotFoundException('Editor not found');
    }
    if (data.renderingError) {
      throw new NotAcceptableException(data.renderingError);
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
    type: EditorGetRenderingStatusResponse,
  })
  async postEditorExport(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) id: string,
    @Body() body?: EditorExportRequest,
  ): Promise<EditorGetRenderingStatusResponse> {
    const data = await this.editorService.export(userId, id, body?.rerender);
    if (!data) {
      throw new InternalServerErrorException();
    }

    return {
      status: Status.Success,
      data,
    };
  }
}
