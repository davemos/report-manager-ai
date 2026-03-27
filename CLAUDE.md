# CLAUDE.md — Report Manager AI

This file provides context for AI assistants working in this codebase. Read it before making changes.

## Project Overview

Report Manager AI is a Next.js application that lets users generate reports from Firestore using natural language. Users type a plain-English query, the app calls Claude to translate it into a structured Firestore query spec (JSON), executes the query, and renders the results as a paginated table with KPI cards and Excel/PDF export.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19 + Tailwind CSS 4 |
| Table | TanStack React Table 8 |
| Charts | Recharts 3 |
| Database | Firebase Firestore (via Admin SDK) |
| AI | Claude API (`claude-opus-4-6` by default) |
| Export | ExcelJS (`.xlsx`) + PDFKit (`.pdf`) |

## Repository Structure

```
src/
├── app/                        # Next.js App Router pages and API routes
│   ├── api/
│   │   ├── prompts/route.ts            # GET /api/prompts, POST /api/prompts
│   │   ├── prompts/[id]/route.ts       # GET/DELETE /api/prompts/{id}
│   │   ├── query/run/route.ts          # POST /api/query/run
│   │   ├── query/[jobId]/route.ts      # GET /api/query/{jobId}
│   │   └── query/[jobId]/export/route.ts # GET /api/query/{jobId}/export
│   ├── reports/
│   │   ├── [jobId]/page.tsx            # Report detail view
│   │   └── new/page.tsx                # New report creation page
│   ├── layout.tsx                      # Root layout + navigation
│   ├── page.tsx                        # Home page (saved prompts list)
│   └── globals.css                     # Global Tailwind styles
├── components/
│   ├── report/
│   │   ├── SummaryPage.tsx             # KPI metrics grid
│   │   └── KpiCard.tsx                 # Individual metric card
│   ├── PromptInput.tsx                 # Natural language query input
│   ├── PromptCard.tsx                  # Saved prompt list card
│   └── ReportNav.tsx                   # Export buttons (Excel/PDF)
├── lib/
│   ├── ai-agent.ts                     # Claude API call → FirestoreQuerySpec
│   ├── api.ts                          # Client-side fetch wrapper
│   ├── export.ts                       # Excel and PDF generation
│   ├── firebase-admin.ts               # Firebase Admin SDK initialization
│   ├── firestore-service.ts            # Firestore CRUD + schema inference + query execution
│   └── report-cache.ts                 # In-memory cache (60-min TTL, keyed by UUID jobId)
└── types/
    └── index.ts                        # All shared TypeScript interfaces
```

## Key Data Flow

```
User types prompt
  → POST /api/query/run
    → firestore-service.getSchemaContext()   # Sample 3 docs per collection → infer field types
    → ai-agent.generateQuerySpec(prompt, schema)  # Claude returns FirestoreQuerySpec JSON
    → firestore-service.executeQuery(spec)   # Run Firestore query, normalize Timestamps
    → report-cache.set(jobId, result)        # Cache result in memory for 60 min
  ← returns { jobId }

Frontend redirects to /reports/{jobId}
  → GET /api/query/{jobId}?page=&sort=&dir=
    → report-cache.get(jobId)               # Paginate/sort in-memory
  ← returns ReportResult

Export button
  → GET /api/query/{jobId}/export?format=excel|pdf
    → report-cache.get(jobId)
    → export.generateExcel() or export.generatePdf()
  ← returns file download
```

## Core Types (`src/types/index.ts`)

```typescript
FirestoreQuerySpec   // What Claude returns: collection, filters, columns, summarySpec, limit
FirestoreFilter      // { field, op, value } — op is one of: == != < <= > >= in array-contains
ReportResult         // What the cache stores: jobId, title, description, summary[], columns[], rows[], pagination
ReportColumn         // { key, label, type: 'string'|'number'|'date'|'currency'|'percent', sortable? }
SummaryMetric        // { label, value, format: 'currency'|'percent'|'number'|'text' }
SavedPrompt          // Firestore-persisted: id, name, description?, prompt, createdAt
RunQueryRequest      // { promptId? | customPrompt? }
```

## Environment Variables

All required unless noted:

```bash
CLAUDE_API_KEY          # Anthropic API key
CLAUDE_MODEL            # Optional; defaults to claude-opus-4-6
FIREBASE_PROJECT_ID     # Firebase project ID
FIREBASE_CLIENT_EMAIL   # Service account email
FIREBASE_PRIVATE_KEY    # Service account private key (include literal \n)
FIRESTORE_COLLECTIONS   # Comma-separated allowlist of queryable collections (e.g. "orders,users,products")
```

Create a `.env.local` file at the project root for local development. It is gitignored.

## Development Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build (runs next build)
npm start        # Start production server
```

There is no test runner, linter, or pre-commit hook configured. TypeScript type-checking runs as part of `next build`.

## API Route Conventions

- All routes live under `src/app/api/` following Next.js App Router file-based routing.
- Route handlers export named functions: `GET`, `POST`, `DELETE`.
- Errors are returned as `NextResponse.json({ error: '...' }, { status: N })`.
- Successful responses use `NextResponse.json(data)` or `new Response(buffer, { headers })` for file downloads.
- No authentication middleware exists — all routes are publicly accessible.

## Firestore Constraints

- Only collections listed in `FIRESTORE_COLLECTIONS` can be queried (enforced in `getSchemaContext`).
- Max query limit is hard-capped at 2000 documents (see `firestore-service.ts:115`).
- Schema inference samples up to 3 documents per collection at query-run time.
- Firestore `Timestamp` values are normalized to ISO strings before caching.
- The `savedPrompts` collection is always used (not in the user-configurable allowlist).

## Report Cache

- `src/lib/report-cache.ts` is a plain in-memory `Map` — **data is lost on server restart**.
- TTL: 60 minutes per entry.
- Cache key: UUID `jobId` returned by `POST /api/query/run`.
- No persistence layer — if a `jobId` 404s, the user must re-run the report.

## Claude AI Integration

- Entry point: `src/lib/ai-agent.ts` → `generateQuerySpec(prompt, schemaContext)`.
- Makes a direct `fetch` call to `https://api.anthropic.com/v1/messages`.
- System prompt instructs Claude to return **only raw JSON** matching `FirestoreQuerySpec`.
- Strips markdown fences from response if Claude adds them despite instructions.
- Model is configurable via `CLAUDE_MODEL` env var; defaults to `claude-opus-4-6`.

## Code Conventions

- **Path alias:** `@/*` maps to `src/*`. Use it for all imports (e.g. `import { ReportResult } from '@/types'`).
- **No default exports from lib files** — named exports only.
- **Server-only code** lives in `src/lib/` and is imported only by API route handlers, never by client components.
- **Client components** must have `'use client'` at the top if they use hooks or browser APIs. Page components in `app/` are Server Components by default.
- **Tailwind CSS only** — no CSS modules, no styled-components, no inline styles.
- Timestamps from Firestore are always converted to ISO strings before leaving the server.

## What to Avoid

- Do not import `firebase-admin` or `src/lib/firebase-admin.ts` in client components — it will break the build.
- Do not add a caching layer that bypasses `report-cache.ts` without updating both `GET /api/query/[jobId]` and the export route, which both read from it.
- Do not raise the Firestore query limit above 2000 without testing memory impact on the cache.
- Do not change the `FirestoreQuerySpec` JSON shape without updating the Claude system prompt in `ai-agent.ts` and the query executor in `firestore-service.ts`.
- Do not assume `FIRESTORE_COLLECTIONS` contains the `savedPrompts` collection — it is managed separately.
