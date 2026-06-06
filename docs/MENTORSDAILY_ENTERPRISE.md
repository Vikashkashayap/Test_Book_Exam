# MentorsDaily ExamPrep Pro — Enterprise Upgrade v2.0

## What's New in Existing Project

### Platform
- Rebranded to **MentorsDaily ExamPrep Pro**
- Full **government exam ecosystem** (SSC, Banking, Railway, Police, Defence, Teaching, UPSC, State PCS)
- **3-step student registration** with multi-exam selection
- **Personalized dashboard** filtered by user's selected exams
- **OTP login** (dev mode logs OTP to console)
- **React Query** + **Framer Motion** on frontend

### New MongoDB Collections
| Collection | Purpose |
|------------|---------|
| `exams` | Individual exams (SSC CGL, UP Police, etc.) |
| `otpsessions` | OTP verification |
| `referrals` | Referral tracking |
| `affiliates` | Affiliate earnings & payouts |
| `permissions` | RBAC permissions |

### Updated `users` Schema
- `selectedExams`, `selectedExamSlugs`, `selectedCategorySlugs`
- `onboardingCompleted`, `onboardingStep`
- `xp`, `referralCode`, `referredBy`
- `preferences.notifications` → email/whatsapp/push/inApp
- `enterprise` subscription plan

### New API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/exams/ecosystem` | All exam categories & exams |
| GET | `/api/v1/exams/dashboard/personalized` | Exam-filtered dashboard |
| PATCH | `/api/v1/exams/selected` | Update selected exams |
| POST | `/api/v1/onboarding/step-1` | Register basic details |
| POST | `/api/v1/onboarding/step-2` | Select categories |
| POST | `/api/v1/onboarding/step-3` | Select exams & finish |
| POST | `/api/v1/auth/otp/send` | Send OTP |
| POST | `/api/v1/auth/otp/verify` | OTP login |

### Seed Commands
```bash
npm run seed:exams --workspace=@exam-prep/api
npm run promote-admin --workspace=@exam-prep/api
```

## Roadmap (Next Phases)

### Phase 2 — Test & Content
- Custom test builder API
- Sectional tests, practice sets
- Language switch in test UI
- Video & magazine models wired to admin upload

### Phase 3 — Growth
- Referral commission automation
- Affiliate payout workflow
- Razorpay coupons & referral credits
- WhatsApp Business API (MSG91/Interakt)

### Phase 4 — AI Suite
- AI Study Planner, Doubt Solver, Revision Planner
- Daily targets & motivation cron jobs

### Phase 5 — Super Admin
- Role & permission UI
- Global revenue analytics
- Instructor management

## Security Checklist
- [x] JWT + portal-separated login (student/admin)
- [x] RBAC middleware
- [x] Rate limiting
- [ ] Helmet CSP tuning for production
- [ ] Input sanitization on bulk uploads
- [ ] Redis session store at scale

## SEO
- Metadata on root layout with exam keywords
- OpenGraph tags
- Add `sitemap.ts` & `robots.ts` in Next.js app

## Deployment
See [DEPLOYMENT.md](../DEPLOYMENT.md) — no changes to Vercel + EC2 flow.
