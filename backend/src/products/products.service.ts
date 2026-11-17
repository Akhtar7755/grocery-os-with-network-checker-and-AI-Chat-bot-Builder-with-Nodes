import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../schemas/product.schema.js';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<Product>) {}

  async create(name: string, price: number, image: string) {
    const newProduct = new this.productModel({ name, price, image });
    return newProduct.save();
  }

  // UPDATE: Yahan humne pagination add ki hai
  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit; // Kitne products skip karne hain
    
    const products = await this.productModel
      .find()
      .sort({ _id: -1 }) // Naye products pehle
      .skip(skip)
      .limit(limit);

    const total = await this.productModel.countDocuments(); // Total kitne products hain

    return {
      data: products,
      total,
      page,
      totalPages: Math.ceil(total / limit), // Total kitne pages banenge
    };
  }

  async delete(id: string) {
    return this.productModel.findByIdAndDelete(id);
  }

  async update(id: string, name: string, price: number) {
    return this.productModel.findByIdAndUpdate(
      id,
      { name, price },
      { new: true }
    );
  }
}