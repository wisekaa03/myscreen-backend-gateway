import { HttpAdapterHost, NestApplication, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import {
  SwaggerModule,
  DocumentBuilder,
  type SwaggerCustomOptions,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';

import { winstonOptions } from '@/shared/logger.options';
import { version, author, description } from '../package.json';
import { AppModule } from './app.module';
import { ExceptionsFilter } from './exception/exceptions.filter';

(async () => {
  const configService = new ConfigService();
  const apiPath = configService.get<string>('API_PATH', '/api/v2');
  const logger = WinstonModule.createLogger(winstonOptions(configService));

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
  });
  const httpAdaper = app.get(HttpAdapterHost);
  app.useGlobalFilters(new ExceptionsFilter(httpAdaper.httpAdapter));
  app.setGlobalPrefix(apiPath);
  app.useLogger(logger);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      skipUndefinedProperties: true,
      stopAtFirstError: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .addBearerAuth({
      type: 'http',
      description: 'Токен авторизации',
      name: 'token',
    })
    .setTitle(description)
    .addTag('auth', 'Аутентификация пользователя')
    .addTag('user', 'Действия с пользователями (только администратор)')
    .addTag('folder', 'Манипуляции с папками')
    .addTag('media', 'Манипуляции с медиа файлами')

    .addTag('playlist', 'Плейлисты пользователя')
    .addTag('editor', 'Манипуляции с редактором')
    .addTag('monitor', 'Точки пользователя')

    // .addTag('order', 'Путь для манипуляция с заказами')
    // .addTag('payment', 'Путь для манипуляция с оплатами')
    // .addTag('uptime', 'Путь для проверки аптайм мониторов')
    // .addTag('log', 'Путь для манипуляция с логами')

    // .addTag('upload', 'Путь для загрузки файлов')

    .setDescription(author)
    .setVersion(version)
    .build();

  const swaggerOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: description,
  };
  SwaggerModule.setup(
    apiPath,
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
    swaggerOptions,
  );

  const PORT = configService.get<number>('PORT', 3000);
  await app.listen(PORT);
  logger.log(
    `Server version ${version} started on ${await app.getUrl()}`,
    NestApplication.name,
  );
})();
