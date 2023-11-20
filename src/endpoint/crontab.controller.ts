import { Body, HttpCode, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { SuccessResponse, CrontabCreateRequest } from '@/dto';
import { ApiComplexDecorators, Crud } from '@/decorators';
import { Status, CRUD, UserRoleEnum } from '@/enums';
import { CrontabService } from '@/crontab/crontab.service';

@ApiComplexDecorators('crontab', [UserRoleEnum.Administrator])
export class CrontabController {
  logger = new Logger(CrontabController.name);

  constructor(private readonly crontabService: CrontabService) {}

  @Post('create/users')
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
  @Crud(CRUD.CREATE)
  async crontabCreate(
    @Body() { crontab }: CrontabCreateRequest,
  ): Promise<SuccessResponse> {
    this.crontabService.add(crontab);

    return {
      status: Status.Success,
    };
  }

  @Post('delete/users')
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
  @Crud(CRUD.DELETE)
  async crontabDelete(): Promise<SuccessResponse> {
    this.crontabService.delete();

    return {
      status: Status.Success,
    };
  }
}
