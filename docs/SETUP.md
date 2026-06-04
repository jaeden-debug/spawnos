# SpawnOS V1 — Setup Guide

SpawnOS is a Next.js 15 application backed by Supabase. Follow these steps to get it running locally and deploy to Vercel.

---

## Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) account
- A [Vercel](https://vercel.com) account (for deployment)

---

## Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose a name (e.g. `spawnos`), set a strong database password, and pick a region
4. Wait for the project to provision (~60 seconds)

---

## Step 2 — Run the Database Schema

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open `src/supabase/schema.sql` from this project
4. Paste the entire file contents into the SQL editor
5. Click **Run**

This creates all 8 tables, indexes, RLS policies, triggers, and the auto-profile-creation function.

---

## Step 3 — Get Your API Keys

1. Go to **Project Settings → API**
2. Copy:
   - **Project URL** (e.g. `https://xxxxxxxxxxxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

---

## Step 4 — Set Up Environment Variables (Local)

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

> Never commit `.env.local` to version control.

---

## Step 5 — Install Dependencies

```bash
npm install
```

---

## Step 6 — Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You should see the SpawnOS landing page. Click "Get Started" to create an account.

---

## Step 7 — (Optional) Set Up Fish Photo Storage

1. In Supabase Dashboard → **Storage**
2. Click **New Bucket**
3. Name it: `fish-photos`
4. Enable **Public bucket**
5. Go to **Policies** and add an upload policy for authenticated users

Fish photos can also be added via URL paste — storage upload is bonus functionality.

---

## Step 8 — Deploy to Vercel

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your repository
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**

Your SpawnOS instance will be live at your Vercel URL.

---

## Step 9 — (Optional) Custom Domain

In Vercel → Project Settings → Domains, add your custom domain.

---

## Notes

- All users are fully isolated via Supabase RLS — no user can access another user's data
- The genetics engine (Zylx.ai powered) runs entirely client-side — no extra API key needed
- Email confirmation may be required depending on your Supabase auth settings
