import type { Request as ExpressRequest } from 'express';
import { Body, HttpCode, Logger, Post, Req } from '@nestjs/common';

import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CRUD, Status, UserRoleEnum } from '@/enums';
import { ApiComplexDecorators, Crud } from '@/decorators';
import { paginationQueryToConfig } from '@/utils/pagination-query-to-config';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { UserService } from '@/database/user.service';
import { WalletService } from '@/database/wallet.service';
import { WalletEntity } from '@/database/wallet.entity';
import { WalletOperationsGetRequest, WalletOperationsGetResponse } from '@/dto';

@ApiComplexDecorators('wallet', [
  UserRoleEnum.Administrator,
  UserRoleEnum.Advertiser,
  UserRoleEnum.MonitorOwner,
  UserRoleEnum.Accountant,
])
export class WalletController {
  logger = new Logger(WalletController.name);

  constructor(
    private readonly userService: UserService,
    private readonly walletService: WalletService,
  ) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    operationId: 'wallet-operations-get',
    summary: 'Получение списка операций',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: WalletOperationsGetRequest,
  })
  @Crud(CRUD.READ)
  async getWallet(
    @Req() { user }: ExpressRequest,
    @Body() { where, select, scope }: WalletOperationsGetRequest,
  ): Promise<WalletOperationsGetResponse> {
    const whenUserId =
      user.role === UserRoleEnum.Administrator ||
      user.role === UserRoleEnum.Accountant
        ? undefined
        : user.id;
    const [data, count] = await this.walletService.find({
      ...paginationQueryToConfig(scope),
      select,
      where: { ...TypeOrmFind.where(WalletEntity, where), userId: whenUserId },
    });

    return {
      status: Status.Success,
      count,
      data,
    };
  }
}
