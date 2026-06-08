# Overview

This repo contains implementation of 2 libraries:
- @awarevue/agent-sdk
- @awarevue/api-types

Those libraries are typically imported by developers who wish to write a new agent that connects devices to Aware platform.

# � Browser / iframe Demo Apps

Two demo packages exist under `packages/` to exercise the agent protocol over the `postMessage` transport — no WebSocket, no server, runs entirely in a browser.

## What they demonstrate

| Concept | Where it happens |
|---|---|
| `PostMessageHub` auto-discovers agents from `window.message` events | `demo-host` |
| `WsJsonHubAdapter` lifts a `HubTransport<string,string>` to `HubTransport<Message<T>>` | `demo-host` |
| `AgentServer` handles register / start / stop lifecycle | `demo-host` |
| `PostMessageIframeDuplexTransport` sends agent messages to the parent page | `demo-agent-iframe` |
| `AgentApp` self-registers on startup (agent-initiated, not host-initiated) | `demo-agent-iframe` |

## Architecture

```
demo-host (localhost:5173)                  demo-agent-iframe (localhost:5174)
─────────────────────────────               ────────────────────────────────
PostMessageHub                              PostMessageIframeDuplexTransport
  └─ WsJsonHubAdapter                         └─ WsJsonEncoder
       └─ AgentServer                               └─ LoggingDuplexTransport
                                                         └─ AgentApp
                                                              └─ SmartLockAgent
```

On startup `AgentApp.start()` fires a `register` message via `window.parent.postMessage`.  
`PostMessageHub` catches it, reads `msg.from` (`"demo_agent"`) as the peer ID, emits a `join` event, and `AgentServer` completes the handshake.

## Running the demos

Start the agent iframe first (so the host can embed it immediately):

```bash
# Terminal 1 — agent plugin (port 5174)
yarn workspace demo-agent-iframe dev

# Terminal 2 — host console (port 5173)
yarn workspace demo-host dev
```

Open **http://localhost:5173** in a browser.

- The left panel shows connection status, **Start Agent** / **Stop Agent** buttons, and a live notifications log.
- The right panel is the iframe running `demo-agent-iframe` — a fictional Smart Lock Controller managing three doors.
- Once the agent registers the status badge turns amber; after clicking **Start Agent** it turns green and lock states begin updating every 5 seconds.

## Package summary

| Package | Port | Role |
|---|---|---|
| `demo-host` | 5173 | Parent web app — hosts the iframe, owns `AgentServer` |
| `demo-agent-iframe` | 5174 | Iframe agent plugin — implements the `Agent` interface, connects via `postMessage` |

# �🦋 Versioning and Publishing

Please update versions in package.json files when you change anything.
