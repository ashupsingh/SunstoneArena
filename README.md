# Arena Monorepo

Arena is a multi-app campus platform with:

- `apps/web`: Next.js web application
- `apps/mobile`: Expo React Native mobile app
- `apps/api`: Node.js + Express TypeScript backend API
- `packages/shared-types`: shared TypeScript types

## Live Deployments

- Web: https://web-three-beta-47.vercel.app
- API Base: https://arena-api-lovat.vercel.app/api
- Android APK: https://expo.dev/artifacts/eas/8PiMGYXSrmhQ7QEv2ud9ns.apk

## Monorepo Setup

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run Apps

```bash
# Web
npm --workspace apps/web run dev

# API
npm --workspace apps/api run dev

# Mobile
npm --workspace apps/mobile run start
```

## Environment Variables

No secrets are committed to this repository.

Create your own `.env` files locally for each app as needed. For API deployment, set variables such as:

- `MONGO_URI`
- `JWT_SECRET`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
