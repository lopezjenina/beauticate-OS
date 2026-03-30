# Agency OS - Deployment Guide

## Prerequisites

- GitHub account
- Vercel account (connected to GitHub)
- Supabase project
- Cloudflare account (for DNS)

---

## Step 1: Push to GitHub

```bash
cd agency-os
git init
git add .
git commit -m "Initial commit - Agency OS"
git remote add origin https://github.com/YOUR_USERNAME/agency-os.git
git push -u origin main
```

---

## Step 2: Set Up Supabase

1. Go to supabase.com and open your project
2. Navigate to SQL Editor
3. Paste the contents of `supabase-schema.sql` and run it
4. Go to Settings > API and copy your Project URL and anon/public key

---

## Step 3: Deploy to Vercel

1. Go to vercel.com/dashboard
2. Click "Add New Project"
3. Import your `agency-os` GitHub repo
4. Set Framework Preset to "Next.js"
5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click "Deploy"

---

## Step 4: Connect Domain (viralvisionmk.space)

### Option A: Cloudflare DNS (recommended)

1. In Vercel, go to your project Settings > Domains
2. Add `viralvisionmk.space`
3. Vercel will show you the required DNS records
4. In Cloudflare, add a CNAME record:
   - Name: `@`
   - Target: `cname.vercel-dns.com`
   - Proxy status: DNS only (gray cloud)
5. Wait for DNS propagation (usually a few minutes)

### Option B: If using Vercel DNS

1. In your domain registrar, point nameservers to Vercel
2. Follow the prompts in Vercel's domain settings

---

## Step 5: Set Up Sentry (Error Tracking)

1. Create a Sentry account at sentry.io
2. Create a new Next.js project
3. Install the SDK:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```
4. Add your Sentry DSN to Vercel environment variables:
   - `SENTRY_DSN` = your Sentry DSN
   - `SENTRY_AUTH_TOKEN` = your Sentry auth token

---

## Environment Variables Summary

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Settings > API |
| `SENTRY_DSN` | Sentry > Project Settings > Client Keys |

---

## After Deployment

The app currently runs with mock data (defined in `src/lib/store.ts`). Once Supabase is connected, you can migrate to live data by replacing the useState initializers with Supabase queries. The schema in `supabase-schema.sql` matches the TypeScript types exactly.
