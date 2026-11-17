import {
  HttpException, Injectable, NotFoundException, BadRequestException, UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { timingSafeEqual } from 'crypto';
import { Chatbot, ChatMemory } from './chatbot.schema';
import { validateFlow } from './flow.validator';
import { runFlow } from './flow.engine';

type MemoryStore = {
  load: (key: string, limit: number) => Promise<{ role: 'user' | 'assistant'; content: string }[]>;
  save: (key: string, msgs: { role: 'user' | 'assistant'; content: string }[]) => Promise<void>;
};

// Secrets are never sent to the browser. The editor receives this mask instead,
// and the server puts the real value back when the flow is saved or tested.
const MASK = '********';
const SECRET_FIELDS = ['apiKey', 'secret'];

@Injectable()
export class ChatbotService {
  constructor(
    @InjectModel(Chatbot.name) private botModel: Model<Chatbot>,
    @InjectModel(ChatMemory.name) private memModel: Model<ChatMemory>,
  ) {}

  private store: MemoryStore = {
    load: async (key: string, limit: number) => {
      const doc = await this.memModel.findOne({ key }).lean();
      return (doc?.messages ?? []).slice(-limit) as any;
    },
    save: async (key: string, msgs: { role: string; content: string }[]) => {
      await this.memModel.updateOne(
        { key },
        { $push: { messages: { $each: msgs, $slice: -100 } }, $set: { updatedAt: new Date() } },
        { upsert: true },
      );
    },
  };

  // ---------- helpers ----------
  private async findBot(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('Bot not found');
    const bot = await this.botModel.findById(id).lean();
    if (!bot) throw new NotFoundException('Bot not found');
    return bot;
  }

  // Replaces masked secrets in an edited flow with the values stored in the database.
  private async restoreSecrets(flow: any, botId?: string) {
    if (!flow?.nodes) return flow;
    let oldNodes = new Map<string, any>();
    if (botId && isValidObjectId(botId)) {
      const old = await this.botModel.findById(botId).lean();
      oldNodes = new Map((old?.flow?.nodes ?? []).map((n: any) => [n.id, n]));
    }
    const nodes = flow.nodes.map((n: any) => {
      if (!n?.data) return n;
      const prev = oldNodes.get(n.id)?.data ?? {};
      const data = { ...n.data };
      for (const k of SECRET_FIELDS) {
        if (data[k] === MASK) data[k] = prev[k] ?? '';
      }
      return { ...n, data };
    });
    return { ...flow, nodes };
  }

  private maskFlow(flow: any) {
    const nodes = (flow?.nodes ?? []).map((n: any) => {
      if (!n?.data) return n;
      const data = { ...n.data };
      for (const k of SECRET_FIELDS) if (data[k]) data[k] = MASK;
      return { ...n, data };
    });
    return { ...flow, nodes };
  }

  // ---------- Generate (validate only) ----------
  async validate(flowIn: any, botId?: string) {
    const flow = await this.restoreSecrets(flowIn, botId);
    const errors = validateFlow(flow);
    return errors.length ? { ok: false, errors } : { ok: true };
  }

  // ---------- Test chat on an unsaved flow ----------
  async testFlow(flowIn: any, message: string, sessionId: string, botId?: string) {
    const text = String(message ?? '').trim();
    if (!text) throw new BadRequestException('message is required');

    const flow = await this.restoreSecrets(flowIn, botId);
    const errors = validateFlow(flow);
    if (errors.length) return { ok: false, errors };

    try {
      const reply = await runFlow(flow, 'start', { message: text, sessionId, botId: `test-${botId ?? 'new'}` }, this.store);
      return { ok: true, reply };
    } catch (e: any) {
      throw new HttpException(e?.message ?? 'Test failed', 502);
    }
  }

  // ---------- Save (create or update) ----------
  async generate(flowIn: any, botId?: string, name?: string) {
    const flow = await this.restoreSecrets(flowIn, botId);
    const errors = validateFlow(flow);
    if (errors.length) return { ok: false, errors };

    const cleanName = String(name ?? '').trim().slice(0, 80);

    if (botId) {
      if (!isValidObjectId(botId)) throw new NotFoundException('Bot not found');
      const bot = await this.botModel.findByIdAndUpdate(
        botId,
        { flow, ...(cleanName ? { name: cleanName } : {}) },
        { new: true },
      );
      if (!bot) throw new NotFoundException('Bot not found');
      return { ok: true, botId: bot.id, name: bot.name };
    }
    const bot = await this.botModel.create({ name: cleanName || 'My Bot', flow });
    return { ok: true, botId: bot.id, name: bot.name };
  }

  // ---------- Load one flow for editing (secrets masked) ----------
  async getFlow(id: string) {
    const bot = await this.findBot(id);
    return { ...bot, flow: this.maskFlow(bot.flow) };
  }

  // ---------- List page: name + date only ----------
  async getAllBots() {
    return this.botModel.find().select('name createdAt').sort({ createdAt: -1 }).lean();
  }

  async deleteBot(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('Bot not found');
    const result = await this.botModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Bot not found');
    // also remove this bot's saved conversations
    await this.memModel.deleteMany({ key: { $regex: `^${id}:` } });
    return { success: true, message: 'Bot deleted' };
  }

  // ---------- LLM node "Load all models" ----------
  async listModels(provider: string, apiKeyIn: string, botId?: string, nodeId?: string): Promise<string[]> {
    let apiKey = apiKeyIn;
    if (apiKey === MASK && botId && nodeId && isValidObjectId(botId)) {
      const bot = await this.botModel.findById(botId).lean();
      apiKey = bot?.flow?.nodes?.find((n: any) => n.id === nodeId)?.data?.apiKey ?? '';
    }
    if (!apiKey || apiKey === MASK) throw new BadRequestException('API key is required');

    try {
      if (provider === 'gemini') {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', {
          headers: { 'x-goog-api-key': apiKey },
          signal: AbortSignal.timeout(15000),
        });
        const json: any = await res.json();
        if (!res.ok) throw new Error(json?.error?.message ?? `Error ${res.status}`);
        return (json.models ?? [])
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => String(m.name).replace('models/', ''))
          .sort();
      }

      const base =
        provider === 'openai' ? 'https://api.openai.com/v1' :
        provider === 'mistral' ? 'https://api.mistral.ai/v1' : null;
      if (!base) throw new BadRequestException('Unknown provider');

      const res = await fetch(`${base}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(15000),
      });
      const json: any = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? json?.message ?? `Error ${res.status}`);
      return (json.data ?? []).map((m: any) => m.id).sort();
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
      throw new HttpException(e?.message ?? 'Could not load models', 502);
    }
  }

  // ---------- Chat on a saved bot ----------
  async chat(id: string, body: { message?: string; sessionId?: string }, entry: 'start' | 'webhook') {
    const message = String(body?.message ?? '').trim();
    if (!message) throw new BadRequestException('message is required');

    const bot = await this.findBot(id);
    const sessionId = body.sessionId || 'default';
    try {
      const reply = await runFlow(bot.flow, entry, { message, sessionId, botId: id }, this.store);
      return { reply, botId: id, sessionId };
    } catch (e: any) {
      throw new HttpException(e?.message ?? 'The flow failed to run', 502);
    }
  }

  // ---------- External webhook ----------
  async webhook(id: string, body: any, secretHeader?: string) {
    const bot = await this.findBot(id);
    const node = (bot.flow?.nodes ?? []).find((n: any) => n.data?.type === 'webhook');
    if (!node) throw new BadRequestException('This bot has no Webhook node');

    const secret: string = node.data.secret ?? '';
    if (secret) {
      const a = Buffer.from(secret);
      const b = Buffer.from(String(secretHeader ?? ''));
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        throw new UnauthorizedException('Invalid webhook secret');
      }
    }

    // read the message from the configured field (supports "data.text")
    const field: string = node.data.messageField || 'message';
    const value = field.split('.').reduce((o: any, k: string) => (o == null ? o : o[k]), body);
    const message = value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value);

    return this.chat(id, { message, sessionId: body?.sessionId }, 'webhook');
  }
}