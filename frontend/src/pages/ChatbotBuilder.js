import React, { useState, useCallback, useRef, createContext, useContext, useEffect } from 'react';
import ReactFlow, {
  addEdge, Background, Controls, MiniMap, useNodesState, useEdgesState, Handle, Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Play, Square, Brain, UserCog, Wrench, Database, GitBranch, Webhook, Rocket,
  Trash2, Loader2, MessageSquare, AlertTriangle, X, RotateCcw, Plus, CheckCircle2, Save, List,
} from 'lucide-react';
import { useParams } from 'react-router-dom';

const API = 'http://localhost:3000';
const LIST_PATH = '/chatbots'; // must match the ChatbotList route in App.js

// ---------- Node catalogue ----------
const META = {
  start:   { title: 'Start',   icon: Play,      color: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-700', defaults: {} },
  webhook: { title: 'Webhook', icon: Webhook,   color: 'bg-slate-700',   chip: 'bg-slate-200 text-slate-800',     defaults: { messageField: 'message', secret: '', testBody: '{\n  "message": "Hello",\n  "sessionId": "test1"\n}' } },
  agent:   { title: 'Agent',   icon: UserCog,   color: 'bg-blue-500',    chip: 'bg-blue-100 text-blue-700',       defaults: { systemPrompt: 'You are a helpful assistant.' } },
  llm:     { title: 'LLM',     icon: Brain,     color: 'bg-purple-500',  chip: 'bg-purple-100 text-purple-700',   defaults: { provider: 'mistral', model: 'mistral-small-latest', apiKey: '', temperature: 0.7, instruction: '' } },
  tools:   { title: 'Tool',    icon: Wrench,    color: 'bg-orange-500',  chip: 'bg-orange-100 text-orange-700',   defaults: { name: '', description: '', url: '', method: 'GET' } },
  memory:  { title: 'Memory',  icon: Database,  color: 'bg-teal-500',    chip: 'bg-teal-100 text-teal-700',       defaults: { windowSize: 10 } },
  if_else: { title: 'If / Else', icon: GitBranch, color: 'bg-amber-500', chip: 'bg-amber-100 text-amber-700',     defaults: { left: '{{input}}', operator: 'contains', value: '' } },
  end:     { title: 'End',     icon: Square,    color: 'bg-rose-500',    chip: 'bg-rose-100 text-rose-700',       defaults: {} },
};
const MODELS = {
  openai: ['gpt-4o-mini', 'gpt-4o'],
  mistral: ['mistral-small-latest', 'mistral-large-latest'],
  gemini: [
    'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash',
    'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview',
    'gemini-3-flash-preview', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite',
  ],
};
const OPERATORS = [
  ['contains', 'contains'], ['not_contains', 'does not contain'], ['equals', 'equals'],
  ['not_equals', 'does not equal'], ['starts_with', 'starts with'], ['ends_with', 'ends with'],
  ['regex', 'matches regex'], ['is_empty', 'is empty'], ['not_empty', 'is not empty'],
];

const FlowCtx = createContext({ update: () => {}, remove: () => {}, errors: {}, botId: null });
const inputCls = 'nodrag w-full border border-slate-300 rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400';
const Field = ({ label, children }) => (
  <label className="block">
    <span className="text-[11px] font-semibold text-slate-500">{label}</span>
    {children}
  </label>
);

// ---------- Custom node ----------
function CustomNode({ id, data }) {
  const { update, remove, errors, botId } = useContext(FlowCtx);
  const t = data.type;
  const { icon: Icon, title, color } = META[t];
  const errs = errors[id] || [];
  const set = (k) => (e) => update(id, { [k]: e.target.value });

  // LLM node: load the live model list
  const [models, setModels] = useState(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelErr, setModelErr] = useState('');
  const loadModels = async () => {
    setLoadingModels(true); setModelErr('');
    try {
      const res = await fetch(`${API}/chatbot/models`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: data.provider, apiKey: data.apiKey, botId, nodeId: id }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.message || 'Could not load models');
      setModels(out.models);
    } catch (e) { setModelErr(e.message); }
    setLoadingModels(false);
  };

  // Webhook node: send a test request to the SAVED bot
  const [testing, setTesting] = useState(false);
  const [testRes, setTestRes] = useState('');
  const sendTest = async () => {
    setTesting(true); setTestRes('');
    try {
      JSON.parse(data.testBody || '{}');
      const res = await fetch(`${API}/chatbot/${botId}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(data.secret && data.secret !== '********' ? { 'x-webhook-secret': data.secret } : {}) },
        body: data.testBody || '{}',
      });
      const out = await res.json();
      setTestRes(`Status ${res.status}\n${JSON.stringify(out, null, 2)}`);
    } catch (e) {
      setTestRes(e instanceof SyntaxError ? 'Test body is not valid JSON.' : e.message);
    }
    setTesting(false);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg w-72 border-2 group ${errs.length ? 'border-red-500 ring-4 ring-red-200' : 'border-slate-300'}`}>
      <div className={`${color} px-4 py-2 text-white font-bold text-sm flex items-center justify-between rounded-t-[10px]`}>
        <div className="flex items-center"><Icon className="w-4 h-4 mr-2" /> {title}</div>
        <button onClick={() => remove(id)} className="nodrag opacity-0 group-hover:opacity-100 hover:text-red-200 transition">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-2">
        {t === 'start' && <p className="text-xs text-slate-500">Runs when a visitor sends a message in the chat widget.</p>}

        {t === 'webhook' && (
          <>
            <Field label="Webhook URL (POST)">
              <input className={`${inputCls} bg-slate-50`} readOnly onFocus={(e) => e.target.select()}
                value={botId ? `${API}/chatbot/${botId}/webhook` : 'Save the workflow to get the URL'} />
            </Field>
            <Field label="Message field in the request body">
              <input className={inputCls} value={data.messageField ?? ''} onChange={set('messageField')} placeholder="message" />
            </Field>
            <Field label="Secret token (optional)">
              <input className={inputCls} type="password" autoComplete="off" value={data.secret ?? ''} onChange={set('secret')}
                placeholder="Callers send it in the x-webhook-secret header" />
            </Field>
            <Field label="Test body (JSON, editable)">
              <textarea className={`${inputCls} nowheel font-mono`} rows={4} value={data.testBody ?? ''} onChange={set('testBody')} />
            </Field>
            <button type="button" onClick={sendTest} disabled={!botId || testing}
              className="nodrag w-full bg-slate-800 text-white text-xs font-semibold py-1.5 rounded hover:bg-slate-700 disabled:opacity-50">
              {testing ? 'Sending…' : 'Send test request'}
            </button>
            <p className="text-[10px] text-slate-400">The test calls the last saved version. Save first if you changed anything.</p>
            {testRes && (
              <pre className="nodrag nowheel text-[10px] bg-slate-50 border rounded p-2 max-h-32 overflow-auto whitespace-pre-wrap break-words">{testRes}</pre>
            )}
          </>
        )}

        {t === 'agent' && (
          <>
            <Field label="Instruction (system prompt)">
              <textarea className={`${inputCls} nowheel`} rows={4} value={data.systemPrompt ?? ''} onChange={set('systemPrompt')}
                placeholder="You are a support agent for ..." />
            </Field>
            <div className="text-[11px] font-medium leading-5">
              <span className="text-purple-600">● LLM</span>{' '}
              <span className="text-orange-600">● Tools</span>{' '}
              <span className="text-teal-600">● Memory</span>
              <span className="text-slate-400"> (sockets on the left)</span>
            </div>
          </>
        )}

        {t === 'llm' && (
          <>
            <Field label="Provider">
              <select className={inputCls} value={data.provider} onChange={(e) => { update(id, { provider: e.target.value, model: MODELS[e.target.value][0] }); setModels(null); }}>
                <option value="openai">OpenAI</option>
                <option value="mistral">Mistral</option>
                <option value="gemini">Gemini</option>
              </select>
            </Field>
            <Field label="Model">
              {(() => {
                const options = models || MODELS[data.provider] || [];
                const known = options.includes(data.model);
                return (
                  <>
                    <select className={inputCls} value={known ? data.model : '__custom'}
                      onChange={(e) => update(id, { model: e.target.value === '__custom' ? '' : e.target.value })}>
                      {options.map((m) => <option key={m} value={m}>{m}</option>)}
                      <option value="__custom">Other (type a name)…</option>
                    </select>
                    {!known && <input className={`${inputCls} mt-1`} value={data.model ?? ''} onChange={set('model')} placeholder="model name" />}
                  </>
                );
              })()}
              <button type="button" onClick={loadModels} disabled={!data.apiKey || loadingModels}
                className="nodrag mt-1 text-[11px] text-indigo-600 hover:underline disabled:text-slate-400">
                {loadingModels ? 'Loading…' : models ? `Reload (${models.length} models)` : 'Load all models from my API key'}
              </button>
              {modelErr && <p className="text-[10px] text-red-600 mt-1">{modelErr}</p>}
            </Field>
            <Field label="API key">
              <input className={inputCls} type="password" autoComplete="off" value={data.apiKey ?? ''} onChange={set('apiKey')} placeholder="Paste your API key" />
              {data.apiKey === '********' && <span className="text-[10px] text-emerald-600">Saved key is kept. Type a new one to replace it.</span>}
            </Field>
            <Field label="Temperature">
              <input className={inputCls} type="number" min="0" max="2" step="0.1" value={data.temperature ?? 0.7} onChange={set('temperature')} />
            </Field>
            <Field label="Extra instruction for the model (optional)">
              <textarea className={`${inputCls} nowheel`} rows={3} value={data.instruction ?? ''} onChange={set('instruction')}
                placeholder="Always answer in Urdu. Keep answers short." />
            </Field>
          </>
        )}

        {t === 'tools' && (
          <>
            <Field label="Tool name">
              <input className={inputCls} value={data.name ?? ''} onChange={set('name')} placeholder="get_order_status" />
            </Field>
            <Field label="Description (tells the agent when to use it)">
              <textarea className={`${inputCls} nowheel`} rows={3} value={data.description ?? ''} onChange={set('description')}
                placeholder="Look up an order by its number. Input: the order number." />
            </Field>
            <div className="flex gap-2">
              <select className={`${inputCls} !w-20`} value={data.method} onChange={set('method')}>
                <option>GET</option><option>POST</option>
              </select>
              <input className={inputCls} value={data.url ?? ''} onChange={set('url')} placeholder="https://api.example.com/orders?id={{input}}" />
            </div>
            <p className="text-[10px] text-slate-400">Use {'{{input}}'} in the URL, or the agent's input is sent as ?input= (GET) / JSON body (POST).</p>
          </>
        )}

        {t === 'memory' && (
          <Field label="Messages to remember (1–50)">
            <input className={inputCls} type="number" min="1" max="50" value={data.windowSize ?? 10} onChange={set('windowSize')} />
          </Field>
        )}

        {t === 'if_else' && (
          <>
            <Field label="Value to check">
              <input className={inputCls} value={data.left ?? ''} onChange={set('left')} placeholder="{{input}}" />
            </Field>
            <Field label="Condition">
              <select className={inputCls} value={data.operator} onChange={set('operator')}>
                {OPERATORS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            {!['is_empty', 'not_empty'].includes(data.operator) && (
              <Field label="Compare with">
                <input className={inputCls} value={data.value ?? ''} onChange={set('value')} placeholder="refund" />
              </Field>
            )}
            <p className="text-[10px] text-slate-400">{'{{input}}'} = output of the previous node, {'{{message}}'} = what the visitor typed.</p>
            <div className="flex justify-between text-[11px] font-bold px-4 pt-2">
              <span className="text-emerald-600">TRUE</span><span className="text-rose-600">FALSE</span>
            </div>
          </>
        )}

        {t === 'end' && <p className="text-xs text-slate-500">Ending point of the flow.</p>}

        {errs.length > 0 && (
          <ul className="mt-1 rounded bg-red-50 border border-red-200 p-2 text-[11px] text-red-700 space-y-1">
            {errs.map((m, i) => (
              <li key={i} className="flex gap-1"><AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />{m}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Handles */}
      {t === 'agent' && (
        <>
          <Handle type="target" id="in" position={Position.Top} className="!bg-slate-400 !w-3 !h-3" />
          <Handle type="target" id="llm-in" position={Position.Left} style={{ top: '35%' }} className="!bg-purple-500 !w-3 !h-3" />
          <Handle type="target" id="tools-in" position={Position.Left} style={{ top: '55%' }} className="!bg-orange-500 !w-3 !h-3" />
          <Handle type="target" id="memory-in" position={Position.Left} style={{ top: '75%' }} className="!bg-teal-500 !w-3 !h-3" />
        </>
      )}
      {['if_else', 'end'].includes(t) && <Handle type="target" id="in" position={Position.Top} className="!bg-slate-400 !w-3 !h-3" />}
      {['llm', 'tools', 'memory'].includes(t) && <Handle type="source" id="out" position={Position.Right} className="!bg-slate-500 !w-3 !h-3" />}
      {['start', 'webhook', 'agent'].includes(t) && <Handle type="source" id="out" position={Position.Bottom} className="!bg-slate-400 !w-3 !h-3" />}
      {t === 'if_else' && (
        <>
          <Handle type="source" id="true" position={Position.Bottom} style={{ left: '25%' }} className="!bg-emerald-500 !w-3 !h-3" />
          <Handle type="source" id="false" position={Position.Bottom} style={{ left: '75%' }} className="!bg-rose-500 !w-3 !h-3" />
        </>
      )}
    </div>
  );
}
const nodeTypes = { custom: CustomNode };

// ---------- Starter flow (new bots) ----------
const edgeStyle = { animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } };
const mk = (id, type, x, y) => ({ id, type: 'custom', position: { x, y }, data: { type, ...META[type].defaults } });
const link = (source, target, targetHandle = 'in') => ({
  id: `e-${source}-${target}`, source, target, sourceHandle: 'out', targetHandle, ...edgeStyle,
});
const START_NODES = [
  mk('start1', 'start', 300, 0), mk('agent1', 'agent', 300, 130), mk('end1', 'end', 300, 520),
  mk('llm1', 'llm', -60, 130), mk('memory1', 'memory', -60, 520),
];
const START_EDGES = [
  link('start1', 'agent1'), link('agent1', 'end1'),
  link('llm1', 'agent1', 'llm-in'), link('memory1', 'agent1', 'memory-in'),
];

// ---------- Builder ----------
export default function ChatbotBuilder() {
  const params = useParams();
  // /chatbot-builder/:id = edit mode. Falls back to the URL so it also works outside a <Router>.
  const id = params.id || window.location.pathname.match(/\/chatbot-builder\/([^/?#]+)/)?.[1] || null;
  const goList = () => window.location.assign(LIST_PATH);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rf, setRf] = useState(null);
  const rfRef = useRef(null);
  const [botId, setBotId] = useState(id || null);
  const [botName, setBotName] = useState('');
  const [errors, setErrors] = useState({});          // nodeId -> [messages]
  const [flowErrors, setFlowErrors] = useState([]);  // errors not tied to a node
  const [status, setStatus] = useState(null);        // { ok, text, saved }
  const [busy, setBusy] = useState(false);
  const [testFlow, setTestFlow] = useState(null);    // { flow, runId } -> opens the test chat widget
  const [stale, setStale] = useState(false);         // flow changed after the last Generate
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  const markChanged = useCallback(() => setStale(true), []);

  // New flow or edit mode: load from the server when the URL has an id
  useEffect(() => {
    setTestFlow(null); setErrors({}); setFlowErrors([]); setStatus(null); setStale(false);
    if (id) {
      setBotId(id);
      fetch(`${API}/chatbot/${id}`)
        .then((res) => { if (!res.ok) throw new Error('Workflow not found'); return res.json(); })
        .then((data) => {
          setNodes(data.flow?.nodes || []);
          setEdges((data.flow?.edges || []).map((e) => ({ ...e, ...edgeStyle })));
          setBotName(data.name || '');
          setTimeout(() => rfRef.current?.fitView({ padding: 0.2 }), 100);
        })
        .catch((err) => setStatus({ ok: false, text: err.message || 'Failed to load workflow' }));
    } else {
      setBotId(null); setBotName('');
      setNodes(START_NODES); setEdges(START_EDGES);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const update = useCallback((nodeId, patch) => {
    setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n)));
    setErrors((e) => { if (!e[nodeId]) return e; const { [nodeId]: _drop, ...rest } = e; return rest; });
    markChanged();
  }, [setNodes, markChanged]);

  const remove = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    markChanged();
  }, [setNodes, setEdges, markChanged]);

  const isValidConnection = useCallback((c) => {
    const src = nodes.find((n) => n.id === c.source)?.data.type;
    const want = { 'llm-in': 'llm', 'tools-in': 'tools', 'memory-in': 'memory' }[c.targetHandle];
    if (want) return src === want;
    return c.source !== c.target && ['start', 'webhook', 'agent', 'if_else'].includes(src);
  }, [nodes]);

  const onConnect = useCallback((p) => {
    setEdges((eds) => addEdge({ ...p, ...edgeStyle }, eds));
    markChanged();
  }, [setEdges, markChanged]);

  const onDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);
  const onDrop = useCallback((e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/reactflow');
    if (!type || !META[type] || !rf) return;
    const position = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setNodes((nds) => nds.concat({ id: `node_${Date.now()}`, type: 'custom', position, data: { type, ...META[type].defaults } }));
    markChanged();
  }, [rf, setNodes, markChanged]);

  const cleanFlow = () => ({
    nodes: nodes.map(({ id: nid, type, position, data }) => ({ id: nid, type, position, data })),
    edges: edges.map(({ id: eid, source, target, sourceHandle, targetHandle }) => ({ id: eid, source, target, sourceHandle, targetHandle })),
  });

  const showErrors = (list) => {
    const byNode = {};
    list.filter((e) => e.nodeId).forEach((e) => { (byNode[e.nodeId] ||= []).push(e.message); });
    setErrors(byNode);
    setFlowErrors(list.filter((e) => !e.nodeId).map((e) => e.message));
    setStatus({ ok: false, text: `${list.length} problem${list.length > 1 ? 's' : ''} found. Fix the red nodes and try again.` });
    const first = Object.keys(byNode)[0];
    if (first) rfRef.current?.fitView({ nodes: [{ id: first }], duration: 400, maxZoom: 1 });
  };

  // GENERATE: check the flow, then open the test chat (nothing is saved)
  const generate = async () => {
    setBusy(true); setStatus(null);
    try {
      const flow = cleanFlow();
      const res = await fetch(`${API}/chatbot/validate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow, botId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Server error');
      if (!data.ok) { setTestFlow(null); showErrors(data.errors); return; }
      setErrors({}); setFlowErrors([]); setStale(false);
      setTestFlow({ flow, runId: Date.now() });
      setStatus({ ok: true, text: 'Flow is ready. Chat with it in the widget, then press Save.' });
    } catch (err) {
      setTestFlow(null);
      setStatus({ ok: false, text: err.message || 'Could not reach the server. Is the backend running?' });
    } finally {
      setBusy(false);
    }
  };

  // SAVE: ask for a name, then store (or update) the workflow
  const openSave = () => { setSaveName(botName || ''); setSaveOpen(true); };
  const doSave = async () => {
    const name = saveName.trim();
    if (!name) return;
    setSaveOpen(false); setBusy(true); setStatus(null);
    try {
      const res = await fetch(`${API}/chatbot/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow: cleanFlow(), botId, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Server error');
      if (!data.ok) { showErrors(data.errors); return; }
      setErrors({}); setFlowErrors([]);
      setBotId(data.botId); setBotName(data.name || name);
      setStatus({ ok: true, saved: true, text: `Saved as "${data.name || name}".` });
    } catch (err) {
      setStatus({ ok: false, text: err.message || 'Could not reach the server.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <FlowCtx.Provider value={{ update, remove, errors, botId }}>
      <div className="flex h-screen bg-slate-50">
        <aside className="w-60 bg-white border-r border-slate-200 p-4 shadow-sm z-10 overflow-y-auto">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center"><Plus className="mr-2 w-5 h-5" /> Nodes</h2>
          <p className="text-xs text-slate-500 mb-4">{botId ? <>Editing: <b>{botName || 'workflow'}</b></> : 'New workflow'}</p>
          <div className="space-y-2">
            {Object.entries(META).map(([type, m]) => (
              <div key={type} draggable
                onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', type); e.dataTransfer.effectAllowed = 'move'; }}
                className={`p-3 border rounded-lg cursor-grab flex items-center hover:opacity-80 transition ${m.chip}`}>
                <m.icon className="w-5 h-5 mr-3" /><span className="font-medium text-sm">{m.title}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500 leading-5">
            Plug <b>LLM</b>, <b>Tool</b> and <b>Memory</b> nodes into the matching sockets on the left of an Agent.
          </p>
          <button onClick={goList}
            className="mt-4 w-full text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg py-2 flex items-center justify-center hover:bg-slate-50">
            <List className="w-4 h-4 mr-2" /> My chatbots
          </button>
        </aside>

        <div className="flex-1 relative">
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
            isValidConnection={isValidConnection} onDrop={onDrop} onDragOver={onDragOver}
            onInit={(inst) => { setRf(inst); rfRef.current = inst; }}
            deleteKeyCode={['Backspace', 'Delete']} fitView>
            <Background color="#cbd5e1" gap={16} />
            <Controls />
            <MiniMap />
          </ReactFlow>

          {/* Bottom bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 max-w-xl w-full px-4">
            {(flowErrors.length > 0 || (status && !status.ok)) && (
              <div className="w-full rounded-xl border border-red-200 bg-white shadow-lg p-3 text-sm">
                {status && <p className="font-semibold text-red-700 flex items-center"><AlertTriangle className="w-4 h-4 mr-2" />{status.text}</p>}
                {flowErrors.map((m, i) => <p key={i} className="text-red-600 text-xs mt-1">• {m}</p>)}
                {Object.entries(errors).length > 0 && (
                  <ul className="mt-2 max-h-32 overflow-y-auto space-y-1">
                    {Object.entries(errors).flatMap(([nid, msgs]) => msgs.map((m, i) => (
                      <li key={nid + i}>
                        <button className="text-left text-xs text-red-600 hover:underline"
                          onClick={() => rf?.fitView({ nodes: [{ id: nid }], duration: 400, maxZoom: 1 })}>
                          {META[nodes.find((n) => n.id === nid)?.data.type]?.title ?? 'Node'}: {m}
                        </button>
                      </li>
                    )))}
                  </ul>
                )}
              </div>
            )}

            {status?.ok && (
              <div className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium px-4 py-1.5 flex items-center gap-3">
                <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" />{status.text}</span>
                {status.saved && (
                  <button onClick={goList} className="underline font-semibold">Open my chatbots</button>
                )}
              </div>
            )}

            {testFlow && stale && (
              <div className="rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-4 py-1.5">
                You changed the flow. Press Generate again to test the latest version.
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={generate} disabled={busy}
                className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center hover:bg-indigo-700 transition disabled:opacity-70">
                {busy ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Rocket className="w-5 h-5 mr-2" />}
                Generate
              </button>
              <button onClick={openSave} disabled={busy}
                className="bg-emerald-600 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center hover:bg-emerald-700 transition disabled:opacity-70">
                <Save className="w-5 h-5 mr-2" />
                {botId ? 'Save changes' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {testFlow && <ChatWidget key={testFlow.runId} flow={testFlow.flow} botId={botId} />}

        {/* Save dialog */}
        {saveOpen && (
          <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center" onClick={() => setSaveOpen(false)}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-slate-800">{botId ? 'Update workflow' : 'Save workflow'}</h3>
              <p className="text-sm text-slate-500 mt-1">What should this chatbot be called?</p>
              <input autoFocus value={saveName} onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSave()} maxLength={80} placeholder="e.g. Pizza Order Bot"
                className="mt-3 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setSaveOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={doSave} disabled={!saveName.trim()}
                  className="px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FlowCtx.Provider>
  );
}

// ---------- Test chat widget (runs the flow from the canvas, nothing is saved) ----------
const newSession = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const WELCOME = 'Your flow is ready! Say hi to test it. 👋';

function ChatWidget({ flow, botId }) {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState([{ text: WELCOME, sender: 'bot' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const session = useRef(newSession());
  const endRef = useRef(null);

  const scroll = () => setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
  const reset = () => { session.current = newSession(); setMessages([{ text: WELCOME, sender: 'bot' }]); };

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { text, sender: 'user' }]);
    setInput(''); setLoading(true); scroll();
    try {
      const res = await fetch(`${API}/chatbot/test`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow, botId, message: text, sessionId: session.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      if (data.ok === false) throw new Error(data.errors?.[0]?.message || 'The flow has errors. Press Generate again.');
      setMessages((m) => [...m, { text: data.reply, sender: 'bot' }]);
    } catch (err) {
      setMessages((m) => [...m, { text: `⚠ ${err.message}`, sender: 'bot', error: true }]);
    }
    setLoading(false); scroll();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="bg-white w-80 h-[28rem] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
            <div>
              <div className="font-bold leading-tight">AI Assistant</div>
              <div className="text-[10px] text-amber-300">Test mode · not saved yet</div>
            </div>
            <span className="flex gap-3">
              <button onClick={reset} title="New conversation" className="text-slate-400 hover:text-white"><RotateCcw className="w-4 h-4" /></button>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </span>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-2 rounded-lg max-w-[80%] text-sm whitespace-pre-wrap ${
                  m.sender === 'user' ? 'bg-indigo-600 text-white' : m.error ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-white border text-slate-800'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-slate-400 italic">Typing…</div>}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} className="p-3 bg-white border-t flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-4 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-60">Send</button>
          </form>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="bg-indigo-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:bg-indigo-700 hover:scale-105 transition">
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}