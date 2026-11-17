import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NetworkPrefix } from '../schemas/network-prefix.schema';
import { SmsList } from '../schemas/sms-list.schema';
import * as XLSX from 'xlsx';
import { redisClient } from '../redis.provider.js';

@Injectable()
export class NetworkService {
  // 1. IN-MEMORY CACHE
  private cache = new Map<string, string>();

  constructor(
    @InjectModel(NetworkPrefix.name) private prefixModel: Model<NetworkPrefix>,
    @InjectModel(SmsList.name) private smsListModel: Model<SmsList>,
  ) {}

  // 2. CHECK NETWORK (Updated with Cache)
  async checkNetwork(phoneNumber: string) {
    if (phoneNumber.length !== 4) {
      throw new BadRequestException('Prefix must be exactly 4 digits');
    }

    const prefix = phoneNumber;

    // A. Pehle Memory Cache check karein
    const cachedNetwork = this.cache.get(prefix);
    if (cachedNetwork) {
      return { number: phoneNumber, network: cachedNetwork, source: 'Memory' };
    }

    // B. Agar cache mein nahi hai, toh MongoDB se dhoondein
    const foundNetwork = await this.prefixModel.findOne({ prefix }).lean();

    if (!foundNetwork) {
      return { number: phoneNumber, network: 'Unknown' };
    }

    // C. Database se mile toh Memory Cache mein save karein
    this.cache.set(prefix, foundNetwork.networkName);

    return { number: phoneNumber, network: foundNetwork.networkName, source: 'MongoDB' };
  }

  // 3. TOTAL NUMBERS COUNT (Redis + MongoDB)
  async getTotalNumbersCount() {
    const cachedCount = await redisClient.get('total_sms_numbers');
    if (cachedCount) {
      return { totalNumbers: parseInt(cachedCount), source: 'Redis (Fast)' };
    }

    const result = await this.smsListModel.aggregate([
      {
        $group: {
          _id: null,
          totalNumbers: { $sum: '$totalCount' },
        },
      },
    ]);

    const total = result.length > 0 ? result[0].totalNumbers : 0;
    await redisClient.set('total_sms_numbers', String(total));
    
    return { totalNumbers: total, source: 'MongoDB' };
  }

  // 4. EXCEL UPLOAD
  async uploadExcel(fileBuffer: Buffer, listName: string) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      throw new BadRequestException('Excel file is empty');
    }

    const firstRow = data[0] as any;
    const keys = Object.keys(firstRow);

    const numberKey = keys.find(
      (key) =>
        key.toLowerCase().includes('number') ||
        key.toLowerCase().includes('phone') ||
        key.toLowerCase().includes('mobile'),
    );

    if (!numberKey) {
      throw new BadRequestException(
        `Number wala column nahi mila. Aapke columns: ${keys.join(', ')}`,
      );
    }

    const numbers = data
      .map((row: any) => {
        const val = row[numberKey];
        return val ? String(val).trim() : '';
      })
      .filter((n) => n.length > 0);

    if (numbers.length === 0) {
      throw new BadRequestException(`Column "${numberKey}" mein koi number nahi mila.`);
    }

    const allPrefixes = await this.prefixModel.find();
    const prefixMap: Record<string, string> = {};
    allPrefixes.forEach((p) => {
      prefixMap[p.prefix] = p.networkName;
    });

    const groupedNumbers: Record<string, string[]> = {};
    for (const num of numbers) {
      const prefix = num.substring(0, 4);
      const network = prefixMap[prefix] || 'Unknown';

      if (!groupedNumbers[network]) {
        groupedNumbers[network] = [];
      }
      groupedNumbers[network].push(num);
    }

    const networkStats: Record<string, number> = {};
    let totalSaved = 0;
    const batchSize = 10000;

    for (const [networkName, networkNumbers] of Object.entries(groupedNumbers)) {
      networkStats[networkName] = networkNumbers.length;

      for (let i = 0; i < networkNumbers.length; i += batchSize) {
        const batch = networkNumbers.slice(i, i + batchSize);
        await this.smsListModel.create({
          listName: listName || `Batch ${Date.now()}`,
          numbers: batch,
          totalCount: batch.length,
          network: networkName,
        });
      }
      totalSaved += networkNumbers.length;
    }

    // Cache clear karein taake naye prefixes load hon
    this.cache.clear();

    // Redis count update
    const currentTotalStr = await redisClient.get('total_sms_numbers');
    const currentTotal = currentTotalStr ? parseInt(currentTotalStr) : 0;
    const newTotal = currentTotal + totalSaved;
    await redisClient.set('total_sms_numbers', String(newTotal));

    return {
      message: 'Excel uploaded successfully',
      totalProcessed: totalSaved,
      networkStats,
    };
  }
}