import { Controller, Get, Logger } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthResponseDto } from '@/endpoint/dto/response/auth.response';
import { UnauthorizedErrorResponse } from '@/endpoint/dto/response/unauthorized.reponse';
import { ForbiddenErrorResponse } from '@/endpoint/dto/response/forbidden.reponse';
import { AuthService } from './auth.service';
// import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Get('/')
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Проверяет, авторизован ли пользователь' })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description:
      'Ответ для авторизованных пользователей у которых истек срок действия токена',
    type: UnauthorizedErrorResponse,
  })
  @ApiResponse({
    status: 403,
    description: 'Ответ неавторизованных пользователей',
    type: ForbiddenErrorResponse,
  })
  async auth(): Promise<AuthResponseDto> {
    return this.authService.authentication();
  }
}
