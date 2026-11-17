import { isSafeUrl } from './flow.validator';

export type Msg = { role: 'user' | 'assistant'; content: string };
export interface MemoryStore {
  load(key: string, limit: number): Promise<Msg[]>;
  save(key: string, msgs: Msg[]): Promise<void>;
}
type Ctx = { message: string; sessionId: string; botId: string };

const render = (tpl: string, input: string, message: string) =>
  String(tpl ?? '')
    .replace(/\{\{\s*input\s*\}\}/g, input)
    .replace(/\{\{\s*message\s*\}\}/g, message);

function checkCondition(d: any, input: string, message: string): boolean {
  const L = render(d.left || '{{input}}', input, message).toLowerCase().trim();
  const R = render(d.value ?? '', input, message).toLowerCase().trim();
  switch (d.operator) {
    case 'contains': return L.includes(R);
    case 'not_contains': return !L.includes(R);
    case 'equals': return L === R;
    case 'not_equals': return L !== R;
    case 'starts_with': return L.startsWith(R);
    case 'ends_with': return L.endsWith(R);
    case 'regex':
      try { return new RegExp(d.value, 'i').test(L); } catch { return false; }
    case 'is_empty': return L === '';
    case 'not_empty': return L !== '';
    default: return false;
  }
}

// ---------- Tools ----------
async function runTool(tool: any, args: any): Promise<string> {
  if (!tool) return 'Error: unknown tool.';
  const { url, method = 'GET' } = tool.data;
  const input = String(args?.input ?? '');
  try {
    if (!isSafeUrl(url)) return 'Error: tool URL is not allowed.';
    let target = url;
    const init: any = { method, signal: AbortSignal.timeout(10000) };
    if (/\{\{\s*input\s*\}\}/.test(url)) {
      target = url.replace(/\{\{\s*input\s*\}\}/g, encodeURIComponent(input));
    } else if (method === 'GET') {
      target += (url.includes('?') ? '&' : '?') + 'input=' + encodeURIComponent(input);
    }
    if (method !== 'GET') {
      init.headers = { 'Content-Type': 'application/json' };
      init.body = JSON.stringify({ input });
    }
    const res = await fetch(target, init);
    return (await res.text()).slice(0, 4000);
  } catch (e: any) {
    return `Tool error: ${e?.message ?? 'request failed'}`;
  }
}

// ---------- Retry helper ----------
// Retries when the provider is overloaded (429 / 500 / 503) with a short delay.
async function fetchWithRetry(url: string, init: any, tries = 3): Promise<Response> {
  let res: Response;
  for (let i = 0; i < tries; i++) {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(60000) });
    if (![429, 500, 503].includes(res.status)) return res;
    await new Promise((r) => setTimeout(r, 1000 * 2 ** i)); // wait 1s, 2s, 4s
  }
  return res!;
}

