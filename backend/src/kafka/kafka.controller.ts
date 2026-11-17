import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class KafkaController {
  
  // Jab bhi 'product-created' topic par message aaye, yeh function chalega
  @EventPattern('product-created')
  async handleProductCreated(@Payload() message: any) {
    console.log('📦 Naya Product Kafka se aaya:', message);
    // Yahan aap background mein kuch bhi kar sakte hain (jaise email bhejna)
  }
}