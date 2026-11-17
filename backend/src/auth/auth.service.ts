import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User } from '../schemas/user.schema.js';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

    async updatePermissions(id: string, permissions: string[]) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { permissions },
      { new: true } // Return the updated user
    ).select('-password');
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

    async getAllUsers() {
    // Return all users EXCEPT the password field
    return this.userModel.find().select('-password').sort({ createdAt: -1 });
  }

  async toggleUserStatus(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    user.isActive = !user.isActive; // Flip the boolean
    await user.save();
    return { message: `User is now ${user.isActive ? 'Active' : 'Inactive'}`, isActive: user.isActive };
  }

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService
  ) {}

  async login(email: string, pass: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
      console.log("your user",user)
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    
    if (user.isActive === false) {
      throw new UnauthorizedException('Your account has been deactivated by the admin.');
    }

    const payload = { 
      sub: user._id, 
      email: user.email, 
      isAdmin: user.isAdmin, 
      permissions: user.permissions 
    };

    return {
      message: 'Login successful',
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        permissions: user.permissions,
      },
    };
  }

  // THIS IS THE NEW FUNCTION!
  async register(email: string, pass: string, permissions: string[]) {
    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new UnauthorizedException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(pass, 10);
    const newUser = await this.userModel.create({
      email,
      password: hashedPassword,
      isAdmin: false,
      permissions: permissions || [],
    });
    return {
      message: 'User created successfully',
      user: { id: newUser._id, email: newUser.email, permissions: newUser.permissions },
    };
  }
}