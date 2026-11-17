import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NetworkController } from './network.controller';
import { NetworkService } from './network.service.js';
import { NetworkPrefix, NetworkPrefixSchema } from '../schemas/network-prefix.schema.js';
import { SmsList, SmsListSchema } from '../schemas/sms-list.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NetworkPrefix.name, schema: NetworkPrefixSchema },
      { name: SmsList.name, schema: SmsListSchema },
    ]),
  ],
  controllers: [NetworkController],
  providers: [NetworkService],
})
export class NetworkModule {}