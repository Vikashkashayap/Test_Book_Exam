# AI Features Architecture

## Components

```
┌──────────────────┐     POST /ai/mentor/chat      ┌─────────────────┐
│  AI Mentor UI    │ ─────────────────────────────►│  ai.controller  │
└──────────────────┘                               └────────┬────────┘
                                                              │
┌──────────────────┐     After test submit          ┌────────▼────────┐
│  Result Page     │ ◄──────────────────────────────│   ai.service    │
└──────────────────┘                               └────────┬────────┘
                                                              │
                                                     ┌────────▼────────┐
                                                     │  OpenAI API     │
                                                     │  gpt-4o-mini    │
                                                     └─────────────────┘
```

## 1. AI Performance Analysis (Post-Test)

**Trigger:** `calculateAndSaveResult()` after attempt submission.

**Input:**
- Score, accuracy, correct/wrong/unattempted counts
- Subject-wise accuracy breakdown

**Output (stored in `Result.aiAnalysis`):**
- `strengths[]`
- `weaknesses[]`
- `improvementAreas[]`
- `studyPlan[]` (7-day steps)
- `suggestedTests[]` (ObjectIds)
- `suggestedTopics[]`

**Model:** `gpt-4o-mini` with `response_format: json_object`

**Fallback:** Rule-based analysis from subject stats when API key missing.

## 2. AI Mentor Chatbot

**Endpoints:**
- `POST /api/v1/ai/mentor/chat`
- `GET /api/v1/ai/mentor/history?sessionId=`

**Capabilities (system prompt):**
- Explain questions (with optional `questionId` context)
- Explain concepts
- Generate short notes
- Suggest exam strategy
- Daily motivation

**Persistence:** `ChatMessage` collection with `sessionId` for conversation continuity.

## Cost & Rate Controls

- Max tokens: 500 (chat), 800 (analysis)
- Per-user rate limit recommended: 20 messages/hour
- Premium plan gating for unlimited AI chat

## Future Enhancements

1. **RAG pipeline** — embed question bank + notes in vector DB (Pinecone/pgvector)
2. **Question explanation on-demand** from result review page
3. **Adaptive test generation** — weak topics → auto mock composition
4. **Voice mentor** — Whisper + TTS
