export type FlowError = { nodeId: string; message: string }; // nodeId '' = whole flow

const MAIN = ['start', 'webhook', 'agent', 'if_else', 'end'];
const SUB_HANDLE: Record<string, string> = {
  llm: 'llm-in',
  tools: 'tools-in',
  memory: 'memory-in',
};
const PROVIDERS = ['openai', 'mistral', 'gemini'];

// Blocks non-http URLs and private/local addresses so tools can't hit your internal network.
export function isSafeUrl(raw: string): boolean {
  try {
    const u = new URL(String(raw).replace(/\{\{\s*input\s*\}\}/g, 'x'));
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    if (process.env.ALLOW_PRIVATE_TOOLS === 'true') return true;
    const h = u.hostname;
    return !(
      h === 'localhost' ||
      h === '[::1]' ||
      h.endsWith('.local') ||
      /^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)
    );
  } catch {
    return false;
  }
}

export function validateFlow(flow: any): FlowError[] {
  const errors: FlowError[] = [];
  const add = (nodeId: string, message: string) => errors.push({ nodeId, message });
  const nodes: any[] = flow?.nodes ?? [];
  const edges: any[] = flow?.edges ?? [];

  if (!nodes.length) {
    add('', 'The flow is empty. Drag a Start node onto the canvas.');
    return errors;
  }

  const type = (id: string) => nodes.find((n) => n.id === id)?.data?.type;
  const nonEmpty = (v: any) => typeof v === 'string' && v.trim().length > 0;

  const starts = nodes.filter((n) => ['start', 'webhook'].includes(n.data?.type));
  if (!starts.length) add('', 'Add a Start or Webhook node.');
  if (!nodes.some((n) => n.data?.type === 'end')) add('', 'Add an End node.');

  // Edges that make up the conversation path (everything except sub-node attachments)
  const mainEdges = edges.filter(
    (e) => MAIN.includes(type(e.source)) && (!e.targetHandle || e.targetHandle === 'in'),
  );

  // Edge sanity: sub-nodes may only plug into the matching agent handle
  for (const e of edges) {
    const src = type(e.source);
    const tgt = type(e.target);
    const handleOwner = Object.entries(SUB_HANDLE).find(([, h]) => h === e.targetHandle)?.[0];
    if (handleOwner && src !== handleOwner) {
      add(e.target, `The ${e.targetHandle} socket only accepts a ${handleOwner.toUpperCase()} node.`);
    } else if (!handleOwner && SUB_HANDLE[src]) {
      add(e.source, `${src.toUpperCase()} nodes can only be attached to an Agent.`);
    } else if (handleOwner && tgt !== 'agent') {
      add(e.target, 'Only an Agent can use LLM, Tools and Memory nodes.');
    }
  }

  // Reachability from the start node(s)
  const reached = new Set<string>(starts.map((s) => s.id));
  const queue = [...reached];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const e of mainEdges) {
      if (e.source === cur && !reached.has(e.target)) {
        reached.add(e.target);
        queue.push(e.target);
      }
    }
  }

  // Loop detection (a chat reply must finish)
  const state = new Map<string, number>();
  let cycleAt: string | null = null;
  const dfs = (id: string) => {
    state.set(id, 1);
    for (const e of mainEdges.filter((x) => x.source === id)) {
      const s = state.get(e.target);
      if (s === 1) cycleAt = e.target;
      else if (!s) dfs(e.target);
    }
    state.set(id, 2);
  };
  starts.forEach((s) => !state.get(s.id) && dfs(s.id));
  if (cycleAt) add(cycleAt, 'This node is part of a loop. Flows must run from start to end.');

  const startCount = nodes.filter((n) => n.data?.type === 'start').length;

  for (const n of nodes) {
    const d = n.data ?? {};
    const t = d.type;
    const out = (handle?: string) =>
      mainEdges.some((e) => e.source === n.id && (!handle || e.sourceHandle === handle));
    const attachedTo = (h: string) =>
      edges.filter((e) => e.target === n.id && e.targetHandle === h && type(e.source) === h.replace('-in', ''));

    if (!['start', 'webhook', 'agent', 'llm', 'tools', 'memory', 'if_else', 'end'].includes(t)) {
      add(n.id, `Unknown node type "${t}".`);
      continue;
    }

    if (MAIN.includes(t) && !['start', 'webhook'].includes(t) && !reached.has(n.id)) {
      add(n.id, 'Not connected to the Start node.');
    }
    if (t !== 'end' && MAIN.includes(t) && t !== 'if_else' && !out()) {
      add(n.id, 'Connect this node to the next node.');
    }

    switch (t) {
      case 'start':
        if (startCount > 1) add(n.id, 'Only one Start node is allowed.');
        break;

      case 'webhook':
        if (d.messageField && !/^[A-Za-z_][\w.]*$/.test(d.messageField))
          add(n.id, 'Message field must be a plain key like "message" (or "data.text").');
        if (nodes.filter((x) => x.data?.type === 'webhook').length > 1)
          add(n.id, 'Only one Webhook node is allowed.');
        break;

      case 'agent': {
        const llms = attachedTo('llm-in');
        if (!llms.length) add(n.id, 'Attach an LLM node to the LLM socket.');
        if (llms.length > 1) add(n.id, 'Only one LLM can be attached.');
        if (attachedTo('memory-in').length > 1) add(n.id, 'Only one Memory can be attached.');
        break;
      }

      case 'llm':
        if (!PROVIDERS.includes(d.provider)) add(n.id, 'Choose a provider.');
        if (!nonEmpty(d.model)) add(n.id, 'Model name is missing.');
        if (!nonEmpty(d.apiKey)) add(n.id, 'API key is missing.');
        if (!edges.some((e) => e.source === n.id && e.targetHandle === 'llm-in'))
          add(n.id, 'Plug this node into an Agent\'s LLM socket.');
        break;

      case 'tools':
        if (!/^[a-zA-Z0-9_]{1,40}$/.test(d.name ?? ''))
          add(n.id, 'Tool name is required: letters, numbers and underscores only.');
        if (!nonEmpty(d.description))
          add(n.id, 'Write a description so the agent knows when to use this tool.');
        if (!nonEmpty(d.url)) add(n.id, 'URL is missing.');
        else if (!isSafeUrl(d.url)) add(n.id, 'URL must be a public http(s) address.');
        if (!edges.some((e) => e.source === n.id && e.targetHandle === 'tools-in'))
          add(n.id, 'Plug this node into an Agent\'s Tools socket.');
        break;

      case 'memory': {
        const w = Number(d.windowSize);
        if (!Number.isInteger(w) || w < 1 || w > 50) add(n.id, 'Window size must be a whole number from 1 to 50.');
        if (!edges.some((e) => e.source === n.id && e.targetHandle === 'memory-in'))
          add(n.id, 'Plug this node into an Agent\'s Memory socket.');
        break;
      }

      case 'if_else':
        if (!nonEmpty(d.left)) add(n.id, 'Value to check is missing.');
        if (!['is_empty', 'not_empty'].includes(d.operator) && !nonEmpty(d.value))
          add(n.id, 'Comparison value is missing.');
        if (d.operator === 'regex') {
          try { new RegExp(d.value ?? ''); } catch { add(n.id, 'Invalid regular expression.'); }
        }
        if (!out('true')) add(n.id, 'Connect the TRUE branch.');
        if (!out('false')) add(n.id, 'Connect the FALSE branch.');
        break;
    }
  }
  return errors;
}