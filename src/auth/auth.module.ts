import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { DatabaseModule } from '@/database/database.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_ACCESS_TOKEN'),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: configService.get('JWT_ACCESS_EXPIRES', '10min'),
        },
      }),
      inject: [ConfigService],
    }),
    PassportModule,
    forwardRef(() => DatabaseModule),
  ],

  providers: [JwtStrategy, AuthService],
  exports: [AuthService],
})
export class AuthModule {}
