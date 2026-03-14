# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build (Next.js static + SSR)
npm run start        # Run production server after build
npm run lint         # ESLint via next lint
npm run db:migrate   # Push Supabase migrations
npm run db:seed      # Seed database (npx tsx supabase/seed.ts)
```

No test framework is configured. TypeScript strict mode is enabled.

## Architecture

**Stack:** Next.js 14 App Router + Supabase (Postgres, Auth, Realtime) + Tailwind CSS + TypeScript

### Route Structure

- `app/page.tsx` — Root redirect to `/dashboard`
- `app/login/page.tsx` — Google OAuth + Magic Link auth
- `app/auth/callback/route.ts` — Server-side OAuth callback, creates profile on first login using `TEAM_EMAILS` allowlist in `lib/constants.ts`
- `app/(app)/layout.tsx` — Protected layout: wraps all board pages with `AuthProvider` + `Sidebar`
- `app/(app)/{board}/page.tsx` — Individual board pages (dashboard, sales, onboarding, production, publishing, ads, activity, users)

### Auth & Middleware

- `middleware.ts` intercepts all routes, redirects unauthenticated users to `/login` and authenticated users away from `/login`
- `components/auth-provider.tsx` provides `useAuth()` context with `{ user, role, loading, signOut, signInWithGoogle }`
- Roles (admin, editor, social, viewer) control board access, edit/delete permissions per `lib/constants.ts` → `ROLES`
- New users auto-assigned role based on email match in `TEAM_EMAILS`; unrecognized emails get "viewer"

### Data Layer

- `lib/supabase/client.ts` — Browser client (`createBrowserClient`)
- `lib/supabase/server.ts` — Server client (`createServerSupabase`) used in auth callback
- `lib/hooks.ts` — All data hooks:
  - `useTable<T>(table, orderBy?)` — Generic fetch + realtime subscription for any table
  - `insert(table, row)`, `update(table, id, updates)`, `remove(table, id)` — CRUD helpers
  - `log(action, detail, board, type, user)` — Activity logging to `activity_log` table
  - `useSales()` — Sales-specific hook with `upsert`, `remove`, `updateStage`
  - `useProfile()`, `useActivityLog()`, `useRealtime()` — Supporting hooks

### Supabase Tables

Defined in `supabase/migrations/001_initial_schema.sql`. Types in `types/index.ts`:
- `profiles` — User accounts with roles
- `sales` — Sales pipeline (stages: lead → call → proposal → follow_up → closed_won/lost)
- `onboarding` — New client checklist (contract, invoice, strategy, shoot)
- `clients` — Production tracking with weekly video targets and content pipeline stages (shoot → edit → approval → sent_guido → posted)
- `publishing` — Content calendar (statuses: pending_caption → approved → scheduled → posted)
- `ads` — Ad campaigns with budget/spend tracking
- `activity_log` — Audit trail for all board actions

### UI Components

- `components/ui/index.tsx` — Core UI: Badge, MetricCard, ProgressBar, Modal, FormRow, FormGrid, PageHeader, PrimaryButton, GhostButton, DangerButton, Toast, WeekHeader
- `components/ui/shared.tsx` — Re-exports all of index.tsx + SearchInput, AlertBanner
- `components/layout/sidebar.tsx` — Nav sidebar with role-based menu filtering
- `lib/utils.ts` — formatPeso, formatPesoK, formatDate, pct, daysFromNow, statusColor, WEEKS, getWeekDates
- `lib/constants.ts` — All enums, stage definitions, team emails, role configs, nav items

### Styling

Dark theme only. Uses CSS custom properties (`--bg-0`, `--bg-1`, `--bg-2`, `--fg`, `--mut`, `--brd`) defined in `globals.css`. Board pages primarily use inline styles (not Tailwind classes) following the Sales page pattern. Dashboard uses Tailwind utility classes. Both approaches coexist.

### Board Page Pattern

All board pages follow the same structure (Sales page is the canonical reference):
1. `'use client'` directive
2. Import `useTable`/CRUD from `@/lib/hooks`, `useAuth` from `@/components/auth-provider`, UI from `@/components/ui/shared`
3. Fetch data with `useTable<Type>('table_name')`
4. Search filtering, view toggle (board/list), metric cards
5. CRUD modal with `FormGrid`/`FormRow`, role-gated edit/delete buttons
6. Activity logging via `log()` on mutations

## Environment Variables

Required in `.env.local` (and Vercel):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Path Aliases

`@/*` maps to project root (tsconfig paths).
