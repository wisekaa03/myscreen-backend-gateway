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
} from '@nestjs/common';
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
  FolderCreateRequest,
  FolderUpdateResponse,
  ForbiddenError,
  InternalServerError,
  Status,
  NotFoundError,
  FolderUpdateRequest,
  SuccessResponse,
} from '@/dto';
import { JwtAuthGuard } from '@/guards';
import { FolderService } from '@/database/folder.service';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';

@ApiTags('folder')
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
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('/folder')
export class FolderController {
  logger = new Logger(FolderController.name);

  constructor(private readonly folderService: FolderService) {}

  @Post('/')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'get_folders',
    summary: 'Получение списка папок',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: FoldersGetResponse,
  })
  async getFolders(
    @Req() { user }: ExpressRequest,
    @Body() { scope, where }: FoldersGetRequest,
  ): Promise<FoldersGetResponse> {
    const [data, count] = await this.folderService.findFolders({
      ...paginationQueryToConfig(scope),
      where: {
        user,
        ...where,
      },
    });

    return {
      status: Status.Success,
      count,
      data,
    };
  }

  @Post('/create')
  @HttpCode(201)
  @ApiOperation({
    operationId: 'create_folder',
    summary: 'Создание новой папки',
  })
  @ApiResponse({
    status: 201,
    description: 'Успешный ответ',
    type: FolderUpdateResponse,
  })
  async createFolder(
    @Req() { user }: ExpressRequest,
    @Body() { name, parentFolderId }: FolderCreateRequest,
  ): Promise<FolderUpdateResponse> {
    if (!parentFolderId) {
      const parentFolder = await this.folderService.findFolder({
        where: { user, name, parentFolderId: null },
      });
      if (parentFolder) {
        throw new BadRequestException(`Folder '${name}' exists`);
      }
    } else {
      const parentFolder = await this.folderService.findFolder({
        where: { user, id: parentFolderId },
      });
      if (!parentFolder) {
        throw new BadRequestException(
          `Parent folder '${parentFolderId}' is not exists`,
        );
      }
    }

    return {
      status: Status.Success,
      data: await this.folderService
        .updateFolder({ user, name, parentFolderId })
        .then((folder) => {
          const { user: userFolder, ...data } = folder;
          return data;
        }),
    };
  }

  @Get('/:folderId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'get_folder',
    summary: 'Получение информации о папке',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: FolderUpdateResponse,
  })
  async getFolder(
    @Req() { user }: ExpressRequest,
    @Param('folderId', ParseUUIDPipe) id: string,
  ): Promise<FolderUpdateResponse> {
    return {
      status: Status.Success,
      data: await this.folderService
        .findFolder({ where: { user, id } })
        .then((folder) => {
          if (!folder) {
            throw new NotFoundException();
          }
          const { user: userFolder, ...data } = folder;
          return data;
        }),
    };
  }

  @Patch('/:folderId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'update_folder',
    summary: 'Изменение информации о папке',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: FolderUpdateResponse,
  })
  async updateFolder(
    @Req() { user }: ExpressRequest,
    @Param('folderId', ParseUUIDPipe) id: string,
    @Body() { name }: FolderUpdateRequest,
  ): Promise<FolderUpdateResponse> {
    return {
      status: Status.Success,
      data: await this.folderService
        .updateFolder({ user, id, name })
        .then((folder) => {
          if (!folder) {
            throw new NotFoundException();
          }
          const { user: userFolder, ...data } = folder;
          return data;
        }),
    };
  }

  @Delete('/:folderId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'delete_folder',
    summary: 'Удаление папки',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async deleteFolder(
    @Req() { user }: ExpressRequest,
    @Param('folderId', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse> {
    const folder = await this.folderService.findFolder({ where: { user, id } });
    if (!folder) {
      throw new NotFoundException(`User '${user.name}' has not '${id}' folder`);
    }

    await this.folderService.deleteFolder(folder);

    return {
      status: Status.Success,
    };
  }
}
