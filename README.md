# Viral Vision OS

Company operating system for Viral Vision — Sales, Onboarding, Production, Publishing, Ads, Executive Dashboard.

**Stack:** Next.js 14 + Supabase + Tailwind CSS → Deploys to Vercel

## Quick Start

```bash
# 1. Install
npm install

# 2. Set up Supabase (see SETUP section below)
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key

# 3. Run the database schema
# Copy supabase/migrations/001_initial_schema.sql into Supabase SQL Editor → Run

# 4. Start dev server
npm run dev
```

## Setup Guide

See the full setup instructions inside the project. Key steps:

1. Create Supabase project at supabase.com
2. Copy URL + anon key to .env.local
3. Run the SQL migration (creates tables, triggers, seed data, RLS policies)
4. Enable Google OAuth in Supabase Auth settings
5. Deploy to Vercel with environment variables

## Architecture

- **Frontend:** Next.js 14 App Router, Tailwind, TypeScript, Lucide icons
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Row Level Security)
- **Auth:** Google OAuth + Magic Link email, role-based access
- **Realtime:** All boards auto-update across users via Supabase channels
- **Automation:** Database triggers handle Sales→Onboarding→Production flow

## Roles

| Role | Access | Edit | Delete | Manage Users |
|------|--------|------|--------|-------------|
| Admin | All boards | Yes | Yes | Yes |
| Editor | Production, Publishing, Activity | Own clients | No | No |
| Social | Publishing, Activity | Status only | No | No |
| Viewer | Dashboard, Production, Publishing | No | No | No |

## Team

| Name | Email | Role |
|------|-------|------|
| Angel | angelguerrero1999@gmail.com | Admin |
| Santiago | viralvisionmk@gmail.com | Admin |
| Jenina | jeninalopezz@gmail.com | Admin |
| Sergio | storres1524@gmail.com | Editor |
| Rodrigo | jrbp.contato@gmail.com | Editor |
| Alex | alex10soccer2@gmail.com | Editor |
| Araceli | ariech0608@gmail.com | Editor |
| Guido | guidostorchdesign@gmail.com | Social |

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Deploy
