import { NestApplication, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';

import { winstonOptions } from '@/shared/logger.options';
import { version, name, description } from '../package.json';
import { AppModule } from './app.module';

(async () => {
  const configService = new ConfigService();
  const logger = WinstonModule.createLogger(winstonOptions(configService));

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
    cors: true,
  });
  app.useLogger(logger);

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
  SwaggerModule.setup(
    configService.get('API_PATH', '/api/v2'),
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  const PORT = configService.get<number>('PORT', 3000);
  await app.listen(PORT);
  logger.verbose(
    `Server version ${version} started on ${await app.getUrl()}`,
    NestApplication.name,
  );
})();
