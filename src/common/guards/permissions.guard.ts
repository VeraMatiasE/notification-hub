import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from 'src/database/prisma.service';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException();
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            permissions: {
              select: {
                permission: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const userPermissions = new Set(
      user.role.permissions.map((rp) => rp.permission.name),
    );

    const hasAll = requiredPermissions.every((p) => userPermissions.has(p));

    if (!hasAll) {
      const missing = requiredPermissions.filter(
        (p) => !userPermissions.has(p),
      );
      throw new ForbiddenException(
        `Missing permissions: ${missing.join(', ')}`,
      );
    }

    return true;
  }
}
