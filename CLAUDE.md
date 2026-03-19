# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js + Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run all tests (vitest)
npx vitest run src/path/to/test.test.ts  # Run a single test
npm run setup        # Install deps + generate Prisma client + run migrations
npm run db:reset     # Reset database (destructive)
```

Environment: requires `ANTHROPIC_API_KEY` for real AI responses. Without it, a mock provider returns static components.

## Architecture

**UIGen** is an AI-powered React component generator. Users describe components in chat, Claude generates code via tool calls, and a live preview renders the result in-browser — all without writing to disk.

### Stack
- Next.js 15 (App Router) / React 19 / TypeScript / Tailwind CSS v4
- Prisma + SQLite for persistence
- Vercel AI SDK (`ai`) + `@ai-sdk/anthropic` for streaming LLM interaction
- shadcn/ui components (Radix UI primitives)

### Path alias
`@/*` maps to `./src/*`

### Key data flow

1. **Chat** (`src/lib/contexts/chat-context.tsx`) wraps Vercel AI SDK's `useChat`, sending messages + serialized virtual FS to `/api/chat`
2. **API route** (`src/app/api/chat/route.ts`) streams Claude responses using `streamText()` with two tools: `str_replace_editor` and `file_manager`
3. **Tool calls** flow back to the client where `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) applies them to the in-memory virtual file system
4. **Preview** (`src/components/preview/`) transforms files via Babel (`src/lib/transform/jsx-transformer.ts`) into a standalone HTML document rendered in an iframe. Imports resolve to esm.sh CDN

### Virtual file system (`src/lib/file-system.ts`)
All generated code lives in memory — no disk I/O. The FS serializes to JSON for database persistence (Project.data field) and is sent with each chat request so Claude has current file state.

### AI provider (`src/lib/provider.ts`)
- Model: `claude-haiku-4-5` with prompt caching enabled
- Falls back to `MockLanguageModel` when no API key is set — returns hardcoded Counter/Form/Card components
- Tools defined in `src/lib/tools/`: `str_replace_editor` (create/view/edit files) and `file_manager` (rename/delete)
- System prompt in `src/lib/prompts/generation.tsx` requires `/App.jsx` as entry point

### Auth (`src/lib/auth.ts`, `src/actions/index.ts`)
JWT sessions via `jose`, stored in httpOnly cookies. Middleware protects `/api/projects` and `/api/filesystem` routes. Anonymous users can generate components but can't persist projects.

### Database
Refer to `prisma/schema.prisma` for the current database structure. Two models: **User** (email/password) and **Project** (name, messages as JSON string, data as JSON string storing virtual FS, optional userId for anonymous support).

### `node-compat.cjs`
Strips non-functional `globalThis.localStorage`/`sessionStorage` in Node.js 25+ to prevent SSR errors. Loaded via `NODE_OPTIONS` in all server-running scripts.

## Testing
Vitest with jsdom environment and React Testing Library. Tests live in `__tests__` directories alongside source files.

## Code style
- Use comments sparingly. Only comment complex, non-obvious code.
