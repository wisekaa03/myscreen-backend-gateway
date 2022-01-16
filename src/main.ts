import { writeFile } from 'node:fs';
import { resolve as pathResolve } from 'node:path';
import { stringify as yamlStringify } from 'yaml';
import { HttpAdapterHost, NestApplication, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import {
  SwaggerModule,
  DocumentBuilder,
  type SwaggerCustomOptions,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

import { version, author, homepage, description } from '../package.json';
import { AppModule } from './app.module';
import { ExceptionsFilter } from './exception/exceptions.filter';

(async () => {
  const configService = new ConfigService();
  const apiPath = configService.get<string>('API_PATH', '/api/v2');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    cors: {
      origin: [
        'https://cp.myscreen.ru',
        'https://cp.dev.myscreen.ru',
        'https://api.myscreen.ru',
        'https://api.dev.myscreen.ru',
        'http://localhost:3000',
      ],
      credentials: true,
    },
  });
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.flushLogs();
  app.disable('x-powered-by');
  app.disable('server');
  const httpAdaper = app.get(HttpAdapterHost);
  app.useGlobalFilters(new ExceptionsFilter(httpAdaper.httpAdapter));
  app.setGlobalPrefix(apiPath, { exclude: ['/'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      skipUndefinedProperties: true,
      stopAtFirstError: true,
    }),
  );
  app.useStaticAssets(pathResolve(__dirname, '../..', 'static'));

  const swaggerConfig = new DocumentBuilder()
    .addBearerAuth({
      type: 'http',
      description: 'Токен авторизации',
      name: 'token',
    })
    .setTitle(description)
    .setDescription(description)
    .setVersion(version)
    .setExternalDoc(description, homepage)
    .setContact(author.name, author.url, author.email)

    .addTag('auth', 'Аутентификация пользователя')
    .addTag('user', 'Пользователи (только администратор)')
    .addTag('folder', 'Папки')
    .addTag('file', 'Файлы')
    .addTag('playlist', 'Плейлисты')
    .addTag('monitor', 'Мониторы')
    .addTag('editor', 'Редакторы')
    .addTag('order', 'Заказы')
    .addTag('payment', 'Оплата')

    // .addTag('uptime', 'Путь для проверки аптайм мониторов')
    // .addTag('log', 'Путь для манипуляция с логами')

    .build();

  const swaggerOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: description,
    customCss:
      // ".swagger-ui .topbar { display: none }",
      ".swagger-ui .topbar img { content: url('/favicon.ico') } .swagger-ui .topbar a::after { margin-left: 10px; content: 'MyScreen' }",
  };
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  writeFile(
    pathResolve(__dirname, '../../static', 'swagger.yml'),
    yamlStringify(swaggerDocument),
    () => {
      logger.log('The swagger.yml file has been writed', NestApplication.name);
    },
  );
  SwaggerModule.setup(apiPath, app, swaggerDocument, swaggerOptions);

  await app.listen(configService.get<number>('PORT', 3000));
  logger.warn(
    `Server version ${version} started on ${await app.getUrl()}`,
    NestApplication.name,
  );
})();
