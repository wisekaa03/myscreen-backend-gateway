import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TypeOrmOptionsService } from '@/shared/typeorm.options';
import { DatabaseModule } from '@/database/database.module';
import { EndpointModule } from '@/endpoint/endpoint.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      useClass: TypeOrmOptionsService,
    }),

    DatabaseModule,
    EndpointModule,
  ],
  providers: [Logger],
})
export class AppModule {}
