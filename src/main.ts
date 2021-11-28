import { HttpAdapterHost, NestApplication, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';

import { winstonOptions } from '@/shared/logger.options';
import { version, author, description } from '../package.json';
import { AppModule } from './app.module';
import { ValidationPipe } from './pipes/validation.pipe';
import { ExceptionsFilter } from './exception/exceptions.filter';

(async () => {
  const configService = new ConfigService();
  const apiPath = configService.get<string>('API_PATH', '/api/v2');
  const logger = WinstonModule.createLogger(winstonOptions(configService));

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
    cors: true,
  });
  const httpAdaper = app.get(HttpAdapterHost);
  app.useGlobalFilters(new ExceptionsFilter(httpAdaper.httpAdapter));
  app.setGlobalPrefix(apiPath);
  app.useLogger(logger);
  app.useGlobalPipes(new ValidationPipe());

  const swaggerConfig = new DocumentBuilder()
    .addBearerAuth({
      type: 'http',
      description: 'Токен авторизации',
      name: 'token',
    })
    .setTitle(description)
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
  logger.verbose(
    `Server version ${version} started on ${await app.getUrl()}`,
    NestApplication.name,
  );
})();
