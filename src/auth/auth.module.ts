import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { HashService } from './services/password-hasher.service';
import { PASSWORD_HASHER } from './constants/auth.constants';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../users/users.module';
import { PrismaModule } from 'src/database/prisma.module';

@Module({
  imports: [
    ConfigModule,
    UserModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),

        signOptions: {
          expiresIn: configService.get<'1d'>('JWT_EXPIRES_IN') ?? '1d',
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: PASSWORD_HASHER,
      useClass: HashService,
    },
    LocalStrategy,
    JwtStrategy,
  ],
})
export class AuthModule {}
