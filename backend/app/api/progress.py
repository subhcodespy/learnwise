from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.models.lesson import Lesson
from backend.app.models.quiz import QuizAttempt
from backend.app.models.recommendation import LearningRecommendation
from backend.app.schemas.quiz import RecommendationOut
from backend.app.api.deps import get_current_user

router = APIRouter()

@router.get("/summary")
def get_progress_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_lessons = db.query(Lesson).filter(Lesson.user_id == current_user.id).count()
    attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == current_user.id).order_by(QuizAttempt.submitted_at.asc()).all()
    total_quizzes = len(attempts)

    avg_score = round(sum([a.score for a in attempts]) / total_quizzes, 1) if total_quizzes > 0 else 0

    # Calculate active days streak
    dates_active = set()
    for l in db.query(Lesson.created_at).filter(Lesson.user_id == current_user.id).all():
        if l[0]:
            dates_active.add(l[0].strftime("%Y-%m-%d"))
    for a in attempts:
        if a.submitted_at:
            dates_active.add(a.submitted_at.strftime("%Y-%m-%d"))
    streak_days = len(dates_active)

    score_timeline = [
        {
            "index": idx + 1,
            "date": att.submitted_at.strftime("%b %d") if att.submitted_at else f"Quiz #{idx+1}",
            "score": att.score,
            "topic": att.topic,
            "level": att.proficiency_level
        }
        for idx, att in enumerate(attempts)
    ]

    latest_rec = db.query(LearningRecommendation).filter(
        LearningRecommendation.user_id == current_user.id
    ).order_by(LearningRecommendation.created_at.desc()).first()

    return {
        "totalLessons": total_lessons,
        "totalQuizzes": total_quizzes,
        "averageScore": avg_score,
        "streakDays": streak_days,
        "scoreTimeline": score_timeline,
        "latestRecommendation": RecommendationOut.model_validate(latest_rec) if latest_rec else None
    }

@router.get("/topics")
def get_topic_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == current_user.id).all()
    topic_map = {}
    for a in attempts:
        t = a.topic
        if t not in topic_map:
            topic_map[t] = {"attempts": 0, "total_score": 0.0, "levels": set(), "last_date": a.submitted_at}
        topic_map[t]["attempts"] += 1
        topic_map[t]["total_score"] += a.score
        topic_map[t]["levels"].add(a.proficiency_level)
        if a.submitted_at and (not topic_map[t]["last_date"] or a.submitted_at > topic_map[t]["last_date"]):
            topic_map[t]["last_date"] = a.submitted_at

    return [
        {
            "topic": t,
            "attemptsCount": data["attempts"],
            "averageScore": round(data["total_score"] / data["attempts"], 1),
            "levelsMastered": list(data["levels"]),
            "lastAttempt": data["last_date"].isoformat() if data["last_date"] else None
        }
        for t, data in topic_map.items()
    ]

@router.get("/recommendations")
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recs = db.query(LearningRecommendation).filter(
        LearningRecommendation.user_id == current_user.id
    ).order_by(LearningRecommendation.created_at.desc()).all()
    return [RecommendationOut.model_validate(r) for r in recs]
