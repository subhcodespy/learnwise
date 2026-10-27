from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class QuizQuestionClientSafe(BaseModel):
    id: str
    question: str
    options: List[str]
    explanation: Optional[str] = None
    conceptTested: Optional[str] = None
    difficulty: str

class QuizQuestionServer(QuizQuestionClientSafe):
    correctAnswerIndex: int

class QuizCreate(BaseModel):
    topic: str = Field(..., min_length=2, max_length=200)
    proficiency_level: Optional[str] = "Beginner"
    lesson_id: Optional[str] = None

class QuizClientOut(BaseModel):
    id: str
    user_id: str
    lesson_id: Optional[str]
    topic: str
    proficiency_level: str
    questions: List[QuizQuestionClientSafe]
    created_at: datetime

    class Config:
        from_attributes = True

class QuizAnswerSubmit(BaseModel):
    questionId: str
    selectedAnswerIndex: int

class QuizSubmission(BaseModel):
    answers: List[QuizAnswerSubmit]

class EvaluatedAnswerOut(BaseModel):
    questionId: str
    question: str
    options: List[str]
    selectedAnswerIndex: int
    correctAnswerIndex: int
    isCorrect: bool
    explanation: str
    conceptTested: str

class RecommendationOut(BaseModel):
    id: str
    topic: str
    previous_level: str
    recommended_level: str
    latest_score: float
    recommendation_reason: str
    weak_concepts: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

class QuizAttemptOut(BaseModel):
    id: str
    quiz_id: str
    topic: str
    proficiency_level: str
    score: float
    total_questions: int
    correct_answers: int
    submitted_at: datetime
    answers: List[EvaluatedAnswerOut]

    class Config:
        from_attributes = True

class QuizSubmitResponse(BaseModel):
    attempt: QuizAttemptOut
    recommendation: RecommendationOut
