import type { Request as ExpressRequest } from 'express';
import { In } from 'typeorm';
import {
  Logger,
  Body,
  Post,
  Req,
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
import { ApiExtraModels, ApiOperation, ApiResponse } from '@nestjs/swagger';

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
} from '@/dto';
import { CRUD, Status, UserRoleEnum } from '@/enums';
import { ApiComplexDecorators, Crud } from '@/decorators';
import { paginationQueryToConfig } from '@/utils/pagination-query-to-config';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { FolderEntity } from '@/database/folder.entity';
import { FolderService } from '@/database/folder.service';
import { UserService } from '@/database/user.service';

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
    @Body() { scope, select, where: origWhere }: FoldersGetRequest,
  ): Promise<FoldersGetResponse> {
    const { id: userId } = user;
    let count: number = 0;
    let data: FolderResponse[] = [];
    [data, count] = await this.folderService.findAndCount({
      ...paginationQueryToConfig(scope),
      select,
      where: { ...TypeOrmFind.where(FolderEntity, origWhere), userId },
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
      : await this.folderService.rootFolder(user);
    if (!parentFolder) {
      throw new BadRequestException(`Folder '${parentFolderId}' is not exists`);
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
      this.folderService.update(id, { name, userId, parentFolderId }),
    );

    const dataFromPromise = await Promise.allSettled(foldersPromise);
    const data = dataFromPromise.reduce(
      (result, folder) =>
        folder.status === 'fulfilled' ? result.concat(folder.value) : result,
      [] as FolderEntity[],
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
    @Req() { user }: ExpressRequest,
    @Body() { toFolder, folders }: FoldersCopyRequest,
  ): Promise<FoldersGetResponse> {
    const foldersIds = folders.map((folder) => folder.id);
    const toFolderEntity = await this.folderService.findOne({
      where: { userId: user.id, id: toFolder },
    });
    if (!toFolderEntity) {
      throw new BadRequestException(`Folder '${toFolder}' is not exist`);
    }
    const foldersCopy = await this.folderService.find({
      where: { userId: user.id, id: In(foldersIds) },
      relations: ['files'],
    });
    if (foldersCopy.length !== folders.length) {
      throw new BadRequestException('The number of folders does not match');
    }
    if (
      foldersCopy.some((folderCopy) => folderCopy.parentFolderId === toFolder)
    ) {
      throw new BadRequestException('Copying to the same directory');
    }
    if (
      foldersCopy.some(
        (folderCopy) =>
          folderCopy.parentFolderId !== foldersCopy[0].parentFolderId,
      )
    ) {
      throw new BadRequestException('Copying multiple sources into one');
    }

    const data = await this.folderService.copy(
      user.id,
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
  @Crud(CRUD.DELETE)
  async delete(
    @Req() { user }: ExpressRequest,
    @Body() { foldersId }: FoldersDeleteRequest,
  ): Promise<SuccessResponse> {
    const rootFolder = await this.folderService.rootFolder(user);
    if (foldersId.includes(rootFolder.id)) {
      throw new BadRequestException('This is a root folder in a list');
    }

    const { affected } = await this.folderService.delete(foldersId);
    if (!affected) {
      throw new NotFoundException('This folder is not exists');
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
      throw new NotFoundException(`Folder '${id}' is not exists`);
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
        throw new NotFoundException(`Folder '${parentFolderId}' is not exists`);
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
    @Req() { user }: ExpressRequest,
    @Param('folderId', ParseUUIDPipe) folderId: string,
  ): Promise<SuccessResponse> {
    const rootFolder = await this.folderService.rootFolder(user);
    if (folderId === rootFolder.id) {
      throw new BadRequestException('This is a root folder in a list');
    }

    const { affected } = await this.folderService.delete([folderId]);
    if (!affected) {
      throw new NotFoundException('This folder is not exists');
    }

    return {
      status: Status.Success,
    };
  }
}
