import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TypeOrmOptionsService } from '@/shared/typeorm.options';
import { FileModule } from '@/file/file.module';
import { MonitorModule } from '@/monitor/monitor.module';
import { UserModule } from '@/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      useClass: TypeOrmOptionsService,
    }),

    FileModule,
    MonitorModule,
    UserModule,
  ],
  providers: [Logger],
})
export class AppModule {}
