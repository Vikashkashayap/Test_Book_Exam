# ExamPrep Pro — System Architecture

## Overview

Production-grade monorepo for an online test series platform (Testbook/Oliveboard-class). Two deployable apps share types via `@exam-prep/shared`.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│  Web (Next.js 15) · Mobile (future) · Admin browsers             │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / JWT
┌────────────────────────────▼────────────────────────────────────┐
│                    API GATEWAY LAYER                             │
│  Express.js · Helmet · CORS · Rate Limit · Cookie JWT            │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Auth Service  │   │ Test Engine   │   │ AI Service    │
│ JWT + Google  │   │ Attempt/Score │   │ OpenAI GPT    │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                  ┌─────────────────┐
                  │    MongoDB      │
                  │  (Mongoose ODM) │
                  └─────────────────┘
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  Razorpay            Cloudinary           Nodemailer
  (Payments)          (Media/PDF)          (Email)
```

## Role-Based Access Control (RBAC)

| Role         | Capabilities                                              |
|--------------|-----------------------------------------------------------|
| Student      | Tests, dashboard, bookmarks, AI mentor, payments          |
| Instructor   | Questions, tests, study materials, current affairs        |
| Admin        | + Students, categories, analytics, ban users                |
| Super Admin  | Full platform control                                     |

Middleware chain: `authenticate` → `authorize(roles)`.

## Core Domains

### 1. Test Engine
- **Test** → sections → question references
- **Attempt** → per-question answers, timer, palette states
- **Scoring** → negative marking, multi-type evaluation
- **Result** → rank/percentile, subject/topic breakdown
- Auto-submit on `expiresAt`

### 2. Subscription & Payments
- Plans: Free → Silver → Gold → Premium (feature gating via `requiredPlan`)
- Razorpay Orders → verify signature → activate `Subscription`

### 3. AI Layer
- **Post-test analysis**: GPT JSON → strengths, study plan, suggested tests
- **AI Mentor**: session-based chat with optional question context
- Fallback heuristics when `OPENAI_API_KEY` absent

### 4. Gamification
- Points on test completion
- Streak tracking on login
- Achievements with criteria engine

### 5. Leaderboards
- Aggregated from `Result` collection (global/weekly/monthly)
- Cron job (recommended) for materialized `Leaderboard` documents at scale

## MongoDB Collections

| Collection        | Purpose                          |
|-------------------|----------------------------------|
| users             | Auth, roles, subscription, gamification |
| subscriptions     | Plan lifecycle                   |
| tests             | Mock definitions                 |
| questions         | Question bank                    |
| questionbanks     | Grouped questions                |
| attempts          | In-progress/submitted sessions   |
| results           | Scored outcomes + AI analysis    |
| leaderboards      | Cached rankings (optional)       |
| bookmarks         | Saved questions + notes          |
| studymaterials    | PDFs, videos                     |
| currentaffairs    | CA articles                      |
| payments          | Razorpay audit trail             |
| notifications     | In-app alerts                    |
| achievements      | Badge definitions                |
| chatmessages      | AI mentor history                |
| examcategories    | Exam taxonomy                    |
| subjects / topics | Content hierarchy                |

## API Versioning

All routes under `/api/v1/*`.

## Scalability Recommendations

1. **Horizontal API scaling** — stateless Express behind ALB on EC2/ECS
2. **MongoDB** — replica set + read preference for analytics queries
3. **Redis** — attempt autosave, session cache, leaderboard cache
4. **Queue (Bull/SQS)** — AI analysis, email, leaderboard rebuild
5. **CDN** — Cloudinary + Vercel edge for static assets
6. **WebSockets** — live test proctoring (future)

## Security

- bcrypt password hashing (12 rounds)
- Short-lived access JWT + rotating refresh tokens
- HttpOnly cookies in production
- Razorpay HMAC verification
- Rate limiting on `/api`
- Question endpoints strip `correctAnswer` during attempts
