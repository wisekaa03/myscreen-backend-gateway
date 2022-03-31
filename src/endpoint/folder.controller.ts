import type { Request as ExpressRequest } from 'express';
import {
  Controller,
  Logger,
  Body,
  Post,
  Req,
  UseGuards,
  BadRequestException,
  Get,
  Param,
  NotFoundException,
  ParseUUIDPipe,
  Delete,
  Patch,
  HttpCode,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  BadRequestError,
  UnauthorizedError,
  FoldersGetResponse,
  FoldersGetRequest,
  FolderCreateRequest,
  FolderGetResponse,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  FolderUpdateRequest,
  SuccessResponse,
  FolderResponse,
  FoldersDeleteRequest,
} from '@/dto';
import { JwtAuthGuard, Roles, RolesGuard } from '@/guards';
import { Status } from '@/enums/status.enum';
import { FolderService } from '@/database/folder.service';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';
import { UserRoleEnum } from '@/enums';

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
  description: 'Ошибка папки',
  type: NotFoundError,
})
@ApiResponse({
  status: 500,
  description: 'Ошибка сервера',
  type: InternalServerError,
})
@ApiExtraModels(FolderResponse)
@Roles(
  UserRoleEnum.Administrator,
  UserRoleEnum.Advertiser,
  UserRoleEnum.MonitorOwner,
)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiTags('folder')
@Controller('folder')
export class FolderController {
  logger = new Logger(FolderController.name);

  constructor(private readonly folderService: FolderService) {}

  @Post('/')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'folders-get',
    summary: 'Получение списка папок',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: FoldersGetResponse,
  })
  async getFolders(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() { scope, where }: FoldersGetRequest,
  ): Promise<FoldersGetResponse> {
    const [data, count] = await this.folderService.findAndCount({
      ...paginationQueryToConfig(scope),
      where: {
        userId,
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
  @HttpCode(201)
  @ApiOperation({
    operationId: 'folder-create',
    summary: 'Создание новой папки',
  })
  @ApiResponse({
    status: 201,
    description: 'Успешный ответ',
    type: FolderGetResponse,
  })
  async createFolder(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() { name, parentFolderId }: FolderCreateRequest,
  ): Promise<FolderGetResponse> {
    const parentFolder = parentFolderId
      ? await this.folderService.findOne({
          where: { userId, id: parentFolderId },
        })
      : await this.folderService.rootFolder(userId);
    if (!parentFolder) {
      throw new BadRequestException(`Folder '${parentFolderId}' is not exists`);
    }

    return {
      status: Status.Success,
      data: await this.folderService.update({
        userId,
        name,
        parentFolderId: parentFolder.id,
      }),
    };
  }

  @Get('/:folderId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'folder-get',
    summary: 'Получение информации о папке',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: FolderGetResponse,
  })
  async getFolder(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('folderId', ParseUUIDPipe) id: string,
  ): Promise<FolderGetResponse> {
    const data = await this.folderService.findOne({
      where: { userId, id },
    });
    if (!data) {
      throw new NotFoundException(`Folder ${id} is not exists`);
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Patch('/:folderId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'folder-update',
    summary: 'Изменение информации о папке',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: FolderGetResponse,
  })
  async updateFolder(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('folderId', ParseUUIDPipe) id: string,
    @Body() { name }: FolderUpdateRequest,
  ): Promise<FolderGetResponse> {
    return {
      status: Status.Success,
      data: await this.folderService.update({ userId, id, name }),
    };
  }

  @Delete()
  @HttpCode(200)
  @ApiOperation({
    operationId: 'folders-delete',
    summary: 'Удаление папок',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async deleteFolders(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() { foldersId }: FoldersDeleteRequest,
  ): Promise<SuccessResponse> {
    const rootFolder = await this.folderService.rootFolder(userId);
    if (foldersId.includes(rootFolder.id)) {
      throw new BadRequestException('This is a root folder in a list');
    }
    const { affected } = await this.folderService.delete(userId, foldersId);
    if (!affected) {
      throw new NotFoundException('This folder is not exists');
    }

    return {
      status: Status.Success,
    };
  }

  @Delete('/:folderId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'folder-delete',
    summary: 'Удаление папки',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async deleteFolder(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('folderId', ParseUUIDPipe) folderId: string,
  ): Promise<SuccessResponse> {
    const rootFolder = await this.folderService.rootFolder(userId);
    if (folderId === rootFolder.id) {
      throw new BadRequestException('This is a root folder in a list');
    }
    const { affected } = await this.folderService.delete(userId, [folderId]);
    if (!affected) {
      throw new NotFoundException('This folder is not exists');
    }

    return {
      status: Status.Success,
    };
  }
}
