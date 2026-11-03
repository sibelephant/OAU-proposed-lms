# AtlasLMS - Obafemi Awolowo University LMS

**AtlasLMS** is a production LMS built by reverse-engineering UGA eLC and IU Canvas. It supports LTI 1.3 integration, weighted grading (UGA eLC system), release conditions, cross-listing, and SIS export (Athena/Banner).

## 🚀 Quick Start

### 1. Start PostgreSQL (Docker)

```bash
# Start PostgreSQL on port 15432
docker run -d --name atlas-lms-db \
  -e POSTGRES_DB=atlas_lms \
  -e POSTGRES_USER=atlas \
  -e POSTGRES_PASSWORD=atlas123 \
  -p 15432:5432 \
  postgres:16-alpine
```

### 2. Start the API Server

```bash
cd packages/api
DATABASE_URL="postgres://atlas:atlas123@localhost:15432/atlas_lm"
NODE_ENV=development
JWT_SECRET="atlas-lms-dev-secret-change-in-production-min-32chars"
ANTHROPIC_BASE_URL="https://openrouter.ai/api"
ANTHROPIC_AUTH_TOKEN="sk-or-v1-41dfe1e75f5c56bdb72d3d9e926f917c4c74f25f88171929a10b8f60e11e98"
CORS_ORIGIN="http://localhost:5173"

# Method A: Using pnpm exec tsx (development)
pnpm exec tsx src/server.ts

# Method B: Using node (after build)
pnpm build && node dist/server.js
```

The API will be available at `http://localhost:3000/health`

### 3. Start the Web Frontend

```bash
cd packages/web
VITE_API_URL="http://localhost:3000"
NODE_ENV=development

pnpm run dev
```

The web app will be available at `http://localhost:5173`

### 4. Seed the Database (optional but recommended)

```bash
# Set DATABASE_URL first, then:
DATABASE_URL="postgres://atlas:atlas123@localhost:15432/atlas_lm"
pnpm exec tsx packages/database/scripts/seed.ts
```

This populates:
- 2 academic units (Math, CS)
- 2 Athena term codes (202608 Harmattan, 202702 Rain)
- 1 instructor + 2 students
- 2 course shells with 2 sections each
- 8 enrollment records

### 5. Run E2E Tests

```bash
# Install Playwright browsers
pnpm exec playwright install

# Run tests
pnpm exec playwright test
```

Tests cover: health endpoint, login page, dashboard access, LTI launch, courses API, gradebook calculations, enrollment lookups, crosslist endpoints.

## 📦 Project Structure

```
atlas-lms/
├── packages/
│   ├── api/          # Hono JSON API (port 3000)
│   ├── auth/         # JWT service + LTI 1.3 service
│   ├── core-lms/     # Gradebook, enrollment, crosslist services
│   ├── database/     # Drizzle ORM + pg schema
│   └── web/          # React + TanStack Router frontend (port 5173)
├── .claude/          # Claude Code settings (OpenRouter config)
├── docker-compose.yml  # (optional) full-stack docker setup
└── turbo.json        # Monorepo task runner
```

## 🔧 Available Scripts

Root `package.json` scripts:
- `pnpm dev` - Start all packages in development (turbo)
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm test` - Test all packages

Package-specific scripts are in each `package.json`.

## 🐳 Docker Compose (Full Stack)

A `docker-compose.yml` is available that starts all services (API, Web, PostgreSQL) with proper dependency ordering. See the file at the project root for the full configuration.

## 📡 API Endpoints (Base: `/api/v1`)

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /courses` | List course shells |
| `POST /courses` | Create course shell (Instructor+ admin) |
| `GET /enrollments/sections/:sectionId` | Get section enrollments |
| `GET /gradebook/:shellId/calculate` | Calculate final grades |
| `POST /gradebook/:shellId/persist` | Persist final grades |
| `POST /crosslist` | Cross-list a section |
| `POST /crosslist/decrosslist` | Decross-list a section |
| `POST /lti/login` | LTI 1.3 login initiation |
| `POST /lti/launch` | LTI 1.3 launch validation |

## 👤 Default Seed Data

| Role | LoginId | OrgDefinedId | Email |
|------|---------|--------------|-------|
| Instructor | instructor1 | OAU\INSTR001 | instructor@oau.edu.ng |
| Student | student1 | OAU\STUD001 | student1@oau.edu.ng |
| Student | student2 | OAU\STUD002 | student2@oau.edu.ng |

## ⚠️ Known Notes

- Claude settings in `.claude/settings.json` are configured but not consumed by the current codebase. Set `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=0` if not using Anthropic gateway.
- Release condition evaluators have 7/10 stubs returning `false` - quiz_score, grade_threshold, assignment_submitted, and manual work; discussion_posted, content_viewed, checklist_completed, award_earned, competency_met, survey_completed are placeholders.
- LTI nonce/state stores are in-memory (10min/5min TTL). Replace with Redis for multi-node deployments.
- Free tier model `nvidia/nemotron-3.5-super-vl:free` is a vision-language model, not Claude.

## 📄 License

Private — Obafemi Awolowo University proposed LMS project.