import type { Request as ExpressRequest } from 'express';
import { isUUID } from 'class-validator';
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
  HttpStatus,
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
import { Status, UserRoleEnum } from '@/enums';
import { JwtAuthGuard, Roles, RolesGuard } from '@/guards';
import { paginationQueryToConfig } from '@/utils/pagination-query-to-config';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { FolderEntity } from '@/database/folder.entity';
import {
  FolderService,
  administratorFolderId,
} from '@/database/folder.service';
import { UserService } from '@/database/user.service';
import { UserEntity } from '@/database/user.entity';

@ApiResponse({
  status: HttpStatus.BAD_REQUEST,
  description: 'Ответ будет таким если с данным что-то не так',
  type: BadRequestError,
})
@ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  description: 'Ответ для незарегистрированного пользователя',
  type: UnauthorizedError,
})
@ApiResponse({
  status: HttpStatus.FORBIDDEN,
  description: 'Ответ для неавторизованного пользователя',
  type: ForbiddenError,
})
@ApiResponse({
  status: HttpStatus.NOT_FOUND,
  description: 'Не найдено',
  type: NotFoundError,
})
@ApiResponse({
  status: HttpStatus.INTERNAL_SERVER_ERROR,
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

  constructor(
    private readonly folderService: FolderService,
    private readonly userService: UserService,
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
  async getFolders(
    @Req() { user }: ExpressRequest,
    @Body() { scope, select, where }: FoldersGetRequest,
  ): Promise<FoldersGetResponse> {
    let count: number = 0;
    let data: FolderResponse[] = [];
    const parentFolderId = where?.parentFolderId?.toString();
    if (
      user.role === UserRoleEnum.Administrator &&
      parentFolderId?.startsWith(administratorFolderId)
    ) {
      // мы в режиме администратора
      const fromRegex = parentFolderId.match(
        /^([0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12})\/([0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12})$/,
      );
      if (fromRegex?.length === 3) {
        // получили имя папки
        const userExpressionId = fromRegex[2];
        const userExpression = await this.userService.findById(
          userExpressionId,
        );
        if (!userExpression) {
          throw new NotFoundException();
        }
        const parentFolder = await this.folderService.rootFolder(
          userExpression,
        );
        [data, count] = await this.folderService.findAndCount({
          ...paginationQueryToConfig(scope),
          select,
          where: TypeOrmFind.Where(
            {
              ...where,
              parentFolderId: parentFolder.id,
            },
            userExpression,
          ),
        });
      } else {
        // в режиме администратора выводим всех пользователей
        let userData: UserEntity[];
        [userData, count] = await this.userService.findAndCount({});
        data = userData.map((item) => ({
          id: `${administratorFolderId}/${item.id}`,
          name: UserService.fullName(item),
          parentFolderId,
          empty: false,
          createdAt: item.createdAt ?? new Date(),
          updatedAt: item.updatedAt ?? new Date(),
        }));
      }
    } else {
      // в любом другом режиме выводим все папки
      if (
        user.role !== UserRoleEnum.Administrator &&
        parentFolderId &&
        !isUUID(parentFolderId)
      ) {
        throw new BadRequestException('id must be a UUID');
      }
      [data, count] = await this.folderService.findAndCount({
        ...paginationQueryToConfig(scope),
        select,
        where: TypeOrmFind.Where(where, user),
      });
      if (
        user.role === UserRoleEnum.Administrator &&
        parentFolderId === (await this.folderService.rootFolder(user)).id
      ) {
        count += 1;
        data = [...data, await this.folderService.administratorFolder(user)];
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
  async createFolder(
    @Req() { user }: ExpressRequest,
    @Body() { name, parentFolderId }: FolderCreateRequest,
  ): Promise<FolderGetResponse> {
    const parentFolder = parentFolderId
      ? await this.folderService.findOne({
          where: { userId: user.id, id: parentFolderId },
        })
      : await this.folderService.rootFolder(user);
    if (!parentFolder) {
      throw new BadRequestException(`Folder '${parentFolderId}' is not exists`);
    }

    return {
      status: Status.Success,
      data: await this.folderService.update({
        userId: user.id,
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
    @Req() { user }: ExpressRequest,
    @Body() { foldersId }: FoldersDeleteRequest,
  ): Promise<SuccessResponse> {
    const rootFolder = await this.folderService.rootFolder(user);
    if (foldersId.includes(rootFolder.id)) {
      throw new BadRequestException('This is a root folder in a list');
    }
    const { affected } = await this.folderService.delete(user, foldersId);
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
    @Req() { user }: ExpressRequest,
    @Param('folderId', ParseUUIDPipe) folderId: string,
  ): Promise<SuccessResponse> {
    const rootFolder = await this.folderService.rootFolder(user);
    if (folderId === rootFolder.id) {
      throw new BadRequestException('This is a root folder in a list');
    }
    const { affected } = await this.folderService.delete(user, [folderId]);
    if (!affected) {
      throw new NotFoundException('This folder is not exists');
    }

    return {
      status: Status.Success,
    };
  }
}
