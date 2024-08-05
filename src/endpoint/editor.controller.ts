import type { Request as ExpressRequest } from 'express';
import {
  Body,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  ParseUUIDPipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FindOptionsWhere } from 'typeorm';

import {
  BadRequestError,
  NotFoundError,
  PreconditionFailedError,
  ServiceUnavailableError,
} from '@/errors';
import {
  EditorUpdateRequest,
  EditorGetResponse,
  EditorsGetRequest,
  EditorsGetResponse,
  SuccessResponse,
  EditorCreateRequest,
  EditorLayerCreateRequest,
  EditorLayerGetResponse,
  EditorLayerUpdateRequest,
  EditorGetRenderingStatusResponse,
  EditorExportRequest,
} from '@/dto';
import { Crud, ApiComplexDecorators } from '@/decorators';
import { FileType, Status, UserRoleEnum, CRUD, RenderingStatus } from '@/enums';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { paginationQuery } from '@/utils/pagination-query';
import { EditorService } from '@/database/editor.service';
import { FileService } from '@/database/file.service';
import { EditorLayerEntity } from '@/database/editor-layer.entity';
import { UserService } from '@/database/user.service';
import { EditorEntity } from '@/database/editor.entity';
import { FileEntity } from '@/database/file.entity';
import { I18nPath } from '@/i18n';

@ApiComplexDecorators({
  path: ['editor'],
  roles: [
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
  ],
})
export class EditorController {
  logger = new Logger(EditorController.name);

  constructor(
    private readonly userService: UserService,
    private readonly editorService: EditorService,
    private readonly fileService: FileService,
  ) {}

  @Post()
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
  @Crud(CRUD.READ)
  async getEditors(
    @Req() { user }: ExpressRequest,
    @Body() { where, select, scope }: EditorsGetRequest,
  ): Promise<EditorsGetResponse> {
    const [data, count] = await this.editorService.findAndCount({
      ...paginationQuery(scope),
      select,
      where: { ...TypeOrmFind.where(EditorEntity, where), userId: user.id },
    });

    return {
      status: Status.Success,
      count,
      data,
    };
  }

  @Put()
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
  @Crud(CRUD.CREATE)
  async createEditor(
    @Req() { user }: ExpressRequest,
    @Body() body: EditorCreateRequest,
  ): Promise<EditorGetResponse> {
    const editor = await this.editorService.find({
      where: { userId: user.id, name: body.name },
      select: ['id'],
    });
    if (Array.isArray(editor) && editor.length > 0) {
      throw new BadRequestError('This name is already taken');
    }
    const data = await this.editorService.create({ ...body, userId: user.id });
    if (!data) {
      throw new PreconditionFailedError<I18nPath>('error.editor.not_created');
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Get(':editorId')
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
  @Crud(CRUD.READ)
  async getEditor(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) id: string,
  ): Promise<EditorGetResponse> {
    const where: FindOptionsWhere<EditorEntity> = { id };
    if (user.role !== UserRoleEnum.Administrator) {
      where.userId = user.id;
    }
    const data = await this.editorService.findOne({
      where,
      relations: { videoLayers: true, audioLayers: true, renderedFile: true },
    });
    if (!data) {
      throw new NotFoundError('Editor not found');
    }
    return {
      status: Status.Success,
      data,
    };
  }

  @Patch(':editorId')
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
  @Crud(CRUD.UPDATE)
  async updateEditor(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) id: string,
    @Body() update: EditorUpdateRequest,
  ): Promise<EditorGetResponse> {
    const where: FindOptionsWhere<EditorEntity> = { id };
    if (user.role !== UserRoleEnum.Administrator) {
      where.userId = user.id;
    }
    const editor = await this.editorService.findOne({
      where,
    });
    if (!editor) {
      throw new NotFoundError(`Editor '${id}' not found`);
    }

    if (update.name !== undefined) {
      const editorFound = await this.editorService.find({
        where: {
          userId: user.id,
          name: update.name,
        },
      });
      if (Array.isArray(editorFound) && editorFound.length > 0) {
        throw new NotFoundError('This name already taken');
      }
    }

    const data = await this.editorService.update(id, update);

    return {
      status: Status.Success,
      data,
    };
  }

