# PrepMate — Solution Overview

AI-powered interview preparation platform. Users paste a job description, upload their CV, select an industry, and receive plain-English explanations of the technical concepts they need to know — tailored to their background.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | .NET 9, Clean Architecture, CQRS + MediatR 12 |
| Database | PostgreSQL (via Docker or local), EF Core 9 + Npgsql |
| AI (dev / free tier) | Groq API — Llama 3.3 70B |
| AI (paid tier) | Anthropic Claude (claude-haiku / claude-opus) |
| Auth | JWT Bearer + BCrypt + Google OAuth |
| PDF extraction | PdfPig (server-side) |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| State | TanStack Query v5 |
| Routing | React Router v7 |

---

## Project Structure

```
PrepMate/
├── src/
│   ├── PrepMate.Domain/          # Entities, enums, interfaces — zero external deps
│   ├── PrepMate.Application/     # CQRS commands/queries, validators, behaviors
│   ├── PrepMate.Infrastructure/  # EF Core, repositories, AI services, JWT, Google OAuth
│   └── PrepMate.API/             # Controllers, middleware, Program.cs
├── client/                       # React frontend (Vite)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/api.ts
│   │   ├── contexts/AuthContext.tsx
│   │   └── types/api.ts
│   ├── .env.local                # gitignored — local secrets
│   └── .env.example
├── SOLUTION.md
├── RETENTION.md
└── PrepMate.sln
```

---

## Domain Entities

| Entity | Key fields |
|---|---|
| `User` | Id, Email, PasswordHash, FirstName, LastName, GoogleId |
| `CvDocument` | Id, UserId, FileName, FileContent (byte[]), ExtractedText, IsActive |
| `PrepSession` | Id, UserId, CvDocumentId, JobTitle, CompanyName, Industry, JobDescriptionText |
| `ConceptExplanation` | Id, SessionId, Topic, Question, PlainEnglishExplanation, TechnicalDepth, IndustryContext, SuggestedAnswer, Difficulty, OrderIndex |

---

## API Endpoints

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Email + password registration |
| POST | `/api/v1/auth/login` | Email + password login |
| POST | `/api/v1/auth/google` | Google OAuth (sends id_token from frontend) |

### CV
| Method | Route | Description |
|---|---|---|
| POST | `/api/v1/cv/upload` | Upload PDF — stored + text extracted |
| GET | `/api/v1/cv/active` | Get current user's active CV |

### Prep Sessions
| Method | Route | Description |
|---|---|---|
| POST | `/api/v1/prep-sessions` | Create session — triggers AI concept generation |
| GET | `/api/v1/prep-sessions` | List all sessions for current user |
| GET | `/api/v1/prep-sessions/{id}` | Get session detail with concepts |
| POST | `/api/v1/prep-sessions/extract-jd-text` | Extract text from uploaded JD PDF |

### Concepts
| Method | Route | Description |
|---|---|---|
| GET | `/api/v1/prep-sessions/{sessionId}/concepts` | Get all concepts for a session |

---

## AI Provider Strategy

Configured via `"AiProvider"` in `appsettings`:

```json
"AiProvider": "Groq"   // dev / free tier users
"AiProvider": "Claude" // paid subscribers
```

Both implement `IClaudeService`. Switch is in `Infrastructure/DependencyInjection.cs`.

| Provider | Model | Use case |
|---|---|---|
| Groq | `llama-3.3-70b-versatile` | Development, free-tier users |
| Claude Haiku | `claude-haiku-4-5-20251001` | Paid Prep tier |
| Claude Opus | `claude-opus-4-6` | Paid Pro tier |

---

## Auth Flow

1. **Email/password** — bcrypt hash stored, JWT issued on login
2. **Google OAuth** — frontend gets `credential` (id_token) via `@react-oauth/google`, sends to `/auth/google`, backend verifies with `Google.Apis.Auth`, auto-creates user on first login
3. JWT contains: `sub` (userId), `email`, `given_name`, `family_name`, `jti`
4. Access token: 8 hours · Refresh token: 30 days

---

## Local Dev Setup

### Prerequisites
- .NET 9 SDK
- Node.js 20+
- PostgreSQL on port 5433 (or Docker)
- Groq API key (free at console.groq.com)
- Google OAuth Client ID

### Backend
```bash
# appsettings.Development.json — fill in:
# Groq.ApiKey, Google.ClientId

cd src/PrepMate.API
dotnet run
# Listens on http://localhost:5050
# Applies EF migrations automatically on startup
```

### Frontend
```bash
# client/.env.local — fill in:
# VITE_GOOGLE_CLIENT_ID

cd client
npm install
npm run dev
# Runs on http://localhost:3000
```

### Database (local PostgreSQL)
```bash
psql -h localhost -p 5433 -U postgres -c "CREATE ROLE prepmate WITH LOGIN PASSWORD 'prepmate';"
psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE prepmate_dev OWNER prepmate;"
```

---

## Pricing Tiers (ZAR)

| Tier | Price | Sessions/mo | Concepts | AI Model |
|---|---|---|---|---|
| Free | R0 | 2 | 5 | Standard (Groq) |
| Prep | R89/mo · R890/yr | Unlimited | 10 | Standard |
| Pro | R179/mo · R1,790/yr | Unlimited | 10 | Priority (Claude) |