// ---------- LLM providers ----------
// OpenAI and Mistral share the same chat-completions format.
async function chatOpenAICompat(baseUrl: string, llm: any, system: string, history: Msg[], input: string, tools: any[]) {
  const messages: any[] = [{ role: 'system', content: system }, ...history, { role: 'user', content: input }];
  const defs = tools.map((t) => ({
    type: 'function',
    function: {
      name: t.data.name,
      description: t.data.description,
      parameters: { type: 'object', properties: { input: { type: 'string', description: 'Input for the tool' } }, required: ['input'] },
    },
  }));
  for (let i = 0; i < 5; i++) {
    const res = await fetchWithRetry(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${llm.apiKey}` },
      body: JSON.stringify({ model: llm.model, temperature: Number(llm.temperature ?? 0.7), messages, ...(defs.length ? { tools: defs } : {}) }),
    });
    const json: any = await res.json();
    if (!res.ok) throw new Error(json?.error?.message ?? json?.message ?? `LLM error ${res.status}`);
    const msg = json.choices?.[0]?.message;
    if (!msg?.tool_calls?.length) return typeof msg?.content === 'string' ? msg.content : JSON.stringify(msg?.content ?? '');
    messages.push(msg);
    for (const call of msg.tool_calls) {
      let args = {};
      try { args = JSON.parse(call.function.arguments || '{}'); } catch {}
      const result = await runTool(tools.find((t) => t.data.name === call.function.name), args);
      messages.push({ role: 'tool', tool_call_id: call.id, content: result });
    }
  }
  return 'Sorry, I could not finish because too many tool calls were needed.';
}

async function chatGemini(llm: any, system: string, history: Msg[], input: string, tools: any[]) {
  const contents: any[] = [
    ...history.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    { role: 'user', parts: [{ text: input }] },
  ];
  const body: any = {
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: { temperature: Number(llm.temperature ?? 0.7) },
  };
  if (tools.length) {
    body.tools = [{
      functionDeclarations: tools.map((t) => ({
        name: t.data.name,
        description: t.data.description,
        parameters: { type: 'OBJECT', properties: { input: { type: 'STRING' } }, required: ['input'] },
      })),
    }];
  }
  for (let i = 0; i < 5; i++) {
    const res = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(llm.model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': llm.apiKey },
      body: JSON.stringify(body),
    });
    const json: any = await res.json();
    if (!res.ok) throw new Error(json?.error?.message ?? `LLM error ${res.status}`);
    const content = json.candidates?.[0]?.content;
    const parts: any[] = content?.parts ?? [];
    const calls = parts.filter((p) => p.functionCall);
    if (!calls.length) return parts.map((p) => p.text ?? '').join('');
    contents.push(content);
    contents.push({
      role: 'user',
      parts: await Promise.all(
        calls.map(async (p) => ({
          functionResponse: {
            name: p.functionCall.name,
            response: { result: await runTool(tools.find((t) => t.data.name === p.functionCall.name), p.functionCall.args) },
          },
        })),
      ),
    });
  }
  return 'Sorry, I could not finish because too many tool calls were needed.';
}

// ---------- Agent ----------
async function runAgent(flow: any, agent: any, input: string, ctx: Ctx, store: MemoryStore): Promise<string> {
  const attached = (handle: string) =>
    flow.edges
      .filter((e: any) => e.target === agent.id && e.targetHandle === handle)
      .map((e: any) => flow.nodes.find((n: any) => n.id === e.source))
      .filter(Boolean);

  const llm = attached('llm-in')[0]?.data;
  if (!llm) throw new Error('Agent has no LLM attached.');
  const tools = attached('tools-in');
  const memNode = attached('memory-in')[0];

  const memKey = memNode ? `${ctx.botId}:${ctx.sessionId}:${memNode.id}` : null;
  const history = memKey ? await store.load(memKey, Number(memNode.data.windowSize) * 2) : [];

  const system =
    [agent.data.systemPrompt, llm.instruction].filter((s) => s && String(s).trim()).join('\n\n') ||
    'You are a helpful assistant.';

  let reply: string;
  if (llm.provider === 'openai') reply = await chatOpenAICompat('https://api.openai.com/v1', llm, system, history, input, tools);
  else if (llm.provider === 'mistral') reply = await chatOpenAICompat('https://api.mistral.ai/v1', llm, system, history, input, tools);
  else if (llm.provider === 'gemini') reply = await chatGemini(llm, system, history, input, tools);
  else throw new Error(`Unsupported provider "${llm.provider}".`);

  if (memKey) await store.save(memKey, [{ role: 'user', content: input }, { role: 'assistant', content: reply }]);
  return reply;
}

// ---------- Flow runner ----------
export async function runFlow(flow: any, entry: 'start' | 'webhook', ctx: Ctx, store: MemoryStore): Promise<string> {
  const nodes: any[] = flow.nodes;
  const edges: any[] = flow.edges;
  const first =
    nodes.find((n) => n.data.type === entry) ??
    nodes.find((n) => ['start', 'webhook'].includes(n.data.type));
  if (!first) throw new Error('Flow has no Start or Webhook node.');

  const nextOf = (id: string, handle?: string) =>
    edges.find((e) => e.source === id && (!handle || e.sourceHandle === handle))?.target as string | undefined;

  let current: string | undefined = first.id;
  let input = ctx.message;

  for (let steps = 0; current && steps < 50; steps++) {
    const node = nodes.find((n) => n.id === current);
    if (!node) break;
    const d = node.data;

    if (d.type === 'agent') {
      input = await runAgent(flow, node, input, ctx, store);
      current = nextOf(node.id);
    } else if (d.type === 'if_else') {
      current = nextOf(node.id, checkCondition(d, input, ctx.message) ? 'true' : 'false');
    } else if (d.type === 'end') {
      return render(d.reply || '{{input}}', input, ctx.message);
    } else {
      current = nextOf(node.id); // start / webhook
    }
  }
  return input;
}