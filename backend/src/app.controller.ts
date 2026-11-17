import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // NAYA ROUTE: Sirf performance check ke liye
  @Get('ping')
  ping() {
    return 'ok';
  }
}
