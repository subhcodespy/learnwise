from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.models.quiz import Quiz, QuizAttempt, QuizAnswer
from backend.app.models.recommendation import LearningRecommendation
from backend.app.schemas.quiz import (
    QuizCreate,
    QuizClientOut,
    QuizSubmission,
    QuizSubmitResponse,
    QuizAttemptOut,
    EvaluatedAnswerOut,
    RecommendationOut,
    QuizQuestionClientSafe
)
from backend.app.services.gemini_service import gemini_service
from backend.app.services.adaptive_service import calculate_adaptive_level
from backend.app.api.deps import get_current_user

router = APIRouter()

@router.post("/generate", response_model=QuizClientOut, status_code=status.HTTP_201_CREATED)
def generate_quiz(
    quiz_in: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    level = quiz_in.proficiency_level or current_user.preferred_level or "Beginner"
    raw_questions = gemini_service.generate_quiz(quiz_in.topic.strip(), level)

    # Store full question data including correctAnswerIndex securely
    quiz = Quiz(
        user_id=current_user.id,
        lesson_id=quiz_in.lesson_id,
        topic=quiz_in.topic.strip(),
        proficiency_level=level,
        question_data=raw_questions
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    # Strip correctAnswerIndex from client response!
    client_questions = []
    for q in raw_questions:
        client_questions.append(QuizQuestionClientSafe(
            id=q.get("id", "q"),
            question=q.get("question", ""),
            options=q.get("options", []),
            explanation=q.get("explanation"),
            conceptTested=q.get("conceptTested"),
            difficulty=level
        ))

    return QuizClientOut(
        id=quiz.id,
        user_id=quiz.user_id,
        lesson_id=quiz.lesson_id,
        topic=quiz.topic,
        proficiency_level=quiz.proficiency_level,
        questions=client_questions,
        created_at=quiz.created_at
    )

@router.get("/{quiz_id}", response_model=QuizClientOut)
def get_quiz(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    client_questions = []
    for q in quiz.question_data:
        client_questions.append(QuizQuestionClientSafe(
            id=q.get("id", "q"),
            question=q.get("question", ""),
            options=q.get("options", []),
            explanation=q.get("explanation"),
            conceptTested=q.get("conceptTested"),
            difficulty=quiz.proficiency_level
        ))

    return QuizClientOut(
        id=quiz.id,
        user_id=quiz.user_id,
        lesson_id=quiz.lesson_id,
        topic=quiz.topic,
        proficiency_level=quiz.proficiency_level,
        questions=client_questions,
        created_at=quiz.created_at
    )

@router.post("/{quiz_id}/submit", response_model=QuizSubmitResponse)
def submit_quiz(
    quiz_id: str,
    submission: QuizSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    stored_questions = quiz.question_data
    user_answers_map = {a.questionId: a.selectedAnswerIndex for a in submission.answers}

    correct_count = 0
    evaluated_list: List[EvaluatedAnswerOut] = []
    weak_concepts: List[str] = []

    for q in stored_questions:
        qid = q.get("id")
        correct_idx = q.get("correctAnswerIndex", 0)
        selected_idx = user_answers_map.get(qid, -1)
        is_correct = (selected_idx == correct_idx)
        concept = q.get("conceptTested", quiz.topic)

        if is_correct:
            correct_count += 1
        else:
            if concept and concept not in weak_concepts:
                weak_concepts.append(concept)

        evaluated_list.append(EvaluatedAnswerOut(
            questionId=qid,
            question=q.get("question", ""),
            options=q.get("options", []),
            selectedAnswerIndex=selected_idx,
            correctAnswerIndex=correct_idx,
            isCorrect=is_correct,
            explanation=q.get("explanation", ""),
            conceptTested=concept
        ))

    total_q = len(stored_questions)
    score_pct = round((correct_count / total_q) * 100, 2) if total_q > 0 else 0.0

    # Retrieve previous scores for this topic to test trend
    past_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.topic == quiz.topic
    ).all()
    recent_scores = [a.score for a in past_attempts]

    recommended_level, reason = calculate_adaptive_level(
        current_level=quiz.proficiency_level,
        score=score_pct,
        topic=quiz.topic,
        weak_concepts=weak_concepts,
        recent_scores=recent_scores
    )

    attempt = QuizAttempt(
        user_id=current_user.id,
        quiz_id=quiz.id,
        topic=quiz.topic,
        proficiency_level=quiz.proficiency_level,
        score=score_pct,
        total_questions=total_q,
        correct_answers=correct_count
    )
    db.add(attempt)
    db.flush()

    for item in evaluated_list:
        ans_record = QuizAnswer(
            attempt_id=attempt.id,
            question_id=item.questionId,
            selected_answer_index=item.selectedAnswerIndex,
            is_correct=item.isCorrect,
            concept_tested=item.conceptTested
        )
        db.add(ans_record)

    rec = LearningRecommendation(
        user_id=current_user.id,
        topic=quiz.topic,
        previous_level=quiz.proficiency_level,
        recommended_level=recommended_level,
        latest_score=score_pct,
        recommendation_reason=reason,
        weak_concepts=weak_concepts
    )
    db.add(rec)

    # Update student preferred level to recommended level
    current_user.preferred_level = recommended_level
    db.commit()
    db.refresh(attempt)
    db.refresh(rec)

    return QuizSubmitResponse(
        attempt=QuizAttemptOut(
            id=attempt.id,
            quiz_id=attempt.quiz_id,
            topic=attempt.topic,
            proficiency_level=attempt.proficiency_level,
            score=attempt.score,
            total_questions=attempt.total_questions,
            correct_answers=attempt.correct_answers,
            submitted_at=attempt.submitted_at,
            answers=evaluated_list
        ),
        recommendation=RecommendationOut.model_validate(rec)
    )

@router.get("/history", response_model=List[QuizAttemptOut])
def list_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == current_user.id
    ).order_by(QuizAttempt.submitted_at.desc()).all()

    results = []
    for att in attempts:
        eval_answers = [
            EvaluatedAnswerOut(
                questionId=a.question_id,
                question="",
                options=[],
                selectedAnswerIndex=a.selected_answer_index,
                correctAnswerIndex=-1,
                isCorrect=a.is_correct,
                explanation="",
                conceptTested=a.concept_tested or ""
            ) for a in att.answers
        ]
        results.append(QuizAttemptOut(
            id=att.id,
            quiz_id=att.quiz_id,
            topic=att.topic,
            proficiency_level=att.proficiency_level,
            score=att.score,
            total_questions=att.total_questions,
            correct_answers=att.correct_answers,
            submitted_at=att.submitted_at,
            answers=eval_answers
        ))
    return results
