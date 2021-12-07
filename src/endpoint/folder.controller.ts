import { Controller, Logger, Body, Post, Req, UseGuards } from '@nestjs/common';

import type { Request as ExpressRequest } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  BadRequestError,
  UnauthorizedError,
  FoldersGetResponse,
  FoldersGetRequest,
  FolderCreateResponse,
  FolderCreateRequest,
  ForbiddenError,
  InternalServerError,
  Status,
} from '@/dto';
import { JwtAuthGuard } from '@/guards';
import { FolderService } from '@/database/folder.service';

@ApiTags('folder')
@ApiResponse({
  status: 400,
  description: 'Ответ будет таким если с регистрационным данным что-то не так',
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
  status: 500,
  description: 'Ошибка сервера',
  type: InternalServerError,
})
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('/folder')
export class FolderController {
  logger = new Logger(FolderController.name);

  constructor(private readonly folderService: FolderService) {}

  @Post('/')
  @ApiOperation({
    operationId: 'get_folders',
    summary: 'Получение списка папок',
  })
  @ApiResponse({
    status: 201,
    description: 'Успешный ответ',
    type: FoldersGetResponse,
  })
  async getFolders(
    @Req() { user }: ExpressRequest,
    @Body() body: FoldersGetRequest,
  ): Promise<FoldersGetResponse> {
    const [data, count] = await this.folderService.findFolders({
      take: body.scope?.limit ?? undefined,
      skip:
        body.scope?.page && body.scope.page > 0
          ? (body.scope.limit ?? 0) * (body.scope.page - 1)
          : undefined,
      order: body.scope?.order ?? undefined,
      where: {
        user,
        ...body.where,
      },
    });

    return {
      status: Status.Success,
      count,
      data,
    };
  }

  @Post('/create')
  @ApiOperation({
    operationId: 'create_folder',
    summary: 'Создание новой папки',
  })
  @ApiResponse({
    status: 201,
    description: 'Успешный ответ',
    type: FolderCreateRequest,
  })
  async createFolder(
    @Req() { user }: ExpressRequest,
    @Body() body: FolderCreateRequest,
  ): Promise<FolderCreateResponse> {
    return {
      status: Status.Success,
      data: await this.folderService.createFolder(
        user,
        body.name,
        body.parentFolderId,
      ),
    };
  }
}
