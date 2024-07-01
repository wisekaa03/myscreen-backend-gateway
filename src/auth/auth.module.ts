import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { DatabaseModule } from '@/database/database.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { WSModule } from '@/websocket/ws.module';

@Module({
  imports: [
    forwardRef(() => DatabaseModule),
    forwardRef(() => WSModule),

    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_ACCESS_TOKEN'),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: configService.getOrThrow('JWT_ACCESS_EXPIRES'),
        },
      }),
      inject: [ConfigService],
    }),
    PassportModule,
  ],

  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
