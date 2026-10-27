# LearnWise AI — AI-Based Personalized Learning Content Generator

LearnWise AI is an adaptive, closed-loop educational web application engineered for artificial intelligence and machine learning academic demonstrations. It generates personalized learning modules, diagnostic quizzes, and adaptive difficulty recommendations based on demonstrated student comprehension.

The application follows the mastery learning loop:
**LEARN → PRACTICE → EVALUATE → ADAPT → LEARN AGAIN**

---

## Key Features

1. **Multi-Tier Content Personalization**: Same topic produces distinct depth, tone, and code complexity across **Beginner**, **Intermediate**, and **Advanced** proficiency levels.
2. **Server-Authoritative Quiz Engine**: 5-question multiple choice quizzes with answer keys guarded strictly on the backend (prevents client inspect-element cheating).
3. **Deterministic Adaptive Difficulty**:
   - `0% – 39%`: Demote one proficiency tier to rebuild prerequisite understanding.
   - `40% – 69%`: Maintain current tier and reinforce emerging concepts.
   - `70% – 84%`: Advance one tier for higher-order reasoning.
   - `85% – 100%`: Advance with challenge and complexity designations.
4. **Weak Concept Injection**: Incorrect quiz answers identify concept tags that are automatically injected into subsequent lesson generation prompts.
5. **Interactive Lesson Refinement**:
   - One-click "Explain Simpler" generates intuitive real-world analogies.
   - One-click "Expand in Depth" generates formal asymptotic Big-O and memory cache breakdowns.
   - Download lesson as Markdown or Print/Export to PDF.
6. **Progress Visualization**: Interactive Recharts trajectory tracking student score evolution and topic-wise mastery over time.
7. **Complete Documentation Suite**: Full academic report, prompt designs, database schemas, and sample outputs in `/docs`.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts.
- **Backend (Live Preview)**: Node.js Express full-stack proxy on port 3000 running official Google Gen AI SDK (`@google/genai`) and persistent JSON/SQLite store.
- **Backend (Python Standalone)**: Python 3.11+, FastAPI, SQLAlchemy, Pydantic v2, Google Gen AI Python SDK (`google-genai`), Pytest.
- **Database**: PostgreSQL 16 (production/Docker) & SQLite (local development).
- **AI Model**: Google Gemini `gemini-3.8-flash`.

---

## Quick Start (Live Preview)

The live application is preconfigured with full server-side proxying and database persistence:

```bash
# Install dependencies
npm install

# Start full-stack server on port 3000
npm run dev
```

Visit `http://localhost:3000`. You can click **"Launch Demo Student"** to instantly sign in with pre-seeded data for "Python loops and iteration".

---

## Standalone Python FastAPI Backend Setup

To run the Python backend independently:

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
export GEMINI_API_KEY="your-gemini-api-key"
export DATABASE_URL="sqlite:///./learnwise.db"  # Or postgresql://...

# Run FastAPI with live reload on port 8000
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

The interactive OpenAPI Swagger documentation will be available at:
`http://localhost:8000/api/docs`

---

## Docker Compose Deployment

To launch the complete multi-container stack (PostgreSQL + FastAPI Backend + React Frontend):

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API & Docs: `http://localhost:8000/api/docs`
- PostgreSQL: Port `5432`

---

## Running Backend Test Suites

```bash
cd backend
pytest tests/ -v
```

This verifies:
- All 8 adaptive threshold boundaries (0%, 39%, 40%, 69%, 70%, 84%, 85%, 100%)
- Server-authoritative scoring calculations
- JWT authentication and bcrypt password hashing
- Pydantic schema validation

---

## Project Structure

```
├── .data/                  # Persistent SQLite/JSON storage for preview
├── backend/                # Standalone Python FastAPI backend
│   ├── app/
│   │   ├── api/            # REST API routers (auth, lessons, quizzes, progress)
│   │   ├── core/           # Configuration and security utilities
│   │   ├── db/             # SQLAlchemy engine and session
│   │   ├── models/         # Database models (users, lessons, quizzes, attempts)
│   │   ├── prompts/        # Documented Gemini learning prompts
│   │   ├── schemas/        # Pydantic v2 request/response schemas
│   │   ├── services/       # Gemini AI service & Adaptive engine
│   │   └── main.py         # FastAPI application entry point
│   ├── tests/              # Pytest unit & boundary tests
│   ├── Dockerfile
│   └── requirements.txt
├── docs/                   # Complete academic documentation
│   ├── ARCHITECTURE.md     # Architecture & Mermaid sequence diagrams
│   ├── PROMPT_DESIGN.md    # Prompt engineering & JSON schemas
│   ├── DATABASE_SCHEMA.md  # Relational ER diagrams & constraints
│   ├── API_DOCUMENTATION.md# REST API endpoint reference
│   ├── TESTING.md          # Test methodology & threshold matrix
│   └── SAMPLE_OUTPUTS.md   # Beginner/Intermediate/Advanced sample outputs
├── src/                    # React 19 TypeScript frontend
│   ├── components/         # Dashboard, LessonViewer, QuizEngine, Generator, etc.
│   ├── context/            # Authentication & session context
│   ├── services/           # Frontend API client
│   ├── types.ts            # TypeScript interfaces
│   ├── App.tsx             # Application router
│   └── main.tsx            # React DOM root
├── server.ts               # Express full-stack proxy & Gemini integration
├── docker-compose.yml      # Multi-container orchestration
└── package.json
```