  @Delete(':editorId')
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
  @Crud(CRUD.DELETE)
  async deleteEditor(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse> {
    const where: FindOptionsWhere<EditorEntity> = { id };
    if (user.role !== UserRoleEnum.Administrator) {
      where.userId = user.id;
    }
    const editor = await this.editorService.findOne({
      where,
      select: ['id', 'userId'],
    });
    if (!editor) {
      throw new NotFoundError<I18nPath>('error.editor.not_found', {
        args: { id },
      });
    }

    const { affected } = await this.editorService.delete(user.id, editor);
    if (!affected) {
      throw new NotFoundError('This editor is not exists');
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
  @Crud(CRUD.CREATE)
  async createEditorLayer(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) editorId: string,
    @Body() body: EditorLayerCreateRequest,
  ): Promise<EditorLayerGetResponse> {
    const whereEditor: FindOptionsWhere<EditorEntity> = { id: editorId };
    if (user.role !== UserRoleEnum.Administrator) {
      whereEditor.userId = user.id;
    }
    const editor = await this.editorService.findOne({
      where: whereEditor,
      select: ['id', 'userId'],
      loadEagerRelations: false,
      relations: {},
    });
    if (!editor) {
      throw new NotFoundError(`The editor id: '${editorId}' is not found`);
    }

    const whereFile: FindOptionsWhere<FileEntity> = { id: body.file };
    if (user.role !== UserRoleEnum.Administrator) {
      whereFile.userId = user.id;
    }
    const file = await this.fileService.findOne({
      where: whereFile,
      loadEagerRelations: false,
      relations: {},
    });
    if (!file) {
      throw new NotFoundError(`The file '${body.file}' is not found`);
    }

    const create: Partial<EditorLayerEntity> = {
      ...body,
      duration: body.duration && Number(body.duration),
      cutFrom: body.cutFrom && Number(body.cutFrom),
      cutTo: body.cutTo && Number(body.cutTo),
      cropH: body.cropH && Number(body.cropH),
      cropW: body.cropW && Number(body.cropW),
      cropX: body.cropX && Number(body.cropX),
      cropY: body.cropY && Number(body.cropY),
      start: body.start && Number(body.start),
      index: body.index && Number(body.index),
      file,
      fileId: file.id,
    };
    if (file.type === FileType.AUDIO) {
      create.audio = [editor];
    } else if (file.type === FileType.IMAGE || file.type === FileType.VIDEO) {
      create.video = [editor];
    }

    const data = await this.editorService.createLayer(
      user.id,
      editorId,
      create,
    );

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
  @Crud(CRUD.READ)
  async getEditorLayer(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) editorId: string,
    @Param('layerId', ParseUUIDPipe) layerId: string,
  ): Promise<EditorLayerGetResponse> {
    const editor = await this.editorService.findOne({
      where: {
        userId: user.id,
        id: editorId,
      },
    });
    if (!editor) {
      throw new NotFoundError('Editor not found');
    }
    const editorLayer = await this.editorService.findOneLayer({
      where: {
        id: layerId,
      },
    });
    if (!editorLayer) {
      throw new NotFoundError('This editor layer is not exists');
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
  @Crud(CRUD.UPDATE)
  async updateEditorLayer(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) editorId: string,
    @Param('layerId', ParseUUIDPipe) layerId: string,
    @Body() body: EditorLayerUpdateRequest,
  ): Promise<EditorLayerGetResponse> {
    const editor = await this.editorService.findOne({
      where: {
        userId: user.id,
        id: editorId,
      },
    });
    if (!editor) {
      throw new NotFoundError('Editor not found');
    }
    const editorLayer = await this.editorService.findOneLayer({
      where: {
        id: layerId,
      },
    });
    if (!editorLayer) {
      throw new NotFoundError('Editor layer not found');
    }

    const data = await this.editorService.updateLayer(
      user.id,
      editorId,
      editorLayer,
      body,
    );
    if (!data) {
      throw new NotFoundError('This editor layer is not exists');
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
  @Crud(CRUD.UPDATE)
  async moveEditorLayer(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) editorId: string,
    @Param('layerId', ParseUUIDPipe) layerId: string,
    @Param('moveIndex', ParseIntPipe) moveIndex: number,
  ): Promise<SuccessResponse> {
    const where: FindOptionsWhere<EditorEntity> = { id: editorId };
    if (user.role !== UserRoleEnum.Administrator) {
      where.userId = user.id;
    }
    const editor = await this.editorService.findOne({
      where,
    });
    if (!editor) {
      throw new NotFoundError(`Editor '${editorId}' not found`);
    }

    /* await */ this.editorService
      .moveIndex(editorId, layerId, moveIndex)
      .catch((error: unknown) => {
        this.logger.error(error);
      });

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
  @Crud(CRUD.DELETE)
  async deleteEditorLayer(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) editorId: string,
    @Param('layerId', ParseUUIDPipe) layerId: string,
  ): Promise<SuccessResponse> {
    // TODO: разобраться
    const editor = await this.editorService.findOne({
      where: { userId: user.id, id: editorId },
      select: ['id', 'userId'],
      relations: {},
    });
    if (!editor) {
      throw new NotFoundError(`Editor '${editorId}' is not found`);
    }
    const editorLayer = await this.editorService.findOneLayer({
      where: { id: layerId },
      select: ['id'],
      loadEagerRelations: false,
      relations: {},
      order: {},
    });
    if (!editorLayer) {
      throw new NotFoundError(`Editor layer '${layerId}' is not found`);
    }

    const { affected } = await this.editorService.deleteLayer(
      editorId,
      layerId,
    );
    if (!affected) {
      throw new NotFoundError('This editor layer is not exists');
    }

    return {
      status: Status.Success,
    };
  }

  @Get('export/:editorId')
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
  @Crud(CRUD.READ)
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
      throw new NotFoundError<I18nPath>('error.editor.not_found', {
        args: { id },
      });
    }
    if (data.renderingStatus === RenderingStatus.Error) {
      await this.editorService.update(id, {
        renderingError: null,
        renderingStatus: RenderingStatus.Initial,
      });
      const error = data.renderingError ?? undefined;
      throw new ServiceUnavailableError(error);
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Post('export/:editorId')
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
  @Crud(CRUD.UPDATE)
  async postEditorExport(
    @Param('editorId', ParseUUIDPipe) id: string,
    @Body() body?: EditorExportRequest,
  ): Promise<EditorGetRenderingStatusResponse> {
    const data = await this.editorService.export({
      id,
      rerender: body?.rerender,
    });

    return {
      status: Status.Success,
      data,
    };
  }
}
