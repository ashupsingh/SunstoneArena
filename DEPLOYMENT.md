# Deployment Guide

## 1) Pre-Deployment Safety Checks

Run from repo root:

```bash
npm install
npm run build
```

Run mobile checks:

```bash
cd apps/mobile
npm install
npm run typecheck
```

## 2) Web Deploy (Vercel CLI)

### Required env var
- `NEXT_PUBLIC_API_URL` = your Render backend API URL with `/api` suffix
  - Example: `https://arena-api.onrender.com/api`

### Deploy commands
From `apps/web`:

```bash
npm install
npx vercel login
npx vercel env add NEXT_PUBLIC_API_URL production
npx vercel --prod
```

Optional link command (first time):

```bash
npx vercel link
```

## 3) Backend Deploy (Render)

This repo includes `render.yaml` at root for Blueprint deployment.

### Option A: Render Blueprint (recommended)
1. Push code to GitHub.
2. In Render, create a new Blueprint from repo.
3. Render reads `render.yaml` and provisions API service.

### Option B: Manual service setup
- Root directory: `apps/api`
- Build command: `npm install`
- Start command: `npm run start`

### Required backend env vars
- `JWT_SECRET`
- `MONGO_URI`
- `FRONTEND_URL` (Vercel app URL)
- `CORS_ORIGINS` (comma-separated additional origins if needed)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

## 4) Mobile APK Build (EAS)

`apps/mobile/eas.json` is configured.

### Required env var for app runtime
- `EXPO_PUBLIC_API_URL` = your Render backend API URL with `/api`
  - Example: `https://arena-api.onrender.com/api`

### Build APK
From `apps/mobile`:

```bash
npm install
npx eas login
npx eas build --platform android --profile preview
```

Or using scripts:

```bash
npm run build:apk
```

For Play Store bundle:

```bash
npm run build:aab
```

## 5) Post-Deploy Smoke Checklist

- Web login/signup works.
- Student dashboard loads schedules/events/notices.
- Teacher can create notice and student sees it.
- Attendance session start works on mobile.
- BLE attendance can auto-mark students.
- Notification badges clear after opening notification popup.

## 6) Operational Safeguards Already Added

- API trust proxy enabled for hosted environments.
- NoSQL payload sanitization enabled.
- CORS origins support environment-based list (`CORS_ORIGINS`).
- Mobile API base URL now environment-driven (`EXPO_PUBLIC_API_URL`).
