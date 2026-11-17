import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { User, UserSchema } from './schemas/user.schema.js';
import { Product, ProductSchema } from './schemas/product.schema.js';
import { AuthModule } from './auth/auth.module.js';
import { ProductsController } from './products/products.controller.js';
import { ProductsService } from './products/products.service.js';
import { KafkaController } from './kafka/kafka.controller.js';
import { ChatbotModule } from './chatbot/chatbot.module.js';

// YAHAN IMPORT KAREIN
import { NetworkModule } from './network/network.module.js'; 

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://host.docker.internal:27017/auth-project'),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema }
    ]),
    AuthModule,
    NetworkModule, // <-- YAHAN ADD KAREIN
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
          },
          consumer: {
            groupId: 'grocery-consumer',
          },
        },
      },
    ]),

     ChatbotModule,
  ],
  controllers: [AppController, ProductsController, KafkaController], 
  providers: [AppService, ProductsService],
})
export class AppModule {}