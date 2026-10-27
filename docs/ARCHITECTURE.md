# LearnWise AI — System Architecture & Academic Report

## 1. Abstract
LearnWise AI is an adaptive, AI-based personalized educational content generator designed for third-semester Artificial Intelligence and Machine Learning students and self-directed learners. Traditional educational media is static and homogeneous, unable to adjust to varied learning speeds or diagnose concept-specific knowledge gaps. LearnWise AI implements a closed-loop mastery framework: **LEARN → PRACTICE → EVALUATE → ADAPT → LEARN AGAIN**. By utilizing Google Gemini (`gemini-3.8-flash`), server-authoritative diagnostic scoring, and deterministic threshold-based adaptive progression, the system dynamically tunes the depth, language, and complexity of generated educational materials.

---

## 2. Problem Statement & Motivation
In contemporary higher education:
1. **One-Size-Fits-All Content**: Novices struggle with ungrounded technical jargon, while advanced learners face boredom from trivial explanations.
2. **Disconnected Evaluation**: Quizzes typically serve as summative terminal checks rather than formative drivers of subsequent content generation.
3. **Inspect-Element Vulnerabilities**: Many web-based learning tools expose quiz answer keys to the frontend before submission, undermining evaluation integrity.

---

## 3. System Architecture

```mermaid
graph TD
    User([Student Browser]) -->|HTTPS / REST| Frontend[React 19 + TypeScript SPA]
    Frontend -->|JWT Session / JSON| API[REST API Router - FastAPI / Express]
    
    subgraph Backend Services
        API --> Auth[Authentication & RBAC]
        API --> LessonSvc[Lesson Generation Service]
        API --> QuizSvc[Quiz Scoring Engine]
        API --> AdaptiveSvc[Adaptive Difficulty Engine]
    end
    
    subgraph AI Foundation
        LessonSvc -->|SDK Prompts| Gemini[Google Gemini gemini-3.8-flash]
        QuizSvc -->|JSON Schema| Gemini
    end
    
    subgraph Data Persistence
        Auth --> DB[(PostgreSQL / SQLite)]
        LessonSvc --> DB
        QuizSvc --> DB
        AdaptiveSvc --> DB
    end
    
    AdaptiveSvc -->|Target Weak Concepts & Level| LessonSvc
```

---

## 4. The Mastery Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor S as Student
    participant UI as React Client
    participant API as Backend Server
    participant G as Google Gemini API
    participant DB as Relational Database

    S->>UI: Select Topic ("Python loops") & Tier
    UI->>API: POST /api/lessons/generate
    API->>DB: Query past score & weak concepts
    DB-->>API: Weak concepts: ["while loop update", "mutation"]
    API->>G: Generate structured lesson with context
    G-->>API: Validated JSON Lesson
    API->>DB: Save Lesson Record
    API-->>UI: Return Structured Lesson Content
    
    S->>UI: Request Diagnostic Quiz
    UI->>API: POST /api/quizzes/generate
    API->>G: Request 5 MCQs with JSON schema
    G-->>API: Questions with Answer Keys
    API->>DB: Store full quiz (with private answer keys)
    API-->>UI: Return client-safe questions (keys stripped!)
    
    S->>UI: Submit 5 Answers
    UI->>API: POST /api/quizzes/{id}/submit
    API->>API: Score answers server-side
    API->>API: Execute Adaptive Difficulty Algorithm
    API->>DB: Store QuizAttempt, QuizAnswers & Recommendation
    API-->>UI: Return Score %, Explanations & Next Level
```

---

## 5. Technology Stack Rationale

| Layer | Selected Tech | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide | Instant reactivity, strict type safety, zero-bundle overhead, and academic clean UI. |
| **Progress Charts** | Recharts | Canvas/SVG charting of score history and topic mastery over time. |
| **Backend** | Python FastAPI & Express Node.js | FastAPI provides asynchronous high throughput, automatic OpenAPI documentation, and Pydantic validation. |
| **Database** | PostgreSQL + SQLAlchemy ORM | ACID transactional integrity, normalized schema, and foreign-key cascades. |
| **AI Model** | Google Gemini `gemini-3.8-flash` | Low latency, high reasoning quality, and strict JSON schema generation capability. |

---

## 6. Limitations & Future Enhancements
- **Current Limitations**: Focuses on text and runnable code snippets; interactive live execution sandboxes (e.g. WebAssembly Pyodide) are future additions.
- **Future Enhancements**: Multi-agent peer debates, automated generation of unit test suites, and spaced-repetition notification schedulers.
