# CodeFox

AI co-builder focused on finishing real projects.

## New in this version

- **Levels / ranks**: Novato → Builder → Shipper → Founder → Legend
- **XP** for real actions (files, checklist, preview, export, onboarding)
- **Daily streak**
- **Achievements**
- **Interactive onboarding**
- Login (Supabase)
- Multi-file + HTML preview

## Setup

```bash
npm install
cp .env.example .env.local
```

```env
OPENAI_API_KEY=gsk_...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

```bash
npm run dev
```

Deploy on Vercel with the same env vars, then Redeploy.
