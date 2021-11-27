import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  BadRequestError,
  UnauthorizedError,
  PreconditionFailedError,
  MediaGetFilesRequest,
  MediaGetFilesResponse,
} from '@/dto';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { MediaService } from './media.service';

@ApiTags('media')
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
  status: 412,
  description: 'Пользователь уже существует',
  type: PreconditionFailedError,
})
@Controller('/media')
export class MediaController {
  logger = new Logger(MediaController.name);

  constructor(private readonly mediaService: MediaService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'media',
    summary: 'Получение списка файлов редактора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MediaGetFilesRequest,
  })
  async getMedia(): Promise<MediaGetFilesResponse> {
    return this.mediaService.getMedia();
  }
}
