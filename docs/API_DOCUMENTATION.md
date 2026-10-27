# LearnWise AI — REST API Documentation

Base Endpoint: `/api`

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Creates a student account and issues a JWT token.
- **Request Body**:
  ```json
  {
    "displayName": "Subhranshu",
    "email": "student@learnwise.ai",
    "password": "securePassword123",
    "preferredLevel": "Intermediate",
    "learningPreference": "Practical coding"
  }
  ```
- **Response**: `201 Created` with `user` profile and `token`.

### `POST /api/auth/login`
Authenticates existing student credentials.
- **Request Body**:
  ```json
  {
    "email": "student@learnwise.ai",
    "password": "securePassword123"
  }
  ```
- **Response**: `200 OK` with `token` and `user`.

---

## 2. Lesson Endpoints

### `POST /api/lessons/generate`
Generates a structured learning module using Google Gemini.
- **Request Body**:
  ```json
  {
    "topic": "Python loops and iteration",
    "subject": "Computer Science & AI",
    "proficiencyLevel": "Intermediate",
    "contentType": "Step-by-step tutorial",
    "learningPreference": "Practical coding",
    "goals": "Understand loop-else and enumerate()"
  }
  ```
- **Response**: `201 Created` with structured `lesson` JSON.

### `POST /api/lessons/{id}/simplify`
Re-explains the lesson topic using everyday analogies and an intuitive 3-step breakdown.
- **Response**: `200 OK` with `simplifiedText`.

### `POST /api/lessons/{id}/expand`
Provides an in-depth computer science analysis covering asymptotic Big-O complexity, CPU cache locality, and memory footprints.
- **Response**: `200 OK` with `expandedText`.

---

## 3. Quiz & Adaptive Evaluation Endpoints

### `POST /api/quizzes/generate`
Generates 5 multiple choice questions.
- **Response**: `201 Created` with questions (answer keys stripped for client safety).

### `POST /api/quizzes/{id}/submit`
Evaluates submitted answers on the server and runs the adaptive difficulty engine.
- **Request Body**:
  ```json
  {
    "answers": [
      { "questionId": "q1", "selectedAnswerIndex": 1 },
      { "questionId": "q2", "selectedAnswerIndex": 0 },
      { "questionId": "q3", "selectedAnswerIndex": 1 },
      { "questionId": "q4", "selectedAnswerIndex": 2 },
      { "questionId": "q5", "selectedAnswerIndex": 3 }
    ]
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "attempt": {
      "score": 80.0,
      "totalQuestions": 5,
      "correctAnswers": 4,
      "answers": [...]
    },
    "recommendation": {
      "previousLevel": "Intermediate",
      "recommendedLevel": "Advanced",
      "latestScore": 80.0,
      "recommendationReason": "Score of 80% met the target threshold. Advancing to Advanced.",
      "weakConcepts": ["mutation during iteration"]
    }
  }
  ```

---

## 4. Progress & Analytics

### `GET /api/progress/summary`
Returns total lessons, total quizzes, average score, active streak, and chronological score trajectory for Recharts.
