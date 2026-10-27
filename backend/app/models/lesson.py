import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic = Column(String(200), nullable=False, index=True)
    subject = Column(String(100), nullable=False)
    proficiency_level = Column(String(20), nullable=False) # Beginner, Intermediate, Advanced
    content_type = Column(String(50), nullable=False)
    learning_preference = Column(String(50), nullable=False)
    generated_content = Column(JSON, nullable=False)
    prompt_version = Column(String(20), default="v1.0", nullable=False)
    is_saved = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", back_populates="lessons")
    quizzes = relationship("Quiz", back_populates="lesson")
