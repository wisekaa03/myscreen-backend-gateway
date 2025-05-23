import type { Request as ExpressRequest } from 'express';
import { FindOptionsWhere, In } from 'typeorm';
import {
  Logger,
  Body,
  Post,
  Req,
  Get,
  Param,
  ParseUUIDPipe,
  Delete,
  Patch,
  HttpCode,
  Put,
} from '@nestjs/common';
import { ApiExtraModels, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { BadRequestError, NotFoundError } from '@/errors';
import {
  FoldersGetResponse,
  FoldersGetRequest,
  FolderCreateRequest,
  FolderGetResponse,
  SuccessResponse,
  FolderResponse,
  FoldersDeleteRequest,
  FoldersUpdateRequest,
  FoldersCopyRequest,
  FolderIdUpdateRequest,
  FolderRequest,
} from '@/dto';
import { administratorFolderId } from '@/constants';
import { CRUD, Status, UserRoleEnum } from '@/enums';
import { ApiComplexDecorators, Crud } from '@/decorators';
import { paginationQuery } from '@/utils/pagination-query';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { FolderEntity } from '@/database/folder.entity';
import { FolderService } from '@/database/folder.service';
import { UserService } from '@/database/user.service';
import { FolderExtView } from '@/database/folder-ext.view';

@ApiExtraModels(FolderResponse)
@ApiComplexDecorators({
  path: ['folder'],
  roles: [
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
  ],
})
export class FolderController {
  logger = new Logger(FolderController.name);

  constructor(
    private readonly userService: UserService,
    private readonly folderService: FolderService,
  ) {}

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
  @Crud(CRUD.READ)
  async getMany(
    @Req() { user }: ExpressRequest,
    @Body() { scope, select, where }: FoldersGetRequest,
  ): Promise<FoldersGetResponse> {
    const { id: userId, role } = user;
    let count = 0;
    let data: FolderResponse[] = [];
    const { id: rootFolderId } = await this.folderService.rootFolder(userId);
    if (where?.userId === undefined) {
      const whereLocal: FindOptionsWhere<FolderEntity> = {
        parentFolderId: rootFolderId,
        ...TypeOrmFind.where<FolderRequest, FolderEntity>(FolderRequest, where),
      };
      [data, count] = await this.folderService.findAndCount({
        ...paginationQuery(scope),
        select,
        where: { ...whereLocal, userId },
      });
    }
    if (where && role === UserRoleEnum.Administrator) {
      if (
        where.parentFolderId === null ||
        where.parentFolderId === rootFolderId
      ) {
        const adminFolder =
          await this.folderService.administratorFolder(userId);
        data = [...data, adminFolder];
        count += 1;
      } else if (where.parentFolderId === administratorFolderId) {
        const otherUserFoldersName =
          await this.folderService.otherUserFoldersName(user);
        data = [...data, ...otherUserFoldersName];
        count += otherUserFoldersName.length;
      } else if (typeof where.userId === 'string') {
        const otherUserFolders = await this.folderService.otherUserFolders(
          where.userId,
        );
        data = [...data, ...otherUserFolders];
        count += otherUserFolders.length;
      }
    }

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
  @Crud(CRUD.CREATE)
  async createFolder(
    @Req() { user }: ExpressRequest,
    @Body() { name, parentFolderId }: FolderCreateRequest,
  ): Promise<FolderGetResponse> {
    const { id: userId } = user;
    const parentFolder = parentFolderId
      ? await this.folderService.findOne({
          where: { userId, id: parentFolderId },
        })
      : await this.folderService.rootFolder(userId);
    if (!parentFolder) {
      throw new BadRequestError(`Folder '${parentFolderId}' is not exists`);
    }

    const data = await this.folderService.create({
      userId,
      name,
      parentFolderId: parentFolder.id,
    });

    return {
      status: Status.Success,
      data,
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
  @Crud(CRUD.UPDATE)
  async update(
    @Req() { user }: ExpressRequest,
    @Body() { folders }: FoldersUpdateRequest,
  ): Promise<FoldersGetResponse> {
    const { id: userId } = user;
    const parentFoldersId = folders.map((folder) => folder.id);

    const foldersCheck = await this.folderService.find({
      where: { id: In(parentFoldersId) },
      select: ['id', 'system'],
      caseInsensitive: false,
    });
    if (foldersCheck.some((folder) => folder.system)) {
      throw new BadRequestError('This is a system folder in a list');
    }

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
        throw new NotFoundError(
          `Folders '${parentFoldersId.join(', ')}' is not exists`,
        );
      }
    }

    const foldersPromise = folders.map(async ({ id, name, parentFolderId }) =>
      this.folderService.update(id, { name, userId, parentFolderId }),
    );

    const data = await Promise.allSettled(foldersPromise).then((folder) =>
      folder.reduce((acc, p) => {
        if (p.status === 'fulfilled' && p.value) {
          return acc.concat(p.value);
        }
        return acc;
      }, [] as FolderExtView[]),
    );

    return {
      status: Status.Success,
      count: data.length,
      data,
    };
  }

  @Patch('copy')
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
  @Crud(CRUD.UPDATE)
  async copy(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() { toFolder, folders }: FoldersCopyRequest,
  ): Promise<FoldersGetResponse> {
    const foldersIds = folders.map((folder) => folder.id);
    const _toFolder = await this.folderService.findOne({
      where: { userId, id: toFolder },
    });
    if (!_toFolder) {
      throw new BadRequestError(`Folder '${toFolder}' is not exist`);
    }
    const copyFolders = await this.folderService.find({
      where: { userId, id: In(foldersIds) },
      relations: { files: true },
    });
    if (copyFolders.length !== folders.length) {
      throw new BadRequestError('The number of folders does not match');
    }
    if (
      copyFolders.some((copyFolder) => copyFolder.parentFolderId === toFolder)
    ) {
      throw new BadRequestError('Copying to the same directory');
    }
    if (
      copyFolders.some(
        (copyFolder) =>
          copyFolder.parentFolderId !== copyFolders[0].parentFolderId,
      )
    ) {
      throw new BadRequestError('Copying multiple sources into one');
    }

    const data = await this.folderService.copy({
      userId,
      toFolder: _toFolder,
      folders: copyFolders,
    });

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
  @Crud(CRUD.DELETE)
  async delete(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() { foldersId }: FoldersDeleteRequest,
  ): Promise<SuccessResponse> {
    const { id: rootFolderId } = await this.folderService.rootFolder(userId);
    if (foldersId.includes(rootFolderId)) {
      throw new BadRequestError('This is a root folder in a list');
    }
    const folders = await this.folderService.find({
      where: { id: In(foldersId) },
      select: ['id', 'system'],
      caseInsensitive: false,
    });
    if (folders.some((folder) => folder.system)) {
      throw new BadRequestError('This is a system folder in a list');
    }

    const { affected } = await this.folderService.delete(foldersId);
    if (!affected) {
      throw new NotFoundError('This folder is not exists');
    }

    return {
      status: Status.Success,
    };
  }

  @Get(':folderId')
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
  @Crud(CRUD.READ)
  async getOne(
    @Req() { user }: ExpressRequest,
    @Param('folderId', ParseUUIDPipe) id: string,
  ): Promise<FolderGetResponse> {
    const data = await this.folderService.findOne({
      where: { userId: user.id, id },
    });
    if (!data) {
      throw new NotFoundError(`Folder '${id}' is not exists`);
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Patch(':folderId')
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
  @Crud(CRUD.UPDATE)
  async updateFolder(
    @Req() { user }: ExpressRequest,
    @Param('folderId', ParseUUIDPipe) id: string,
    @Body() { name, parentFolderId }: FolderIdUpdateRequest,
  ): Promise<FolderGetResponse> {
    const { id: userId } = user;
    let parentFolder: FolderEntity | null | undefined;
    if (parentFolderId) {
      parentFolder = await this.folderService.findOne({
        where: {
          userId,
          id: parentFolderId,
        },
      });
      if (!parentFolder) {
        throw new NotFoundError(`Folder '${parentFolderId}' is not exists`);
      }
    }

    const data = await this.folderService.update(id, {
      name,
      parentFolder,
    });

    return {
      status: Status.Success,
      data,
    };
  }

  @Delete(':folderId')
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
  @Crud(CRUD.DELETE)
  async deleteFolder(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('folderId', ParseUUIDPipe) folderId: string,
  ): Promise<SuccessResponse> {
    const rootFolder = await this.folderService.rootFolder(userId);
    if (folderId === rootFolder.id) {
      throw new BadRequestError('This is a root folder in a list');
    }

    const { affected } = await this.folderService.delete([folderId]);
    if (!affected) {
      throw new NotFoundError('This folder is not exists');
    }

    return {
      status: Status.Success,
    };
  }
}
