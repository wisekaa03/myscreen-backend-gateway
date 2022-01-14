import { Controller, Get, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response as ExpressResponse } from 'express';

@ApiExcludeController()
@Controller()
export class RootController {
  private response: string;

  constructor(configService: ConfigService) {
    this.response = configService.get<string>(
      'FRONTEND_URL',
      'https://myscreen.ru',
    );
  }

  @Get('/')
  async root(@Res() res: ExpressResponse) {
    res.redirect(302, this.response);
  }
}
