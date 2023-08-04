import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
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
  UnauthorizedError,
  InternalServerError,
  SuccessResponse,
  NotFoundError,
} from '@/dto';
import { JwtAuthGuard, RolesGuard, Roles } from '@/guards';
import { Status } from '@/enums/status.enum';
import { UserRoleEnum } from '@/enums/user-role.enum';
import { CrontabService } from '@/crontab/crontab.service';

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
@Roles(UserRoleEnum.Administrator)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiTags('crontab')
@Controller('crontab')
export class CrontabController {
  logger = new Logger(CrontabController.name);

  constructor(private readonly crontabService: CrontabService) {}

  @Get('create/users')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'crontab-create-users',
    summary: 'Включение CronTab для пользователей (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async crontabCreate(): Promise<SuccessResponse> {
    this.crontabService.addCronJob();

    return {
      status: Status.Success,
    };
  }

  @Get('delete/users')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'crontab-delete-users',
    summary: 'Выключение CronTab для пользователей (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async crontabDelete(): Promise<SuccessResponse> {
    this.crontabService.deleteCron();

    return {
      status: Status.Success,
    };
  }
}
