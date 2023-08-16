import { writeFile } from 'node:fs/promises';
import { join as pathJoin } from 'node:path';
import { dump as yamlDump } from 'js-yaml';
import { HttpAdapterHost, NestApplication, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import {
  SwaggerModule,
  DocumentBuilder,
  type SwaggerCustomOptions,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { ValidationError } from 'class-validator';

import { version, author, homepage, description } from '../package.json';
import { ExceptionsFilter } from './exception/exceptions.filter';
import { WsAdapter } from './websocket/ws-adapter';
import { AppModule } from './app.module';

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
        'http://localhost:3000',
        'http://localhost:3001',
      ],
      credentials: true,
      maxAge: 7200, // in seconds, 2 hours
    },
  });
  const logger = app.get(Logger);
  app.useLogger(logger);
  const configService = app.get(ConfigService);
  const port = configService.get<string>('PORT', '3000');
  const apiPath = configService.get<string>('API_PATH', '/api/v2');
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
    .useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        skipUndefinedProperties: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        stopAtFirstError: false,
        exceptionFactory: (errors: ValidationError[]) => {
          const message = errors
            .map((error) => {
              let ret: Array<string> =
                (error.constraints && Object.values(error.constraints)) || [];
              if (error.children && error.children.length > 0) {
                ret = [
                  ...ret,
                  error.children
                    .map(
                      (child) =>
                        child.constraints && Object.values(child.constraints),
                    )
                    .join(', '),
                ];
              }
              return ret;
            })
            .join(', ');
          return new BadRequestException(message);
        },
      }),
    )
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

    .addTag('auth', 'Аутентификация пользователя')
    .addTag('user', 'Пользователи (только администратор)')
    .addTag('folder', 'Папки')
    .addTag('file', 'Файлы')
    .addTag('playlist', 'Плейлисты')
    .addTag('monitor', 'Мониторы')
    .addTag('editor', 'Редакторы')
    .addTag('application', 'Взаимодействия покупателей и продавца')
    .addTag('statistics', 'Cтатистика')
    .addTag('invoice', 'Счета')
    .addTag('crontab', 'CronTab (только администратор)')

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
    customCss:
      ".swagger-ui .topbar img { content: url('/favicon.ico') } .swagger-ui .topbar a::after { margin-left: 10px; content: 'MyScreen' }",
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
