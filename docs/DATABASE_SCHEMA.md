# LearnWise AI — Relational Database Schema & Migrations

LearnWise AI employs a third-normal-form (3NF) relational database schema supported natively in PostgreSQL (production/docker) and SQLite (zero-setup local development).

---

## 1. Entity-Relationship Model

```mermaid
erDiagram
    users ||--o{ lessons : "generates"
    users ||--o{ quizzes : "owns"
    users ||--o{ quiz_attempts : "attempts"
    users ||--o{ learning_recommendations : "receives"
    
    lessons ||--o{ quizzes : "spawns"
    quizzes ||--o{ quiz_attempts : "evaluated_in"
    quiz_attempts ||--o{ quiz_answers : "contains"

    users {
        string id PK
        string display_name
        string email UK
        string password_hash
        string preferred_level
        string learning_preference
        datetime created_at
        datetime updated_at
    }

    lessons {
        string id PK
        string user_id FK
        string topic
        string subject
        string proficiency_level
        string content_type
        string learning_preference
        json generated_content
        string prompt_version
        boolean is_saved
        datetime created_at
    }

    quizzes {
        string id PK
        string user_id FK
        string lesson_id FK
        string topic
        string proficiency_level
        json question_data
        datetime created_at
    }

    quiz_attempts {
        string id PK
        string user_id FK
        string quiz_id FK
        string topic
        string proficiency_level
        float score
        int total_questions
        int correct_answers
        datetime submitted_at
    }

    quiz_answers {
        string id PK
        string attempt_id FK
        string question_id
        int selected_answer_index
        boolean is_correct
        string concept_tested
    }

    learning_recommendations {
        string id PK
        string user_id FK
        string topic
        string previous_level
        string recommended_level
        float latest_score
        string recommendation_reason
        json weak_concepts
        datetime created_at
    }
```

---

## 2. Security Safeguards in Data Storage
1. **Password Protection**: Passwords are never stored plaintext; they are hashed with salted bcrypt or sha256 algorithms.
2. **Hidden Answer Keys**: `quizzes.question_data` contains the authoritative `correctAnswerIndex`. When the client requests `GET /api/quizzes/{id}`, the backend dynamically strips this property before sending the payload.
3. **Foreign Key Cascade Deletion**: Deleting a user account cascades to all associated lessons, quizzes, attempts, and recommendations.
