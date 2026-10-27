from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class KeyConcept(BaseModel):
    term: str
    definition: str

class WorkedExample(BaseModel):
    title: str
    code: Optional[str] = None
    explanation: str

class Misconception(BaseModel):
    misconception: str
    clarification: str

class PracticeExercise(BaseModel):
    problem: str
    hint: Optional[str] = None

class KnowledgeCheckItem(BaseModel):
    question: str
    answer: str

class LessonContent(BaseModel):
    learningObjectives: List[str]
    explanation: str
    keyConcepts: List[KeyConcept]
    workedExamples: List[WorkedExample]
    importantNotes: List[str]
    commonMisconceptions: List[Misconception]
    practiceExercises: List[PracticeExercise]
    knowledgeCheck: List[KnowledgeCheckItem]
    suggestedNextStep: str

class LessonCreate(BaseModel):
    topic: str = Field(..., min_length=2, max_length=200)
    subject: Optional[str] = "Computer Science & AI"
    proficiency_level: Optional[str] = "Beginner"
    content_type: Optional[str] = "Step-by-step tutorial"
    learning_preference: Optional[str] = "Simple explanations"
    learning_goals: Optional[str] = None

class LessonOut(BaseModel):
    id: str
    user_id: str
    topic: str
    subject: str
    proficiency_level: str
    content_type: str
    learning_preference: str
    generated_content: LessonContent
    prompt_version: str
    is_saved: bool
    created_at: datetime

    class Config:
        from_attributes = True

class SimplifyResponse(BaseModel):
    simplifiedText: str

class ExpandResponse(BaseModel):
    expandedText: str
