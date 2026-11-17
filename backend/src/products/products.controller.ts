import { Controller, Get, Post, Body, Delete, Param, UseGuards, Patch, Query, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices'; // <-- IMPORT
import { ProductsService } from './products.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { ActiveUserGuard } from '../auth/active-user.guard.js';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka, // <-- KAFKA INJECT
  ) {}

  @UseGuards(JwtAuthGuard, ActiveUserGuard)
  @Post()
  async create(@Body() body: { name: string; price: number; image: string }) {
    // 1. Database mein save karein
    const newProduct = await this.productsService.create(body.name, body.price, body.image);
    
    // 2. Kafka ko message bhejein
    this.kafkaClient.emit('product-created', {
      id: newProduct._id,
      name: newProduct.name,
      price: newProduct.price,
    });
    console.log('📤 Kafka ko message bheja gaya: product-created');

    return newProduct;
  }

  // Baqi routes waise hi rahenge...
  @Get()
  async findAll(@Query('page') page: string, @Query('limit') limit: string) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return this.productsService.findAll(pageNum, limitNum);
  }

  @UseGuards(JwtAuthGuard, ActiveUserGuard, AdminGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }

  @UseGuards(JwtAuthGuard, ActiveUserGuard, AdminGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { name: string; price: number }) {
    return this.productsService.update(id, body.name, body.price);
  }
}