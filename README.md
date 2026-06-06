# MentorsDaily ExamPrep Pro

Production-ready EdTech test series platform (Testbook / Adda247 / Oliveboard class) with full government exam ecosystem, personalized dashboard, 3-step onboarding, AI features, Razorpay, and enterprise admin panel.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Shadcn-style UI, Recharts, Zustand |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT + Google OAuth ready |
| Payments | Razorpay |
| Storage | Cloudinary |
| AI | OpenAI GPT-4o-mini |
| Email | Nodemailer |
| Deploy | Vercel (web) + AWS EC2 (API) |

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Edit MONGODB_URI and JWT secrets (min 32 chars)

# Seed exams (40+ govt exams) + admin
npm run seed:exams --workspace=@exam-prep/api
npm run promote-admin --workspace=@exam-prep/api

# Run dev (API + Web)
npm run dev
```

- **Web:** http://localhost:3000
- **API:** http://localhost:5000/api/v1/health

**Default admin (after seed):** `admin@examprep.com` / `Admin@123456`

## Project Structure

```
exam-prep-platform/
├── apps/
│   ├── api/                 # Express REST API
│   │   └── src/
│   │       ├── config/      # env, database
│   │       ├── models/      # MongoDB schemas (17 collections)
│   │       ├── controllers/
│   │       ├── services/    # AI, scoring, Razorpay, email
│   │       ├── middleware/
│   │       └── routes/
│   └── web/                 # Next.js 15 App Router
│       └── src/
│           ├── app/         # Pages (landing, dashboard, tests, admin...)
│           ├── components/
│           └── store/       # Zustand
├── packages/
│   └── shared/              # Types & constants
├── ARCHITECTURE.md
├── DEPLOYMENT.md
└── docs/AI_ARCHITECTURE.md
```

## Features Implemented

### Student
- Dashboard with stats, charts, AI recommendations
- Mock tests (timer, palette, mark for review, auto-submit, fullscreen)
- MCQ types: single, multiple, numerical (+ schema for match/assertion/paragraph)
- Result analysis with Recharts
- Leaderboard (global/weekly/monthly)
- Bookmarks, study materials, current affairs
- AI Mentor chat

### Admin
- Analytics dashboard (students, revenue, attempts)
- Question/test CRUD APIs
- Student management & ban
- Category/subject/topic management

### Platform
- 4-tier subscriptions + Razorpay checkout
- Gamification (points, streaks, achievements)
- Role-based access (student, instructor, admin, super_admin)

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register |
| POST | `/auth/login` | Login |
| POST | `/auth/google` | Google login |
| GET | `/dashboard/student` | Student dashboard |
| GET | `/tests` | List tests |
| POST | `/tests/:id/start` | Start attempt |
| PATCH | `/tests/attempts/:id/answer` | Save answer |
| POST | `/tests/attempts/:id/submit` | Submit test |
| GET | `/tests/results/:id` | Result + AI analysis |
| POST | `/payments/create-order` | Razorpay order |
| POST | `/ai/mentor/chat` | AI chat |
| GET | `/admin/dashboard` | Admin stats |

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design & scalability
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Vercel + EC2 guide
- [docs/AI_ARCHITECTURE.md](./docs/AI_ARCHITECTURE.md) — AI pipelines
- [docs/MENTORSDAILY_ENTERPRISE.md](./docs/MENTORSDAILY_ENTERPRISE.md) — v2.0 upgrade guide & roadmap

## v2.0 Highlights

- **40+ exams** across SSC, Banking, Railway, Police, Defence, Teaching, UPSC, State PCS
- **3-step registration** → multi-exam selection stored in profile
- **Personalized dashboard** — SSC CGL user sees SSC mocks, PYQ, CA, notes
- **OTP login**, referral/affiliate schemas, notification service (email/WhatsApp/in-app)
- **React Query** + **Framer Motion** on frontend

## License

Proprietary — All rights reserved.
