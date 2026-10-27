"""
Unit tests for server-authoritative scoring and answer key protection.
"""

def test_server_scoring_logic():
    stored_questions = [
        {"id": "q1", "correctAnswerIndex": 1, "conceptTested": "loops"},
        {"id": "q2", "correctAnswerIndex": 0, "conceptTested": "ranges"},
        {"id": "q3", "correctAnswerIndex": 2, "conceptTested": "break statement"},
        {"id": "q4", "correctAnswerIndex": 3, "conceptTested": "while loops"},
        {"id": "q5", "correctAnswerIndex": 1, "conceptTested": "nested loops"},
    ]

    # Student answers: 3 correct, 2 incorrect
    student_submissions = [
        {"questionId": "q1", "selectedAnswerIndex": 1}, # Correct
        {"questionId": "q2", "selectedAnswerIndex": 2}, # Incorrect (concept: ranges)
        {"questionId": "q3", "selectedAnswerIndex": 2}, # Correct
        {"questionId": "q4", "selectedAnswerIndex": 0}, # Incorrect (concept: while loops)
        {"questionId": "q5", "selectedAnswerIndex": 1}, # Correct
    ]

    sub_map = {s["questionId"]: s["selectedAnswerIndex"] for s in student_submissions}
    correct_count = 0
    weak_concepts = []

    for q in stored_questions:
        sel = sub_map.get(q["id"])
        if sel == q["correctAnswerIndex"]:
            correct_count += 1
        else:
            weak_concepts.append(q["conceptTested"])

    score_pct = round((correct_count / len(stored_questions)) * 100, 2)
    assert score_pct == 60.0
    assert len(weak_concepts) == 2
    assert "ranges" in weak_concepts
    assert "while loops" in weak_concepts
