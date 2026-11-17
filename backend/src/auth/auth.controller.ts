import { Controller, Post, Body, UseGuards, Get, Patch, Param } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { AdminGuard } from './admin.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body.email, body.password, body.permissions);
  }

  // NEW: Get all users
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('users')
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  // NEW: Toggle user active/inactive status
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('users/:id/toggle-status')
  async toggleUserStatus(@Param('id') id: string) {
    return this.authService.toggleUserStatus(id);
  }
    @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('users/:id/permissions')
  async updatePermissions(@Param('id') id: string, @Body() body: { permissions: string[] }) {
    return this.authService.updatePermissions(id, body.permissions);
  }
}