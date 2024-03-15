import { writeFile } from 'node:fs/promises';
import { join as pathJoin } from 'node:path';
import { dump as yamlDump } from 'js-yaml';
import { HttpAdapterHost, NestApplication, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  SwaggerModule,
  DocumentBuilder,
  type SwaggerCustomOptions,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';

import { version, author, homepage, description } from '../package.json';
import { ExceptionsFilter } from './exception/exceptions.filter';
import { validationPipeOptions } from './utils/validation-pipe-options';
import { WsAdapter } from './websocket/ws-adapter';
import { AppModule } from './app.module';
import { UserService } from './database/user.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    autoFlushLogs: true,
    cors: {
      origin: [
        'https://cp.myscreen.ru',
        'https://cp.dev.myscreen.ru',
        'https://api.myscreen.ru',
        'https://api.dev.myscreen.ru',
        'https://promo.myscreen.ru',
        'http://localhost:3000',
        'http://localhost:3001',
      ],
      credentials: true,
      maxAge: 7200, // in seconds, 2 hours
    },
  });
  const logger = app.get(Logger);
  app.useLogger(logger);
  const userService = app.get(UserService);
  const configService = app.get(ConfigService);
  const port = configService.get<string>('PORT', '3000');
  const apiPath = configService.get<string>('API_PATH', '/api/v2');
  const { frontendUrl } = userService;
  app.disable('x-powered-by').disable('server');
  const staticAssets = pathJoin('static');
  app
    .useStaticAssets(staticAssets, {
      dotfiles: 'deny',
    })
    .setGlobalPrefix(apiPath, { exclude: ['/'] })
    .useGlobalFilters(
      new ExceptionsFilter(app.get(HttpAdapterHost).httpAdapter, configService),
    )
    .useGlobalPipes(validationPipeOptions())
    .useGlobalInterceptors(new LoggerErrorInterceptor())
    .useWebSocketAdapter(new WsAdapter(app));

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

    .addTag('auth', 'Аутентификация пользователя', {
      description: 'Аутентификация пользователя',
      url: `${frontendUrl}/login`,
    })
    .addTag('user', 'Пользователи (только администратор)', {
      description: 'Пользователи',
      url: `${frontendUrl}/users/list`,
    })
    .addTag('folder', 'Папки', {
      description: 'Библиотека',
      url: `${frontendUrl}/library`,
    })
    .addTag('file', 'Файлы', {
      description: 'Библиотека',
      url: `${frontendUrl}/library`,
    })
    .addTag('playlist', 'Плейлисты', {
      description: 'Плейлисты',
      url: `${frontendUrl}/playlists/list`,
    })
    .addTag('monitor', 'Мониторы', {
      description: 'Мониторы',
      url: `${frontendUrl}/monitors/list`,
    })
    .addTag('editor', 'Редакторы', {
      description: 'Видео-редактор',
      url: `${frontendUrl}/editor/projects`,
    })
    .addTag('application', 'Заявки', {
      description: 'Заявки',
      url: `${frontendUrl}/applications`,
    })
    .addTag('bid', 'Заявки', {
      description: 'Заявки',
      url: `${frontendUrl}/applications`,
    })
    .addTag('statistics', 'Cтатистика')
    .addTag('invoice', 'Счета', {
      description: 'Счета',
      url: `${frontendUrl}/accountant/invoices`,
    })
    .addTag('crontab', 'CronTab (только администратор)')
    .addTag('constants', 'Серверные заданные константы')
    .addTag('wallet', 'Кошелек, получение дебета/кредита')

    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  async function yamlSwagger() {
    const swaggerYml = pathJoin(staticAssets, 'swagger.yml');
    const yamlDocument = yamlDump(swaggerDocument, {
      quotingType: '"',
      skipInvalid: true,
    });
    await writeFile(swaggerYml, yamlDocument);
    logger.debug(
      `The file '${swaggerYml}' has been writed`,
      NestApplication.name,
    );
  }
  yamlSwagger();

  const swaggerOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: description,
    customfavIcon: '/favicon.ico',
    customCss:
      ".swagger-ui .topbar { padding: 0; } .swagger-ui .topbar a { content: url('/favicon.ico'); max-width: 40px; max-height: 44px; } .swagger-ui .topbar .topbar-wrapper::after { margin-left: 5px; content: 'MyScreen'; color: white; }",
  };
  SwaggerModule.setup(apiPath, app, swaggerDocument, swaggerOptions);

  await app.listen(port);
  const url = await app.getUrl();
  logger.warn(
    `Server version ${version} started in ${process.env.NODE_ENV} mode on ${url}${apiPath}`,
    NestApplication.name,
  );
}
bootstrap();
