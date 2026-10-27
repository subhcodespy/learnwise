import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class LearningRecommendation(Base):
    __tablename__ = "learning_recommendations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic = Column(String(200), nullable=False)
    previous_level = Column(String(20), nullable=False)
    recommended_level = Column(String(20), nullable=False)
    latest_score = Column(Float, nullable=False)
    recommendation_reason = Column(String(500), nullable=False)
    weak_concepts = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", back_populates="recommendations")
