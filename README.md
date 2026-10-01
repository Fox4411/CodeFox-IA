# CodeFox

AI co-builder focused on finishing real projects.

## Features

- Login / registro (Supabase)
- Modes: Plan · Build · Review · Ship
- Multi-file projects
- Create files from AI code blocks
- HTML live preview
- Checklist + templates
- Export project

## Setup

```bash
npm install
cp .env.example .env.local
```

### 1) IA (Groq)

```env
OPENAI_API_KEY=gsk_...
```

### 2) Login (Supabase)

1. Crea proyecto gratis en https://supabase.com
2. Settings → API → copia URL y anon key
3. En `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

4. Authentication → Providers → Email habilitado
5. (Opcional) desactiva "Confirm email" mientras pruebas

```bash
npm run dev
```

Open http://localhost:3000
