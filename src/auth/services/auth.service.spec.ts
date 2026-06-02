import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { UserRepository } from 'src/users/users.repository';
import { PASSWORD_HASHER } from '../constants/auth.constants';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findByUsername: jest.fn(),
    create: jest.fn(),
  };

  const mockHasher = {
    hash: jest.fn(),
    verify: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: PASSWORD_HASHER,
          useValue: mockHasher,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return null when user does not exist', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(null);

      const result = await service.validateUser('user', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      mockUserRepository.findByUsername.mockResolvedValue({
        id: 1,
        username: 'user',
        passwordHash: 'hashed-password',
      });

      mockHasher.verify.mockResolvedValue(false);

      const result = await service.validateUser('user', 'wrong-password');

      expect(result).toBeNull();
    });

    it('should return authenticated user when credentials are valid', async () => {
      mockUserRepository.findByUsername.mockResolvedValue({
        id: 1,
        username: 'user',
        passwordHash: 'hashed-password',
      });

      mockHasher.verify.mockResolvedValue(true);

      const result = await service.validateUser('user', 'password123');

      expect(result).toEqual({
        id: 1,
        username: 'user',
      });
    });
  });

  describe('login', () => {
    it('should return access token', async () => {
      mockJwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.login({
        id: 1,
        username: 'user',
      });

      expect(result).toEqual({
        accessToken: 'jwt-token',
      });
    });
  });

  describe('register', () => {
    it('should throw ConflictException when username already exists', async () => {
      mockUserRepository.findByUsername.mockResolvedValue({
        id: 1,
        username: 'user',
      });

      await expect(
        service.register({
          username: 'user',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should register a new user successfully', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(null);

      mockHasher.hash.mockResolvedValue('hashed-password');

      mockUserRepository.create.mockResolvedValue({
        id: 1,
        username: 'user',
        passwordHash: 'hashed-password',
      });

      const result = await service.register({
        username: 'user',
        password: 'password123',
      });

      expect(result).toEqual({
        id: 1,
        username: 'user',
      });
    });
  });
});
