# iteragent

A developer tool that gives AI coding assistants (Claude, Cursor) awareness of your running web application by capturing console logs, errors, and network activity from the browser and feeding them back into your development workflow.

## The Problem

AI coding assistants are blind to the front end. When you're building a web app, Claude Code and Cursor can read your source files and terminal output — but they can't see what's actually happening in the browser. Runtime errors, failed API calls, console warnings, and UI state are invisible unless you manually copy-paste them.

Tools like Playwright solve this for testing, but they're heavyweight for iterative development. You don't need a headless browser — you need a lightweight bridge between your running app and your AI assistant.

## How It Works

iteragent runs a local server that captures output from your web application and makes it available to your AI development environment:

```
Browser (localhost:3000)  →  iteragent (captures logs)  →  Claude / Cursor (reads context)
```

1. A small script in your web app sends console logs, errors, and network requests to iteragent's local endpoint
2. iteragent aggregates and formats the output
3. Your AI assistant reads the captured context to understand what's happening at runtime

## Quick Start

```bash
npm install intertools
npx intertools
```

Add the capture script to your web app:

```html
<script src="http://localhost:4000/capture.js"></script>
```

Or programmatically:

```javascript
const { InterTools } = require('intertools');

const intertools = new InterTools();
await intertools.startDevelopmentMonitoring({
  terminal: true,
  localhost: 'http://localhost:3000'
});
```

## What It Captures

- **Console output** — logs, warnings, errors from the browser
- **Runtime errors** — uncaught exceptions with stack traces
- **Network requests** — failed API calls, slow responses, status codes
- **Build errors** — webpack/vite build failures and warnings

## Why I Built This

I ship full-stack products using Claude Code and Cursor as my primary development environments. The biggest friction point was the feedback loop: I'd make a change, check the browser, see an error, then have to describe or paste it back to Claude. iteragent closes that loop automatically.

Built with TypeScript. MIT License.

## Tech Stack

- TypeScript / Node.js
- WebSocket for real-time log streaming
- Express for the local capture server
- Works with any web framework (React, Next.js, vanilla JS)

## Contributing

Issues and PRs welcome.
