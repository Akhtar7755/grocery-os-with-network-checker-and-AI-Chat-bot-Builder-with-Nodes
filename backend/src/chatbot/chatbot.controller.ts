import { Controller, Post, Body, Param, Get, Delete, Headers } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private chatbotService: ChatbotService) {}

  // 1. GENERATE button: checks the flow and returns { ok:false, errors } or { ok:true }
  @Post('validate')
  validate(@Body() body: { flow: any; botId?: string }) {
    return this.chatbotService.validate(body.flow, body.botId);
  }

  // 2. TEST CHAT (widget before saving): runs the unsaved flow
  @Post('test')
  testFlow(@Body() body: { flow: any; botId?: string; message: string; sessionId?: string }) {
    return this.chatbotService.testFlow(body.flow, body.message, body.sessionId || 'test-session', body.botId);
  }

  // 3. SAVE button: creates a new bot, or updates it when botId is given
  @Post('save')
  save(@Body() body: { flow: any; botId?: string; name?: string }) {
    return this.chatbotService.generate(body.flow, body.botId, body.name);
  }

  // 4. LIST page (name + date only, no flows / keys)
  @Get()
  getAllBots() {
    return this.chatbotService.getAllBots();
  }

  // 5. LLM node "Load all models" button
  @Post('models')
  async models(@Body() body: { provider: string; apiKey: string; botId?: string; nodeId?: string }) {
    return { models: await this.chatbotService.listModels(body.provider, body.apiKey, body.botId, body.nodeId) };
  }

  // 6. EDIT: load a saved flow into the builder
  @Get(':id')
  getFlow(@Param('id') id: string) {
    return this.chatbotService.getFlow(id);
  }

  // 7. Chat widget on a saved bot (runs from the Start node)
  @Post(':id/chat')
  chat(@Param('id') id: string, @Body() body: { message: string; sessionId?: string }) {
    return this.chatbotService.chat(id, body, 'start');
  }

  // 8. External webhook (runs from the Webhook node, optional secret header)
  @Post(':id/webhook')
  webhook(@Param('id') id: string, @Body() body: any, @Headers('x-webhook-secret') secret?: string) {
    return this.chatbotService.webhook(id, body, secret);
  }

  // 9. DELETE from the list page
  @Delete(':id')
  deleteBot(@Param('id') id: string) {
    return this.chatbotService.deleteBot(id);
  }
}