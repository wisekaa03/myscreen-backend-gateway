import { Get, HttpCode, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { ApiComplexDecorators, Crud } from '@/decorators';
import { CRUD, Status, UserRoleEnum } from '@/enums';
import { ConstantsGetResponse, ConstantsResponse } from '@/dto';
import { WalletService } from '@/database/wallet.service';
import { BidService } from '@/database/bid.service';
import { InvoiceService } from '@/database/invoice.service';
import { version } from '../../package.json';
import { WsEvent } from '@/enums/ws-event.enum';

@ApiComplexDecorators({
  path: ['constants'],
  roles: [
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Monitor,
    UserRoleEnum.Accountant,
  ],
})
export class ConstantsController {
  logger = new Logger(ConstantsController.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly bidService: BidService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({
    operationId: 'constants-get',
    summary: 'Получение списка констант',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: ConstantsGetResponse,
  })
  @Crud(CRUD.READ)
  async getConstants(): Promise<ConstantsGetResponse> {
    const data: ConstantsResponse = {
      VERSION_BACKEND: version,
      SUBSCRIPTION_FEE: this.walletService.subscriptionFee,
      MIN_INVOICE_SUM: this.invoiceService.minInvoiceSum,
      COMMISSION_PERCENT: this.bidService.commissionPercent,
      WS_EVENT: WsEvent,
    };
    return { status: Status.Success, data };
  }
}
