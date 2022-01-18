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

import {
  AsyncApiDocumentBuilder,
  AsyncApiModule,
  AsyncServerObject,
} from 'nestjs-asyncapi';
import { version, author, homepage, description } from '../package.json';
import { AppModule } from './app.module';
import { ExceptionsFilter } from './exception/exceptions.filter';

(async () => {
  const configService = new ConfigService();
  const port = configService.get<number>('PORT', 3000);
  const apiPath = configService.get<string>('API_PATH', '/api/v2');
  const wsPath = configService.get<string>('WS_PATH', '/api/v2/ws');

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
      ],
      credentials: true,
    },
  });
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.flushLogs();
  app.disable('x-powered-by');
  app.disable('server');
  const httpAdaperHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new ExceptionsFilter(httpAdaperHost.httpAdapter));
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
      ".swagger-ui .topbar img { content: url('/favicon.ico') } .swagger-ui .topbar a::after { margin-left: 10px; content: 'MyScreen' }",
  };
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  (async () => {
    writeFile(
      pathResolve(__dirname, '../../static', 'swagger.yml'),
      yamlStringify(swaggerDocument),
      () => {
        logger.debug(
          'The swagger.yml file has been writed',
          NestApplication.name,
        );
      },
    );
  })();
  SwaggerModule.setup(apiPath, app, swaggerDocument, swaggerOptions);

  const asyncApiServer: AsyncServerObject = {
    url: `ws://localhost:${port}`,
    protocol: 'socket.io',
    protocolVersion: '4',
    description,
    security: [{ 'user-password': [] }],
    // variables: {
    //   port: {
    //     description: 'Secure connection (TLS) is available through port 443.',
    //     default: '443',
    //   },
    // },
    bindings: {},
  };

  const asyncApiOptions = new AsyncApiDocumentBuilder()
    .setTitle(description)
    .setDescription(description)
    .setVersion(version)
    .setExternalDoc(description, homepage)
    .setContact(author.name, author.url, author.email)
    .setDefaultContentType('application/json')
    // .addBearerAuth({
    //   type: 'http',
    //   description: 'Токен авторизации',
    //   name: 'token',
    // })
    .addSecurity('user-password', { type: 'userPassword' })
    .addTag('auth', 'Аутентификация пользователя')
    .addTag('user', 'Пользователи (только администратор)')
    .addTag('folder', 'Папки')
    .addTag('file', 'Файлы')
    .addTag('playlist', 'Плейлисты')
    .addTag('monitor', 'Мониторы')
    .addTag('editor', 'Редакторы')
    .addTag('order', 'Заказы')
    .addTag('payment', 'Оплата')
    .addServer('file', asyncApiServer)
    .build();
  const asyncapiDocument = AsyncApiModule.createDocument(app, asyncApiOptions);
  await AsyncApiModule.setup(wsPath, app, asyncapiDocument);

  await app.listen(port);
  const url = await app.getUrl();
  logger.warn(
    `Server version ${version} started on ${`${url}${apiPath}`}, ${`${url}${wsPath}`}`,
    NestApplication.name,
  );
})();
