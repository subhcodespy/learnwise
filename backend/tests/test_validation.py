"""
Unit tests for schema validation and edge inputs.
"""

import pytest
from pydantic import ValidationError
from backend.app.schemas.user import UserRegister
from backend.app.schemas.lesson import LessonCreate
from backend.app.schemas.quiz import QuizSubmission

def test_user_register_validation():
    # Valid registration
    valid_data = {
        "display_name": "Alice Smith",
        "email": "alice@example.com",
        "password": "validPassword123",
        "preferred_level": "Intermediate",
        "learning_preference": "Practical coding"
    }
    user = UserRegister(**valid_data)
    assert user.email == "alice@example.com"

    # Invalid email
    with pytest.raises(ValidationError):
        UserRegister(**{**valid_data, "email": "not-an-email"})

    # Password too short
    with pytest.raises(ValidationError):
        UserRegister(**{**valid_data, "password": "123"})

def test_lesson_create_validation():
    # Valid lesson input
    lesson = LessonCreate(topic="Dynamic Programming", proficiency_level="Advanced")
    assert lesson.topic == "Dynamic Programming"

    # Empty topic should fail
    with pytest.raises(ValidationError):
        LessonCreate(topic="   ")
