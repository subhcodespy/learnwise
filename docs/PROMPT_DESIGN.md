# LearnWise AI — Prompt Engineering Methodology

## 1. Overview
LearnWise AI utilizes strict structured prompts powered by Google Gemini (`gemini-3.8-flash`). Rather than unconstrained text generation, all educational content and quizzes are constrained to structured JSON schemas to prevent formatting collapse and enable programmatic rendering.

---

## 2. Dynamic Context Injection Architecture

Every lesson generation request extracts student-specific signals from the relational database:
1. `proficiency_level`: Beginner, Intermediate, or Advanced.
2. `latest_score`: The student's last evaluated percentage score on this topic.
3. `weak_concepts`: An array of specific concept tags from questions the student answered incorrectly on prior quizzes.
4. `learning_preference`: Simple explanations, Practical coding, Examples first, or Exam-focused.

```
┌─────────────────────────┐
│ Student Database Record │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│ Prompt Assembler                                            │
│ - System Persona: Academic STEM Tutor                       │
│ - Level-Specific Pedagogic Directive                        │
│ - Dynamic Context: Topic + Weak Concepts + Past Score       │
│ - Strict JSON Schema: 9 Mandated Sections                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Google Gemini API (gemini-3.8-flash)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Level Calibration Matrix

| Dimension | Beginner | Intermediate | Advanced |
| :--- | :--- | :--- | :--- |
| **Target Background** | Minimal syntax experience | Comfortable with basic coding | AIML & Systems engineering students |
| **Tone & Register** | Conversational, supportive | Direct, technical, idiomatic | Rigorous, analytical, mathematical |
| **Mechanics** | Analogies & step-by-step tracing | Internal relationships & protocols | Asymptotic Big-O, memory & concurrency |
| **Code Examples** | Simple scripts with heavy comments | Idiomatic patterns (e.g. `zip`, `enumerate`) | Cache locality, generators, error recovery |

---

## 4. Structured JSON Schemas

### Lesson Schema
```json
{
  "learningObjectives": ["string"],
  "explanation": "string (markdown)",
  "keyConcepts": [{"term": "string", "definition": "string"}],
  "workedExamples": [{"title": "string", "code": "string", "explanation": "string"}],
  "importantNotes": ["string"],
  "commonMisconceptions": [{"misconception": "string", "clarification": "string"}],
  "practiceExercises": [{"problem": "string", "hint": "string"}],
  "knowledgeCheck": [{"question": "string", "answer": "string"}],
  "suggestedNextStep": "string"
}
```

### Quiz Schema
```json
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswerIndex": 0,
      "explanation": "string",
      "conceptTested": "string",
      "difficulty": "Beginner|Intermediate|Advanced"
    }
  ]
}
```
