import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Allow if Admin OR if they have the 'add-product' permission
    if (!user || (!user.isAdmin && !user.permissions?.includes('add-product'))) {
      throw new ForbiddenException('You do not have permission to manage products');
    }
    return true;
  }
}