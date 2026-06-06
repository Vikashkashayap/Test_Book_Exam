# Complete Folder Structure

```
Test_Book_Code/
├── package.json
├── README.md
├── ARCHITECTURE.md
├── DEPLOYMENT.md
├── FOLDER_STRUCTURE.md
├── .gitignore
├── docs/
│   └── AI_ARCHITECTURE.md
├── packages/
│   └── shared/
│       ├── package.json
│       └── src/
│           ├── index.ts
│           ├── constants.ts
│           └── types.ts
└── apps/
    ├── api/
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── .env.example
    │   └── src/
    │       ├── server.ts
    │       ├── config/
    │       │   ├── env.ts
    │       │   └── database.ts
    │       ├── models/
    │       │   ├── User.ts
    │       │   ├── Subscription.ts
    │       │   ├── ExamCategory.ts
    │       │   ├── Subject.ts
    │       │   ├── Topic.ts
    │       │   ├── Question.ts
    │       │   ├── QuestionBank.ts
    │       │   ├── Test.ts
    │       │   ├── Attempt.ts
    │       │   ├── Result.ts
    │       │   ├── Leaderboard.ts
    │       │   ├── Bookmark.ts
    │       │   ├── StudyMaterial.ts
    │       │   ├── CurrentAffair.ts
    │       │   ├── Payment.ts
    │       │   ├── Notification.ts
    │       │   ├── Achievement.ts
    │       │   ├── ChatMessage.ts
    │       │   └── index.ts
    │       ├── controllers/
    │       │   ├── auth.controller.ts
    │       │   ├── test.controller.ts
    │       │   ├── dashboard.controller.ts
    │       │   ├── payment.controller.ts
    │       │   ├── ai.controller.ts
    │       │   ├── admin.controller.ts
    │       │   ├── leaderboard.controller.ts
    │       │   ├── bookmark.controller.ts
    │       │   └── content.controller.ts
    │       ├── services/
    │       │   ├── scoring.service.ts
    │       │   ├── ai.service.ts
    │       │   ├── razorpay.service.ts
    │       │   ├── email.service.ts
    │       │   ├── cloudinary.service.ts
    │       │   └── gamification.service.ts
    │       ├── middleware/
    │       │   ├── auth.ts
    │       │   └── errorHandler.ts
    │       ├── routes/
    │       │   ├── index.ts
    │       │   ├── auth.routes.ts
    │       │   ├── test.routes.ts
    │       │   ├── dashboard.routes.ts
    │       │   ├── payment.routes.ts
    │       │   ├── ai.routes.ts
    │       │   ├── admin.routes.ts
    │       │   ├── leaderboard.routes.ts
    │       │   ├── bookmark.routes.ts
    │       │   └── content.routes.ts
    │       ├── utils/
    │       │   ├── ApiError.ts
    │       │   ├── asyncHandler.ts
    │       │   └── jwt.ts
    │       └── scripts/
    │           └── seed.ts
    └── web/
        ├── package.json
        ├── tsconfig.json
        ├── next.config.ts
        ├── tailwind.config.ts
        ├── postcss.config.mjs
        ├── .env.example
        └── src/
            ├── app/
            │   ├── layout.tsx
            │   ├── globals.css
            │   ├── page.tsx                    # Landing
            │   ├── pricing/page.tsx
            │   ├── (auth)/
            │   │   ├── login/page.tsx
            │   │   └── register/page.tsx
            │   └── (app)/
            │       ├── layout.tsx
            │       ├── dashboard/page.tsx
            │       ├── tests/
            │       │   ├── page.tsx
            │       │   └── [id]/attempt/page.tsx
            │       ├── results/[id]/page.tsx
            │       ├── leaderboard/page.tsx
            │       ├── ai-mentor/page.tsx
            │       ├── bookmarks/page.tsx
            │       ├── study-materials/page.tsx
            │       ├── current-affairs/page.tsx
            │       ├── profile/page.tsx
            │       └── admin/page.tsx
            ├── components/
            │   ├── ui/                         # Shadcn-style
            │   ├── layout/
            │   ├── dashboard/
            │   ├── test/
            │   └── providers/
            ├── lib/
            │   ├── api.ts
            │   └── utils.ts
            └── store/
                ├── auth.store.ts
                └── test-attempt.store.ts
```
