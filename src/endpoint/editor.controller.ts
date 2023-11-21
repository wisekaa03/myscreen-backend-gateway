import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import {
  BadRequestException,
  Body,
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
  Req,
  Res,
  InternalServerErrorException,
  NotAcceptableException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FindOptionsWhere } from 'typeorm';

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
import { VideoType, Status, UserRoleEnum, CRUD } from '@/enums';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { paginationQueryToConfig } from '@/utils/pagination-query-to-config';
import { EditorService } from '@/database/editor.service';
import { FileService } from '@/database/file.service';
import { EditorLayerEntity } from '@/database/editor-layer.entity';
import { UserService } from '@/database/user.service';
import { EditorEntity } from '@/database/editor.entity';

@ApiComplexDecorators('editor', [
  UserRoleEnum.Administrator,
  UserRoleEnum.Advertiser,
  UserRoleEnum.MonitorOwner,
])
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
      ...paginationQueryToConfig(scope),
      select,
      where: TypeOrmFind.Where(
        where,
        user.role !== UserRoleEnum.Administrator ? user : undefined,
      ),
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
    });
    if (Array.isArray(editor) && editor.length > 0) {
      throw new BadRequestException('This name is already taken');
    }
    const data = await this.editorService.create({ ...body, userId: user.id });
    if (!data) {
      throw new NotFoundException('Editor not found');
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
      throw new NotFoundException('Editor not found');
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
      throw new NotFoundException(`Editor ${id} not found`);
    }

    if (update.name !== undefined) {
      const editorFound = await this.editorService.find({
        where: {
          userId: user.id,
          name: update.name,
        },
      });
      if (Array.isArray(editorFound) && editorFound.length > 0) {
        throw new NotFoundException('This name already taken');
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
      throw new NotFoundException(`Editor '${id}' is not found`);
    }

    const { affected } = await this.editorService.delete(user.id, editor);
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
  @Crud(CRUD.CREATE)
  async createEditorLayer(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) editorId: string,
    @Body() body: EditorLayerCreateRequest,
  ): Promise<EditorLayerGetResponse> {
    const editor = await this.editorService.findOne({
      where: { id: editorId, userId: user.id },
      select: ['id', 'userId'],
      relations: [],
    });
    if (!editor) {
      throw new NotFoundException(`The editor ${editorId} is not found`);
    }
    const file = await this.fileService.findOne({
      find: {
        where: { id: body.file, userId: user.id },
        select: ['id', 'userId', 'videoType', 'meta', 'duration'],
        loadEagerRelations: false,
        relations: [],
      },
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
      user.id,
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
  @Crud(CRUD.UPDATE)
  async moveEditorLayer(
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) editorId: string,
    @Param('layerId', ParseUUIDPipe) layerId: string,
    @Param('moveIndex', ParseIntPipe) moveIndex: number,
  ): Promise<SuccessResponse> {
    // TODO: catch error
    /* await */ this.editorService.moveIndex(
      user.id,
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
      user.id,
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
  @Crud(CRUD.READ)
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
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) id: string,
  ): Promise<EditorGetRenderingStatusResponse> {
    const data = await this.editorService.findOne({
      where: {
        userId: user.id,
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
    @Req() { user }: ExpressRequest,
    @Param('editorId', ParseUUIDPipe) id: string,
    @Body() body?: EditorExportRequest,
  ): Promise<EditorGetRenderingStatusResponse> {
    const data = await this.editorService.export({
      user,
      id,
      rerender: body?.rerender,
    });
    if (!data) {
      throw new InternalServerErrorException();
    }

    return {
      status: Status.Success,
      data,
    };
  }
}
