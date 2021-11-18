import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmOptionsService } from './shared/typeorm.options';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      useClass: TypeOrmOptionsService,
    }),
    TypeOrmModule.forFeature([]),
  ],
  providers: [Logger],
})
export class AppModule {}
