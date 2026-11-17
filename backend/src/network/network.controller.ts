import { Controller, Get, Param, UseGuards,Post, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express'; 
import { NetworkService } from './network.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('network')
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  // API 1: Check Network by 4-digit prefix
  @Get('check/:number')
  async check(@Param('number') number: string) {
    return this.networkService.checkNetwork(number);
  }

  // API 2: Get Total Uploaded Numbers (Dashboard ke liye)
  @UseGuards(JwtAuthGuard)
  @Get('total-count')
  async getTotalCount() {
    return this.networkService.getTotalNumbersCount();
  }

    @UseGuards(JwtAuthGuard)
  @Post('upload-excel')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(@UploadedFile() file: any, @Body('listName') listName: string) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.networkService.uploadExcel(file.buffer, listName);
  }
}