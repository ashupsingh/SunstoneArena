# SyntaxError — Smart Campus Management System (ADTU)

> A full-stack, multi-platform campus management system built for **Assam down town University (ADTU)** that digitises academic scheduling, real-time crowd monitoring, event management, bus tracking, and campus navigation — replacing fragmented manual processes with a single unified platform.

---

## Table of Contents

- [Problem Statement and Objective](#problem-statement-and-objective)
- [Gap Analysis — Current vs Proposed Solution](#gap-analysis--current-vs-proposed-solution)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Setup and Execution Steps](#setup-and-execution-steps)
- [Environment Variables](#environment-variables)
- [Live Deployments](#live-deployments)
- [Future Scope](#future-scope)
- [Limitations](#limitations)
- [License](#license)

---

## Problem Statement and Objective

### Problem Statement

Modern university campuses like ADTU manage thousands of students and faculty across multiple blocks, departments, labs, food courts, and transportation routes. Currently, these operations rely on **fragmented, manual, and disconnected systems**:

- **Class schedules** are shared via paper notices or scattered WhatsApp groups, leading to confusion when changes occur.
- **Attendance tracking** is done via manual roll calls or static registers, which are time-consuming, error-prone, and susceptible to proxy attendance.
- **Crowd congestion** at food courts, libraries, and labs is unpredictable — students have no way to know real-time occupancy before visiting.
- **Campus bus routes and timings** are not accessible digitally; students rely on word-of-mouth and hand-written schedules.
- **Events and notices** are communicated haphazardly through multiple channels with no centralised platform.
- **Teacher-student communication** around schedules, cancellations, and rescheduling has no formal digital channel.

These inefficiencies result in **wasted time, missed classes, overcrowding, lost notices, and poor resource utilisation** across the campus.

### Objective

Build **SyntaxError** — a unified, real-time, multi-platform Smart Campus Management System that:

1. **Digitises academic scheduling** with automated timetable management for students and teachers.
2. **Enables real-time crowd monitoring** across campus locations (food courts, libraries, labs).
3. **Streamlines attendance management** with QR-based and BLE-proximity-based systems.
4. **Provides campus bus tracking** with route and timing information.
5. **Centralises event management** with creation, RSVP, and push notification support.
6. **Delivers a role-based experience** — separate dashboards and capabilities for Students, Teachers, and Super Admins.
7. **Works on both web and mobile** — accessible from any device, anywhere on campus.

---

## Gap Analysis — Current vs Proposed Solution

| Aspect | Current System (Manual / Fragmented) | Proposed System (SyntaxError) |
|---|---|---|
| **Schedule Management** | Paper notices, WhatsApp groups; no version control on changes | Dynamic timetable with real-time updates, conflict detection, and teacher-initiated rescheduling |
| **Attendance Tracking** | Manual roll calls; proxy-prone | QR-code-based sessions with time-limited, rotating codes; BLE proximity verification |
| **Crowd Monitoring** | No visibility; students walk to a crowded food court and waste time | Real-time occupancy data for every campus location (food courts, libraries, labs) |
| **Bus Information** | Word-of-mouth; static paper timetables | Digital bus routes with stop details and timings accessible on mobile |
| **Event Management** | Scattered posters and group messages | Centralised event creation, browsing, RSVP, and push notifications |
| **Campus Navigation** | Physical signage; new students struggle to find locations | Block-wise campus map with categorised locations (halls, labs, food courts) |
| **Notifications** | No unified channel; important updates get lost | Centralised push notification system with role-based targeting |
| **Admin Control** | Spreadsheets; no oversight dashboard | Super Admin panel with user management, department control, approval workflows |
| **Multi-Platform Access** | Desktop-only portals (if any) | Responsive web app + native Android app with shared backend |
| **Security** | Shared passwords; no 2FA | OTP-based two-factor authentication, JWT tokens, rate limiting, input sanitisation |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client Applications                         │
│                                                                     │
│  ┌──────────────────────┐          ┌──────────────────────────┐     │
│  │    Web Application   │          │    Mobile Application    │     │
│  │    (Next.js 16)      │          │    (Expo / React Native) │     │
│  │                      │          │                          │     │
│  │  • Landing Page      │          │  • Student Dashboard     │     │
│  │  • Student Dashboard │          │  • Teacher Dashboard     │     │
│  │  • Teacher Panel     │          │  • Schedule Viewer       │     │
│  │  • Super Admin Panel │          │  • Campus Live (Crowd)   │     │
│  │  • Auth (Login/      │          │  • Events & RSVP         │     │
│  │    Signup/Forgot PW) │          │  • Bus Routes            │     │
│  └──────────┬───────────┘          │  • Attendance (QR/BLE)   │     │
│             │                      │  • Profile Management    │     │
│             │                      └────────────┬─────────────┘     │
│             │                                   │                   │
└─────────────┼───────────────────────────────────┼───────────────────┘
              │         HTTPS (REST API)          │
              └───────────────┬───────────────────┘
                              │
              ┌───────────────▼───────────────────┐
              │        Backend API Server          │
              │     (Node.js + Express 5 + TS)     │
              │                                    │
              │  ┌────────────────────────────┐    │
              │  │      Middleware Layer       │    │
              │  │  • CORS (dynamic origins)  │    │
              │  │  • Helmet (security hdrs)  │    │
              │  │  • Rate Limiting           │    │
              │  │  • JWT Authentication      │    │
              │  │  • Zod Validation          │    │
              │  │  • NoSQL Injection Guard   │    │
              │  └────────────────────────────┘    │
              │                                    │
              │  ┌────────────────────────────┐    │
              │  │      Route Modules         │    │
              │  │  • /api/auth               │    │
              │  │  • /api/schedules          │    │
              │  │  • /api/crowd              │    │
              │  │  • /api/events             │    │
              │  │  • /api/bus                │    │
              │  │  • /api/notifications      │    │
              │  │  • /api/teacher            │    │
              │  │  • /api/admin              │    │
              │  │  • /api/departments        │    │
              │  │  • /api/campus             │    │
              │  │  • /api/realtime           │    │
              │  └────────────────────────────┘    │
              └──────────┬─────────┬───────────────┘
                         │         │
          ┌──────────────▼──┐  ┌───▼────────────────┐
          │   MongoDB Atlas │  │  External Services  │
          │   (Database)    │  │                     │
          │                 │  │  • Gmail SMTP (OTP) │
          │  Collections:   │  │  • Cloudinary (Img) │
          │  • users        │  │  • Expo Push (PN)   │
          │  • schedules    │  │  • Vercel (Hosting) │
          │  • events       │  └────────────────────┘
          │  • crowdstatus  │
          │  • busroutes    │
          │  • departments  │
          │  • notifications│
          │  • otps         │
          │  • attendance   │
          └─────────────────┘
```

### Workflow Overview

1. **Authentication**: Users register with email → OTP verification → account creation. Login uses password + OTP two-factor authentication. JWT tokens authorise subsequent requests.
2. **Schedule Management**: Teachers create/update schedules → system detects conflicts → students see updated timetables in real time.
3. **Attendance**: Teachers start a QR-based attendance session → QR codes rotate every 10 seconds → students scan within geofenced range → attendance is recorded.
4. **Crowd Monitoring**: Crowd density data is reported per location → students check live occupancy before visiting.
5. **Events**: Admins/teachers create events → students browse, RSVP, and receive push notifications.
6. **Admin Panel**: Super admins manage users, departments, approve teacher registrations, send campus-wide notices.

---

## Technology Stack

### Frontend — Web Application

| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework with App Router, SSR, and file-based routing |
| **React 19** | UI component library |
| **TypeScript** | Type-safe development |
| **Tailwind CSS 4** | Utility-first CSS framework |
| **Axios** | HTTP client for API communication |
| **Lucide React** | Icon library |
| **jwt-decode** | Client-side JWT token parsing |

### Frontend — Mobile Application

| Technology | Purpose |
|---|---|
| **Expo SDK 54** | Managed React Native development framework |
| **React Native 0.81** | Cross-platform native mobile UI |
| **Expo Router 6** | File-based routing for mobile navigation |
| **Expo Notifications** | Push notification support |
| **Expo Image Picker** | Camera and gallery integration for profile photos |
| **Expo Secure Store** | Encrypted local storage for auth tokens |
| **React Native BLE PLX** | Bluetooth Low Energy for proximity-based attendance |
| **Axios** | HTTP client for API communication |

### Backend — API Server

| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime for server-side execution |
| **Express 5** | Web framework for REST API routing |
| **TypeScript** | Type-safe server development |
| **Mongoose 9** | MongoDB ODM for schema modelling and queries |
| **Zod 4** | Runtime request validation and schema enforcement |
| **JWT (jsonwebtoken)** | Stateless authentication tokens |
| **bcrypt** | Password hashing (salted, adaptive cost) |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | Brute-force and DDoS protection |
| **CORS** | Cross-origin request control with dynamic origin whitelisting |
| **Nodemailer** | SMTP email delivery for OTP codes |
| **Multer** | Multipart file upload handling |
| **Cloudinary** | Cloud-based image storage and transformation |

### Database & Infrastructure

| Technology | Purpose |
|---|---|
| **MongoDB Atlas** | Cloud-hosted NoSQL database |
| **Vercel** | Serverless deployment for both API and web app |
| **EAS Build (Expo)** | Android APK/AAB build pipeline |
| **Turborepo** | Monorepo build orchestration and caching |
| **Gmail SMTP** | OTP email delivery transport |
| **Cloudinary CDN** | Profile image hosting and optimisation |

---

## Features

### Student Features
- 📅 View personalised class schedule (daily/weekly)
- 📱 Scan QR codes for attendance marking
- 📍 View real-time crowd status across campus locations
- 🚌 Browse campus bus routes and timings
- 🎉 Browse, RSVP, and save campus events
- 🔔 Receive push notifications for schedule changes and announcements
- 🏫 Navigate campus with block-wise location directory
- 👤 Manage profile with photo upload

### Teacher Features
- 📝 Create, update, and cancel class schedules
- 🔄 Reschedule classes with conflict detection
- ✅ Start QR-based attendance sessions with rotating codes
- 📊 View attendance reports per session
- 👥 View students list by department

### Super Admin Features
- 👤 Manage all users (approve teachers, flag/delete accounts)
- 🏛️ Manage departments (create, update, delete)
- 📢 Send campus-wide notifications
- 📋 Oversee all schedules and events

---

## Project Structure

```
arena-monorepo/
├── apps/
│   ├── api/                    # Backend REST API
│   │   ├── config/             # Database, email, cloudinary, push service configs
│   │   ├── controllers/        # Route handler logic (auth, schedule, events, etc.)
│   │   ├── middleware/         # Auth, validation, error handling, rate limiting
│   │   ├── models/            # Mongoose schema definitions
│   │   ├── routes/            # Express route definitions
│   │   ├── index.ts           # API entry point
│   │   └── vercel.json        # Vercel serverless deployment config
│   │
│   ├── web/                   # Next.js web application
│   │   ├── src/
│   │   │   ├── app/           # App Router pages (login, signup, dashboard, admin, etc.)
│   │   │   ├── components/    # Reusable UI components (Navbar, ProtectedRoute, Logo)
│   │   │   ├── context/       # React Context providers (AuthContext)
│   │   │   └── lib/           # Utilities (API client with Axios)
│   │   └── vercel.json        # Vercel deployment config
│   │
│   └── mobile/                # Expo React Native mobile app
│       ├── app/               # Expo Router screens
│       │   ├── (auth)/        # Login, signup, verification screens
│       │   ├── (tabs)/        # Tab navigation (Home, Schedule, Campus, Events, Profile)
│       │   ├── attendance.tsx  # QR attendance scanner
│       │   └── ...            # Additional screens
│       ├── components/        # Reusable mobile components
│       ├── config/            # API client configuration
│       ├── context/           # Auth and notification context providers
│       └── assets/            # Images, icons, splash screens
│
├── packages/
│   └── shared-types/          # Shared TypeScript type definitions
│
├── turbo.json                 # Turborepo pipeline configuration
├── package.json               # Root workspace configuration
└── README.md
```

---

## Setup and Execution Steps

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18 or higher |
| npm | 10 or higher |
| Git | Latest |
| MongoDB Atlas account | (or a local MongoDB instance) |
| Android device / emulator | For mobile app testing |

### 1. Clone the Repository

```bash
git clone https://github.com/ashupsingh/SunstoneArena.git
cd SunstoneArena
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies from the root
npm install
```

### 3. Configure Environment Variables

#### API (`apps/api/.env`)

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your-secret-jwt-key
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### Web (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

#### Mobile (`apps/mobile/.env`)

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Run the Applications

#### Option A: Run All Apps Together (Turborepo)

```bash
npm run dev
```

#### Option B: Run Individually

```bash
# Start the API server (runs on port 5000)
npm --workspace apps/api run dev

# Start the Web app (runs on port 3000)
npm --workspace apps/web run dev

# Start the Mobile app (requires Expo Go on your phone or an emulator)
cd apps/mobile
npx expo start
```

### 5. Build for Production

```bash
# Build web app
npm --workspace apps/web run build

# Build Android APK (requires EAS CLI and Expo account)
cd apps/mobile
npx eas build --platform android --profile preview
```

### 6. Deploy to Vercel

Both the API and web app are configured for Vercel deployment:

```bash
# Deploy API
cd apps/api
npx vercel --prod

# Deploy Web
cd apps/web
npx vercel --prod
```

> **Important:** Set all environment variables in the Vercel project dashboard under **Settings → Environment Variables** before deploying.

---

## Environment Variables

| Variable | Required | Used By | Description |
|---|---|---|---|
| `MONGO_URI` | ✅ | API | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | API | Secret key for JWT token signing |
| `GMAIL_USER` | ⚠️ | API | Gmail address for sending OTP emails |
| `GMAIL_APP_PASSWORD` | ⚠️ | API | Gmail App Password (not regular password) |
| `CLOUDINARY_CLOUD_NAME` | ❌ | API | Cloudinary cloud name for image uploads |
| `CLOUDINARY_API_KEY` | ❌ | API | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ❌ | API | Cloudinary API secret |
| `FRONTEND_URL` | ❌ | API | Frontend URL for CORS whitelist |
| `CORS_ORIGINS` | ❌ | API | Comma-separated additional CORS origins |
| `NEXT_PUBLIC_API_URL` | ❌ | Web | API base URL (defaults to localhost:5000) |
| `EXPO_PUBLIC_API_URL` | ❌ | Mobile | API base URL for mobile client |

✅ = Required &nbsp; ⚠️ = Required for full functionality &nbsp; ❌ = Optional

---

## Live Deployments

| Platform | URL |
|---|---|
| 🌐 Web App | [web-three-beta-47.vercel.app](https://web-three-beta-47.vercel.app) |
| ⚙️ API Server | [arena-api-lovat.vercel.app/api](https://arena-api-lovat.vercel.app/api) |
| 📱 Android APK | [Download APK](https://expo.dev/artifacts/eas/8PiMGYXSrmhQ7QEv2ud9ns.apk) |

---

## Future Scope

1. **IoT-Based Crowd Monitoring** — Integrate hardware sensors (IR counters, Wi-Fi probe analytics) at campus locations for automatic, real-time crowd density measurement instead of manual reporting.

2. **AI-Powered Timetable Optimisation** — Use machine learning algorithms to auto-generate conflict-free timetables that optimise room utilisation, teacher preferences, and student course loads.

3. **Indoor Navigation & Mapview** — Implement interactive campus maps with turn-by-turn indoor navigation using BLE beacons for wayfinding inside buildings.

4. **Biometric Attendance Integration** — Extend the attendance system to support fingerprint and facial recognition for higher security alongside the existing QR and BLE methods.

5. **Learning Management System (LMS) Module** — Add course material sharing, assignment submission, grade tracking, and discussion forums to transform the platform into a comprehensive academic portal.

6. **Analytics & Reporting Dashboard** — Provide institutional analytics on attendance patterns, campus utilisation trends, event engagement metrics, and student activity insights for administrators.

7. **iOS Application** — Extend mobile support to iOS with an App Store release using the existing Expo/React Native codebase.

8. **Multi-Language Support** — Add internationalisation (i18n) to support Assamese, Hindi, and other regional languages alongside English.

9. **Chat & Communication Module** — Implement real-time messaging between students and teachers with file sharing, announcements, and discussion channels.

10. **Payment Gateway Integration** — Add online fee payment, canteen wallet top-up, and event ticket purchase capabilities.

---

## Limitations

1. **Internet Dependency** — The system requires an active internet connection for all features; offline functionality is not currently supported.

2. **Android Only (Mobile)** — The mobile app is currently built and distributed as an Android APK. iOS builds are possible via Expo but are not yet published to the App Store.

3. **Manual Crowd Reporting** — Crowd density data relies on manual API updates rather than automated hardware sensors, introducing potential inaccuracy.

4. **Email-Based OTP Only** — Two-factor authentication currently supports only email-based OTP; SMS-based OTP is not implemented.

5. **Single University Scope** — The system is designed and configured specifically for ADTU. Multi-tenant support for other institutions would require architectural changes.

6. **No Offline Caching** — Schedule and event data is not cached locally; the app does not function without network access.

7. **Limited Accessibility Testing** — Screen reader support and WCAG compliance have not been formally audited.

8. **Vercel Cold Starts** — The API runs on Vercel Serverless Functions, which may experience cold start latency (1–3 seconds) after periods of inactivity.

---

## License

This project is developed as part of an academic initiative at **Assam down town University (ADTU)**.

---

<p align="center">
  Built with ❤️ by the SyntaxError Team — ADTU
</p>
