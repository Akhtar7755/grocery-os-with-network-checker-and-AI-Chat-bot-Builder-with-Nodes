import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema.js';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userPayload = request.user; // from JwtAuthGuard
    
    // Look up the user in the database
    const user = await this.userModel.findById(userPayload.sub);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated.');
    }
    
    return true;
  }
}