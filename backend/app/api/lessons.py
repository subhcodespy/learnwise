from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.models.lesson import Lesson
from backend.app.models.recommendation import LearningRecommendation
from backend.app.schemas.lesson import LessonCreate, LessonOut, SimplifyResponse, ExpandResponse
from backend.app.services.gemini_service import gemini_service
from backend.app.api.deps import get_current_user

router = APIRouter()

@router.post("/generate", response_model=LessonOut, status_code=status.HTTP_201_CREATED)
def generate_lesson(
    lesson_in: LessonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch historical performance context for this student and topic
    latest_rec = db.query(LearningRecommendation).filter(
        LearningRecommendation.user_id == current_user.id,
        LearningRecommendation.topic.ilike(lesson_in.topic.strip())
    ).order_by(LearningRecommendation.created_at.desc()).first()

    latest_score_str = f"{latest_rec.latest_score:.0f}%" if latest_rec else "No previous attempts"
    weak_str = ", ".join(latest_rec.weak_concepts) if latest_rec and latest_rec.weak_concepts else "None identified"

    proficiency = lesson_in.proficiency_level or current_user.preferred_level or "Beginner"
    preference = lesson_in.learning_preference or current_user.learning_preference or "Simple explanations"

    generated = gemini_service.generate_lesson(
        topic=lesson_in.topic.strip(),
        subject=lesson_in.subject or "Computer Science & AI",
        proficiency_level=proficiency,
        learning_preference=preference,
        content_type=lesson_in.content_type or "Step-by-step tutorial",
        latest_score=latest_score_str,
        weak_concepts=weak_str,
        learning_goals=lesson_in.learning_goals or ""
    )

    lesson = Lesson(
        user_id=current_user.id,
        topic=lesson_in.topic.strip(),
        subject=lesson_in.subject or "Computer Science & AI",
        proficiency_level=proficiency,
        content_type=lesson_in.content_type or "Step-by-step tutorial",
        learning_preference=preference,
        generated_content=generated,
        prompt_version="v2.0",
        is_saved=False
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson

@router.get("", response_model=List[LessonOut])
def list_lessons(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Lesson).filter(Lesson.user_id == current_user.id).order_by(Lesson.created_at.desc()).all()

@router.get("/{lesson_id}", response_model=LessonOut)
def get_lesson(
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.user_id == current_user.id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@router.post("/{lesson_id}/save")
def toggle_save_lesson(
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.user_id == current_user.id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    lesson.is_saved = not lesson.is_saved
    db.commit()
    return {"is_saved": lesson.is_saved}

@router.post("/{lesson_id}/simplify", response_model=SimplifyResponse)
def simplify_lesson(
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.user_id == current_user.id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    explanation = lesson.generated_content.get("explanation", "")
    simplified = gemini_service.simplify_explanation(lesson.topic, explanation)
    return SimplifyResponse(simplifiedText=simplified)

@router.post("/{lesson_id}/expand", response_model=ExpandResponse)
def expand_lesson(
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.user_id == current_user.id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    explanation = lesson.generated_content.get("explanation", "")
    expanded = gemini_service.expand_explanation(lesson.topic, explanation)
    return ExpandResponse(expandedText=expanded)
