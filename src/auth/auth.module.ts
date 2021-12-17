import { Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { DatabaseModule } from '@/database/database.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES'),
        },
      }),
      inject: [ConfigService],
    }),

    DatabaseModule,
  ],

  providers: [Logger, JwtStrategy, AuthService],
  exports: [AuthService],
})
export class AuthModule {}
