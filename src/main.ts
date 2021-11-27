import { NestApplication, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';

import { winstonOptions } from '@/shared/logger.options';
import { version, name, description } from '../package.json';
import { AppModule } from './app.module';
import { ValidationPipe } from './pipes/validation.pipe';

(async () => {
  const configService = new ConfigService();
  const apiPath = configService.get<string>('API_PATH', '/api/v2');
  const logger = WinstonModule.createLogger(winstonOptions(configService));

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
    cors: true,
  });
  app.setGlobalPrefix(apiPath);
  app.useLogger(logger);
  app.useGlobalPipes(new ValidationPipe());

  const swaggerConfig = new DocumentBuilder()
    .addBearerAuth({
      type: 'http',
      description: 'Токен авторизации',
      name: 'token',
    })
    .setTitle(name)
    .setDescription(description)
    .setVersion(version)
    .addTag(name)
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
