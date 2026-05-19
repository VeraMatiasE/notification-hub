import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { username: string; passwordHash: string }) {
    return this.prisma.user.create({
      data,
    });
  }

  async findByUsername(where: { username: string }) {
    return this.prisma.user.findUnique({
      where,
      omit: {
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
