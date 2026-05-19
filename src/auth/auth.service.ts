import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UserRepository } from './user.repository';
import { PASSWORD_HASHER } from './constants/auth.constants';
import type { PasswordHasher } from './interfaces/hasher.interface';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedUser } from './interfaces/authenticated-request.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private authRepository: UserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly hasher: PasswordHasher,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    username: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.authRepository.findByUsername({
      username,
    });

    if (!user) return null;

    const passwordMatches = await this.hasher.verify(
      user.passwordHash,
      password,
    );

    if (!passwordMatches) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
    };
  }

  async login(user: AuthenticatedUser) {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.authRepository.findByUsername({
      username: dto.username,
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const passwordHash = await this.hasher.hash(dto.password);

    const user = await this.authRepository.create({
      username: dto.username,
      passwordHash,
    });

    return {
      id: user.id,
      username: user.username,
    };
  }
}
