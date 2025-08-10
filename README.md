# Adaptaly Beta

Next.js + Supabase adaptive learning app.

## Tech Stack
- Next.js 15
- React 19
- TypeScript 5
- Tailwind CSS 4
- Supabase (@supabase/ssr v0.6, supabase-js v2)
- Deployment: Vercel

## New Project Structure

We reorganized the app for clarity, modularity, and scalability while preserving all routes and functionality.

### Before

```
app/
  api/
  auth/
  dashboard/
  emailsignup/
  signin/
  signup/
  layout.tsx
  page.tsx
src/
  lib/
styles/
  global.css
next.config.{js,mjs,ts}
postcss.config.{js,mjs}
gemini-cli/
```

### After

```
app/
  (auth)/
    auth/callback/route.ts
    emailsignup/
    signin/
    signup/
  (protected)/
    dashboard/
  (marketing)/
    page.tsx
  api/
    auth/email-exists/route.ts
    signout/route.ts
  globals.css
  layout.tsx

src/
  lib/

next.config.ts
postcss.config.js
```

Notes:
- We used Next.js Route Groups `(auth)`, `(protected)`, `(marketing)` to group concerns without changing URLs. All routes continue to resolve at the same paths (e.g., `/signin`, `/signup`, `/dashboard`).
- Global stylesheet moved from `styles/global.css` to `app/globals.css` and the import in `app/layout.tsx` was updated accordingly.
- Duplicate configuration files were removed: `next.config.js`, `next.config.mjs`, and `postcss.config.mjs`.
- Removed unused empty `gemini-cli/` folder.

## Why this is better
- Clear separation of concerns via route groups improves maintainability and scale.
- Single source of truth for Next.js config (`next.config.ts`) and PostCSS (`postcss.config.js`).
- Co-located global styles with the App Router for Next.js best practices.
- Reduced clutter by removing duplicates and unused folders.

## Navigation guide
- Pages and API routes live under `app/` using the App Router.
- Auth-centric routes are under `app/(auth)/` and protected pages under `app/(protected)/`.
- Shared clients/servers for Supabase live in `src/lib/` and are imported via path aliases like `@/lib/supabaseServer`.

## Environment variables
Ensure the following environment variables are set in Vercel and local `.env` (not committed):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `NEXT_PUBLIC_SITE_URL` (e.g., `https://www.adaptaly.com`)

## Development
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm run start`
