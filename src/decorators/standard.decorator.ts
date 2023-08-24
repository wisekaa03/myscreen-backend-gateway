import {
  Controller,
  HttpStatus,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  NotAcceptableError,
  NotImplementedError,
  PreconditionFailedError,
  UnauthorizedError,
} from '@/dto';
import { UserRoleEnum } from '@/enums/user-role.enum';
import { JwtAuthGuard, RolesGuard } from '@/guards';
import { Roles } from './roles.decorator';

export const Standard = (path: string, roles?: UserRoleEnum[]) =>
  Array.isArray(roles)
    ? applyDecorators(
        ApiResponse({
          status: HttpStatus.BAD_REQUEST,
          description: 'Ответ будет таким если с данным что-то не так',
          type: BadRequestError,
        }),
        ApiResponse({
          status: HttpStatus.CONFLICT,
          description: 'Ответ для конфликта файлов',
          type: ConflictError,
        }),
        ApiResponse({
          status: HttpStatus.FORBIDDEN,
          description: 'Ответ для неавторизованного пользователя',
          type: ForbiddenError,
        }),
        ApiResponse({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          description: 'Ошибка сервера',
          type: InternalServerError,
        }),
        ApiResponse({
          status: HttpStatus.NOT_ACCEPTABLE,
          description: 'Не принято значение',
          type: NotAcceptableError,
        }),
        ApiResponse({
          status: HttpStatus.NOT_FOUND,
          description: 'Не найдено',
          type: NotFoundError,
        }),
        ApiResponse({
          status: HttpStatus.NOT_IMPLEMENTED,
          description: 'Пока не реализовано',
          type: NotImplementedError,
        }),
        ApiResponse({
          status: HttpStatus.PRECONDITION_FAILED,
          description: 'Пользователь уже существует',
          type: PreconditionFailedError,
        }),
        ApiResponse({
          status: HttpStatus.UNAUTHORIZED,
          description: 'Ответ для незарегистрированного пользователя',
          type: UnauthorizedError,
        }),
        Roles(roles),
        UseGuards(JwtAuthGuard, RolesGuard),
        ApiBearerAuth(),
        ApiTags(path),
        Controller(path),
      )
    : applyDecorators(
        ApiResponse({
          status: HttpStatus.BAD_REQUEST,
          description: 'Ответ будет таким если с данным что-то не так',
          type: BadRequestError,
        }),
        ApiResponse({
          status: HttpStatus.CONFLICT,
          description: 'Ответ для конфликта файлов',
          type: ConflictError,
        }),
        ApiResponse({
          status: HttpStatus.FORBIDDEN,
          description: 'Ответ для неавторизованного пользователя',
          type: ForbiddenError,
        }),
        ApiResponse({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          description: 'Ошибка сервера',
          type: InternalServerError,
        }),
        ApiResponse({
          status: HttpStatus.NOT_ACCEPTABLE,
          description: 'Не принято значение',
          type: NotAcceptableError,
        }),
        ApiResponse({
          status: HttpStatus.NOT_FOUND,
          description: 'Не найдено',
          type: NotFoundError,
        }),
        ApiResponse({
          status: HttpStatus.NOT_IMPLEMENTED,
          description: 'Пока не реализовано',
          type: NotImplementedError,
        }),
        ApiResponse({
          status: HttpStatus.PRECONDITION_FAILED,
          description: 'Пользователь уже существует',
          type: PreconditionFailedError,
        }),
        ApiResponse({
          status: HttpStatus.UNAUTHORIZED,
          description: 'Ответ для незарегистрированного пользователя',
          type: UnauthorizedError,
        }),
        ApiTags(path),
        Controller(path),
      );
