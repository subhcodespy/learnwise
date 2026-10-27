from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.db.session import engine, Base, SessionLocal
from backend.app.models.user import User
from backend.app.models.lesson import Lesson
from backend.app.models.quiz import Quiz, QuizAttempt, QuizAnswer
from backend.app.models.recommendation import LearningRecommendation
from backend.app.core.security import get_password_hash
from backend.app.api import auth, lessons, quizzes, progress, profile

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    description="Adaptive Educational Content Generator with Gemini AI integration and authoritative server-side scoring."
)

# Safe CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(lessons.router, prefix=f"{settings.API_V1_STR}/lessons", tags=["Lessons"])
app.include_router(quizzes.router, prefix=f"{settings.API_V1_STR}/quizzes", tags=["Quizzes"])
app.include_router(progress.router, prefix=f"{settings.API_V1_STR}/progress", tags=["Progress & Analytics"])
app.include_router(profile.router, prefix=f"{settings.API_V1_STR}/profile", tags=["Student Profile"])

@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "connected",
        "ai_model": settings.GEMINI_MODEL
    }

# Seed default demo student if DB is fresh
def seed_demo_data():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "student@learnwise.ai").first()
        if not existing:
            demo_user = User(
                id="usr_student_demo_1",
                display_name="Subhranshu (Student)",
                email="student@learnwise.ai",
                password_hash=get_password_hash("learnwise123"),
                preferred_level="Intermediate",
                learning_preference="Practical coding"
            )
            db.add(demo_user)
            db.commit()
    finally:
        db.close()

seed_demo_data()
