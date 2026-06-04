# SpawnOS — OpenAI Setup Guide

SpawnOS uses OpenAI to power the AI Tank Blueprint Generator at `/blueprints`.

---

## How It Works

The blueprint generator is a **server-side API route** at `src/app/api/blueprint/route.ts`.

- The OpenAI API key is **never exposed to the client**
- All AI calls happen on the server via `POST /api/blueprint`
- If `OPENAI_API_KEY` is not set, the generator returns a clearly labeled mock blueprint for local development

---

## Setup

### 1. Get an OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account or sign in
3. Navigate to **API Keys** → **Create new secret key**
4. Copy the key (starts with `sk-...`)

### 2. Add to Environment Variables

In your `.env.local`:

```
OPENAI_API_KEY=sk-your-key-here
```

For Vercel deployment:

1. Go to your Vercel project → **Settings → Environment Variables**
2. Add `OPENAI_API_KEY` with your key value
3. Redeploy

---

## Model Used

The blueprint generator uses **GPT-4o mini** (`gpt-4o-mini`).

- Fast response times (~3–8 seconds)
- JSON mode enforced via `response_format: { type: 'json_object' }`
- System prompt explicitly instructs the model to return only valid JSON

To switch to a more capable model, edit `src/app/api/blueprint/route.ts`:

```ts
model: 'gpt-4o', // instead of 'gpt-4o-mini'
```

---

## Mock Mode

Without `OPENAI_API_KEY`, the generator returns a hardcoded mock blueprint.

The mock response is clearly labeled with:
- `mockMode: true` in the API response
- A yellow warning banner in the UI

This allows full local development and testing of the UI without an API key.

---

## Cost Estimate

At GPT-4o mini pricing (~$0.15 / 1M input tokens, ~$0.60 / 1M output tokens):

- Each blueprint generation: ~800–1200 input tokens + ~600–900 output tokens
- Approximate cost per generation: **~$0.001** (less than a tenth of a cent)

---

## Rate Limiting

No rate limiting is currently implemented on the `/api/blueprint` route. For production deployment with public traffic:

1. Add request rate limiting via Vercel Edge Middleware or a middleware layer
2. Consider adding a Turnstile/CAPTCHA to the form before making the API call
3. Optionally require authentication (Supabase session) to use the generator

---

## Security

✅ `OPENAI_API_KEY` is a server-only environment variable — no `NEXT_PUBLIC_` prefix  
✅ The key is only accessed in `src/app/api/blueprint/route.ts` (server route)  
✅ The client never receives or can access the key  
✅ Input validation rejects invalid tank sizes and missing required fields  
✅ JSON parsing is wrapped in try/catch to handle malformed AI responses gracefully  
