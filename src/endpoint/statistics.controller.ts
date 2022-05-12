import { Request as ExpressRequest } from 'express';
import {
  Controller,
  forwardRef,
  Get,
  HttpCode,
  Inject,
  Logger,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
} from '@/dto';
import { JwtAuthGuard, Roles, RolesGuard } from '@/guards';
import { Status, UserRoleEnum } from '@/enums';
import {
  StatisticsPlaylistResponse,
  StatisticsResponse,
  StorageSpaceResponse,
} from '@/dto/response/statistics.response';
import { UserService } from '@/database/user.service';
import { WSGateway } from '@/websocket/ws.gateway';
import { PlaylistService } from '@/database/playlist.service';

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
  description: 'Ошибка медиа',
  type: NotFoundError,
})
@ApiResponse({
  status: 500,
  description: 'Ошибка сервера',
  type: InternalServerError,
})
@ApiResponse({
  status: 503,
  description: 'Ошибка сервера',
  type: ServiceUnavailableError,
})
@Roles(
  UserRoleEnum.Administrator,
  UserRoleEnum.Advertiser,
  UserRoleEnum.MonitorOwner,
)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  logger = new Logger(StatisticsController.name);

  constructor(
    private readonly userService: UserService,
    private readonly playlistService: PlaylistService,
    @Inject(forwardRef(() => WSGateway))
    private readonly wsGateway: WSGateway,
  ) {}

  @Get('/')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'statistics',
    summary: 'Получение статистики',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: StatisticsResponse,
  })
  async getPlaylists(
    @Req() { user: { id: userId } }: ExpressRequest,
  ): Promise<StatisticsResponse> {
    const countDevices = this.wsGateway.statistics(userId);

    const playlists: StatisticsPlaylistResponse = {
      added: 0,
      played: 0,
    };

    const data = await this.userService.findById(userId);
    const storageSpace: StorageSpaceResponse = {
      used: data?.countUsedSpace ?? 0,
      unused: data?.storageSpace ?? 0,
    };

    return {
      status: Status.Success,
      countDevices,
      playlists,
      storageSpace,
    };
  }
}
