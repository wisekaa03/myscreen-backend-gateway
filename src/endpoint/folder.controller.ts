import type { Request as ExpressRequest } from 'express';
import { In } from 'typeorm';
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
  FoldersUpdateRequest,
  FoldersCopyRequest,
} from '@/dto';
import { JwtAuthGuard, Roles, RolesGuard } from '@/guards';
import { Status } from '@/enums/status.enum';
import { FolderEntity } from '@/database/folder.entity';
import { FolderService } from '@/database/folder.service';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';
import { UserRoleEnum } from '@/enums';
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

  @Post()
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
    @Body() { scope, select, where }: FoldersGetRequest,
  ): Promise<FoldersGetResponse> {
    const [data, count] = await this.folderService.findAndCount({
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

  @Put()
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

  @Patch()
  @HttpCode(200)
  @ApiOperation({
    operationId: 'folders-update',
    summary: 'Изменение информации о папках',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: FolderGetResponse,
  })
  async updateFolders(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() { folders }: FoldersUpdateRequest,
  ): Promise<FoldersGetResponse> {
    const parentFoldersId = folders.map((folder) => folder.id);
    let parentFolders: FolderEntity[] | undefined;
    if (parentFoldersId) {
      parentFolders = await this.folderService.find({
        where: {
          userId,
          id: In(parentFoldersId),
        },
      });
      if (
        !(
          Array.isArray(parentFolders) &&
          parentFolders.length === parentFoldersId.length
        )
      ) {
        throw new NotFoundException(
          `Folders '${parentFoldersId.join(', ')}' is not exists`,
        );
      }
    }

    const foldersPromise = folders.map(({ id, name, parentFolderId }) =>
      this.folderService.update({ id, name, userId, parentFolderId }),
    );

    const data = await Promise.all(foldersPromise);

    return {
      status: Status.Success,
      count: data.length,
      data,
    };
  }

  @Patch('/copy')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'folders-copy',
    summary: 'Копирование папок',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: FolderGetResponse,
  })
  async copyFolders(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() { toFolder, folders }: FoldersCopyRequest,
  ): Promise<FoldersGetResponse> {
    const foldersIds = folders.map((folder) => folder.id);
    const toFolderEntity = await this.folderService.findOne({
      where: { userId, id: toFolder },
    });
    if (!toFolderEntity) {
      throw new BadRequestError(`Folder ${toFolder} is not exist`);
    }
    const foldersCopy = await this.folderService.find({
      where: { userId, id: In(foldersIds) },
      relations: ['files'],
    });
    if (foldersCopy.length !== folders.length) {
      throw new BadRequestError('The number of folders does not match');
    }
    if (
      foldersCopy.some((folderCopy) => folderCopy.parentFolderId === toFolder)
    ) {
      throw new BadRequestError('Copying to the same directory');
    }
    if (
      foldersCopy.some(
        (folderCopy) =>
          folderCopy.parentFolderId !== foldersCopy[0].parentFolderId,
      )
    ) {
      throw new BadRequestError('Copying multiple sources into one');
    }

    const data = await this.folderService.copy(
      userId,
      toFolderEntity,
      foldersCopy,
    );

    return {
      status: Status.Success,
      count: data.length,
      data,
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
    @Body() { name, parentFolderId }: FolderUpdateRequest,
  ): Promise<FolderGetResponse> {
    let parentFolder: FolderEntity | null | undefined;
    if (parentFolderId) {
      parentFolder = await this.folderService.findOne({
        where: {
          userId,
          id: parentFolderId,
        },
      });
      if (!parentFolder) {
        throw new NotFoundException(`Folder '${parentFolderId}' is not exists`);
      }
    }

    const data = await this.folderService.update({
      userId,
      id,
      name,
      parentFolder,
    });

    return {
      status: Status.Success,
      data,
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
