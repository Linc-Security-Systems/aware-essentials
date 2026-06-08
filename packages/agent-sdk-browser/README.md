# @awarevue/agent-sdk-browser

Browser transport adapters for the [Aware Agent Protocol](../agent-sdk-typescript/README.md). Enables agents to run inside `<iframe>` elements and communicate with the host page over the [postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) — a drop-in replacement for the WebSocket transport with 100% protocol parity.

## Overview

```
  Host page                                       iframe (agent)
  ─────────────────────────────────────────       ─────────────────────────────
  PostMessageHostDuplexTransport(iframeEl)  ←──→  PostMessageIframeDuplexTransport()
         │                                                   │
  InMemoryHub.addPeer(id, transport)              WsJsonEncoder
         │                                                   │
  AgentServer                                     LoggingDuplexTransport
                                                             │
                                                        AgentProtocol
                                                             │
                                                         AgentApp
```

Both transports implement `DuplexTransport<string, string>` — the exact same interface as `WsDuplexTransport` / `WsServerDuplexTransport` from the core SDK. **Nothing in the protocol stack above the transport layer changes.** Switching between WebSocket and postMessage is a single constructor swap.

## Installation

```bash
npm install @awarevue/agent-sdk-browser
# peer dependencies
npm install @awarevue/agent-sdk @awarevue/api-types rxjs
```

## Example 1 — Agent inside an iframe

`createBrowserAgentApp` mirrors `createAgentApp` from the core SDK but defaults the transport to `PostMessageIframeDuplexTransport`.

```ts
// agent/index.ts  — bundled and loaded inside an <iframe>
import { createBrowserAgentApp } from '@awarevue/agent-sdk-browser';
import { Agent, RunContext } from '@awarevue/agent-sdk';

const myAgent: Agent = {
  async start(provider: string, config: unknown, ctx: RunContext) {
    ctx.pushState('door-1', { connected: true, locked: true });
  },

  async stop(provider: string) {},

  async runCommand(provider, device, command) {
    if (command.command === 'door.unlock') {
      return { success: true };
    }
    return { success: false, error: 'Unknown command' };
  },

  async query() {
    return [];
  },
};

const app = createBrowserAgentApp(myAgent, {
  agentId: 'my-agent',
  providers: {
    'my-provider': {
      title: 'My Provider',
      configSchema: {},
      configDefault: {},
    },
  },
});

app.start();
```

## Example 2 — Host page managing multiple iframe agents

Use `PostMessageHostDuplexTransport` (one per iframe), wire each into an `InMemoryHub`, then attach an `AgentServer` — the same server-side setup used with WebSocket agents.

```ts
// host/index.ts  — runs in the parent page
import {
  AgentServer,
  InMemoryHub,
  WsJsonEncoder,
} from '@awarevue/agent-sdk';
import { PostMessageHostDuplexTransport } from '@awarevue/agent-sdk-browser';
import { FromAgent, FromServer, Message } from '@awarevue/api-types';

type AgentMsg  = Message<FromAgent>;
type ServerMsg = Message<FromServer>;

const hub = new InMemoryHub<AgentMsg, ServerMsg, string>();
const server = new AgentServer(hub);
server.init();

// Called once per iframe, after the iframe's src has loaded
function registerIframeAgent(iframeEl: HTMLIFrameElement, peerId: string) {
  const rawTransport = new PostMessageHostDuplexTransport(iframeEl);

  // Wrap in the same JSON encoding layer used on the WebSocket path
  const transport = new WsJsonEncoder(rawTransport) as unknown as import('@awarevue/agent-sdk').DuplexTransport<AgentMsg, ServerMsg>;

  hub.addPeer(peerId, transport as any);
}

// Wire up iframes declared in your HTML
const iframe1 = document.getElementById('agent-iframe-1') as HTMLIFrameElement;
iframe1.addEventListener('load', () => registerIframeAgent(iframe1, 'agent-1'));
iframe1.src = '/agents/my-agent/index.html';
```

> **Note:** `WsJsonEncoder` is applied on the host side too, because `PostMessageHostDuplexTransport` is a `DuplexTransport<string, string>` (raw strings). This matches exactly how `WsServerDuplexTransport` is used in server-side code.

## Example 3 — Testing an iframe agent over WebSocket (transport swap)

Because `createBrowserAgentApp` accepts a `transport` override, you can replace the postMessage stack with the standard WebSocket stack for out-of-browser integration testing — zero changes to the agent code:

```ts
import { createBrowserAgentApp } from '@awarevue/agent-sdk-browser';
import {
  WsDuplexTransport,
  WsJsonEncoder,
  LoggingDuplexTransport,
} from '@awarevue/agent-sdk';

// The exact same agent code runs against a real Aware server over WebSocket
const app = createBrowserAgentApp(myAgent, {
  agentId: 'my-agent',
  providers: { 'my-provider': { title: 'My Provider', configSchema: {}, configDefault: {} } },
  transport: new LoggingDuplexTransport(
    new WsJsonEncoder(
      new WsDuplexTransport({
        url: 'wss://hub.example.com/agent',
        headers: { Authorization: 'APIKey <key>' },
      }),
    ) as any,
  ),
});

app.start();
```

## API reference

### `PostMessageIframeDuplexTransport`

Agent-side transport. Listens for messages on `window` and sends to `window.parent`.

```ts
new PostMessageIframeDuplexTransport(opts?: {
  targetOrigin?: string; // default '*'
})
```

| Member | Type | Description |
|--------|------|-------------|
| `connected$` | `Observable<boolean>` | Emits `true` immediately, then `false` on `close()` |
| `messages$` | `Observable<string>` | Inbound string messages from the host |
| `send(msg)` | `void` | Sends a string to `window.parent` |
| `close()` | `void` | Tears down all subscriptions; idempotent |

### `PostMessageHostDuplexTransport`

Host-side transport. Wraps a single `HTMLIFrameElement` and filters `window` message events by `event.source`.

```ts
new PostMessageHostDuplexTransport(
  iframe: HTMLIFrameElement,
  targetOrigin?: string, // default '*'
)
```

| Member | Type | Description |
|--------|------|-------------|
| `connected$` | `Observable<boolean>` | Emits `true` immediately, then `false` on `close()` |
| `messages$` | `Observable<string>` | Inbound string messages from the specific iframe |
| `send(msg)` | `void` | Sends a string to `iframe.contentWindow` |
| `close()` | `void` | Tears down all subscriptions; idempotent |

### `createBrowserAgentApp`

Convenience factory. Mirrors `createAgentApp` from the core SDK.

```ts
createBrowserAgentApp(agent: Agent, options: BrowserAgentAppOptions): AgentApp
```

`BrowserAgentAppOptions` extends `AgentOptions` (minus `transport`) with:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `targetOrigin` | `string` | `'*'` | Passed to the default `PostMessageIframeDuplexTransport` |
| `transport` | `DuplexTransport<...>` | — | Override the full transport stack (e.g. for WebSocket testing) |

## Origin security

Both transports default `targetOrigin` to `'*'` for ease of development. In production, set it to the exact origin of the other party to prevent cross-origin message leakage:

```ts
// Agent side (inside iframe)
new PostMessageIframeDuplexTransport({ targetOrigin: 'https://app.example.com' })

// Host side
new PostMessageHostDuplexTransport(iframeEl, 'https://agents.example.com')
```
