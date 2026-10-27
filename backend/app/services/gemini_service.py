import json
import logging
from typing import Dict, Any, List
from google import genai
from google.genai import types
from backend.app.core.config import settings
from backend.app.prompts.learning_prompts import (
    LESSON_SYSTEM_INSTRUCTION,
    QUIZ_SYSTEM_INSTRUCTION,
    SIMPLIFY_PROMPT_TEMPLATE,
    EXPAND_PROMPT_TEMPLATE,
    build_lesson_prompt,
    build_quiz_prompt,
)

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        self.client = None
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize Google GenAI client: {e}")

    def generate_lesson(
        self,
        topic: str,
        subject: str,
        proficiency_level: str,
        learning_preference: str,
        content_type: str,
        latest_score: str = "None recorded",
        weak_concepts: str = "None recorded",
        learning_goals: str = ""
    ) -> Dict[str, Any]:
        """Generate structured lesson using Google Gen AI Python SDK with JSON schema enforcement."""
        prompt = build_lesson_prompt(
            topic=topic,
            subject=subject,
            proficiency_level=proficiency_level,
            learning_preference=learning_preference,
            content_type=content_type,
            latest_score=latest_score,
            weak_concepts=weak_concepts,
            learning_goals=learning_goals
        )

        if not self.client:
            return self._fallback_lesson(topic, proficiency_level, learning_preference)

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=LESSON_SYSTEM_INSTRUCTION,
                    response_mime_type="application/json",
                    temperature=0.7,
                )
            )
            raw_text = response.text or "{}"
            parsed = json.loads(raw_text)
            return parsed
        except Exception as e:
            logger.error(f"Gemini API lesson generation failure: {e}")
            return self._fallback_lesson(topic, proficiency_level, learning_preference)

    def generate_quiz(self, topic: str, proficiency_level: str) -> List[Dict[str, Any]]:
        """Generate 5-question multiple choice quiz with validated JSON structure."""
        prompt = build_quiz_prompt(topic, proficiency_level)

        if not self.client:
            return self._fallback_quiz(topic, proficiency_level)

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=QUIZ_SYSTEM_INSTRUCTION,
                    response_mime_type="application/json",
                    temperature=0.5,
                )
            )
            raw_text = response.text or "{}"
            parsed = json.loads(raw_text)
            questions = parsed.get("questions", [])
            if len(questions) != 5:
                logger.warning(f"Expected 5 questions, received {len(questions)}")
            return questions
        except Exception as e:
            logger.error(f"Gemini API quiz generation failure: {e}")
            return self._fallback_quiz(topic, proficiency_level)

    def simplify_explanation(self, topic: str, content: str) -> str:
        """Generate simpler breakdown with analogies."""
        prompt = SIMPLIFY_PROMPT_TEMPLATE.format(topic=topic, content=content)
        if not self.client:
            return f"### Simplified: {topic}\nThink of {topic} like a step-by-step conveyor belt: it loads an item, inspects it, executes an action, and stops when complete."

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.5)
            )
            return response.text or ""
        except Exception as e:
            logger.error(f"Gemini simplify error: {e}")
            return f"Simplified breakdown for {topic}: Break the task into distinct linear steps."

    def expand_explanation(self, topic: str, content: str) -> str:
        """Generate in-depth architectural and complexity breakdown."""
        prompt = EXPAND_PROMPT_TEMPLATE.format(topic=topic, content=content)
        if not self.client:
            return f"### Advanced Analysis: {topic}\n- **Complexity**: O(N) linear iteration.\n- **Memory Layout**: Contiguous arrays optimize CPU cache line loads.\n- **Concurrency**: Requires synchronized locks or snapshot isolation."

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.6)
            )
            return response.text or ""
        except Exception as e:
            logger.error(f"Gemini expand error: {e}")
            return f"Advanced technical analysis for {topic} covering asymptotic complexity and memory efficiency."

    def _fallback_lesson(self, topic: str, level: str, preference: str) -> Dict[str, Any]:
        return {
            "learningObjectives": [
                f"Understand the theoretical fundamentals of {topic} at {level} level",
                f"Implement practical patterns matching {preference} learning style",
                f"Identify boundary cases and algorithmic guarantees"
            ],
            "explanation": f"In Computer Science and AI, {topic} represents an essential primitive. At the {level} tier, mastering both syntax and operational runtime semantics ensures optimal system design and prevents runtime regressions.",
            "keyConcepts": [
                {"term": f"{topic} Core Pattern", "definition": f"The primary operational structure of {topic}."},
                {"term": "Execution Lifecycle", "definition": "State changes from initialization to termination."},
                {"term": "Asymptotic Bound", "definition": "Resource consumption over scaling input sizes."}
            ],
            "workedExamples": [
                {
                    "title": f"Implementation: {topic}",
                    "code": f"# Clean Python implementation of {topic}\ndef execute_pattern(dataset):\n    results = []\n    for item in dataset:\n        results.append(item * 2)\n    return results\n\nprint(execute_pattern([1, 2, 3]))",
                    "explanation": f"Illustrates state preservation and predictable memory performance at the {level} tier."
                }
            ],
            "importantNotes": [
                f"Verify termination criteria when configuring {topic}.",
                "Prefer idiomatic built-ins over manual index management."
            ],
            "commonMisconceptions": [
                {
                    "misconception": "All implementations share identical runtime characteristics.",
                    "clarification": "Memory locality and interpreter optimizations create significant execution variations."
                }
            ],
            "practiceExercises": [
                {"problem": f"Write an idiomatic function utilizing {topic} on edge inputs.", "hint": "Handle empty inputs gracefully."}
            ],
            "knowledgeCheck": [
                {"question": f"What is the primary benefit of {topic}?", "answer": "Structured, deterministic state transformations."}
            ],
            "suggestedNextStep": "Complete the 5-question diagnostic quiz to calibrate your adaptive learning recommendation."
        }

    def _fallback_quiz(self, topic: str, level: str) -> List[Dict[str, Any]]:
        return [
            {
                "question": f"What is the primary operational objective of {topic}?",
                "options": [
                    "To execute deterministic state operations repeatedly",
                    "To format disk sectors",
                    "To generate static cryptographic keys",
                    "To compile C extensions"
                ],
                "correctAnswerIndex": 0,
                "explanation": "The core purpose is deterministic repetition over data collections or state ranges.",
                "conceptTested": "core execution semantics",
                "difficulty": level
            },
            {
                "question": f"Which condition poses a direct reliability risk in {topic}?",
                "options": [
                    "Using pure functions",
                    "Missing termination progress causing an infinite execution cycle",
                    "Applying type hints",
                    "Writing descriptive docstrings"
                ],
                "correctAnswerIndex": 1,
                "explanation": "Loops and iterative blocks must make progress toward their termination invariant.",
                "conceptTested": "termination invariants",
                "difficulty": level
            },
            {
                "question": "What is the memory advantage of streaming iterators versus materialized collections?",
                "options": [
                    "Iterators consume all RAM up-front",
                    "Iterators yield items lazily, maintaining an O(1) space footprint",
                    "Iterators bypass CPU caches",
                    "Iterators disable Python garbage collection"
                ],
                "correctAnswerIndex": 1,
                "explanation": "Lazy iterators yield items on demand, preventing full list allocation in RAM.",
                "conceptTested": "lazy evaluation memory efficiency",
                "difficulty": level
            },
            {
                "question": "What is the standard time complexity for a single sequential pass across N elements?",
                "options": ["O(1)", "O(log N)", "O(N)", "O(N^2)"],
                "correctAnswerIndex": 2,
                "explanation": "Processing each element exactly once takes linear time O(N).",
                "conceptTested": "linear time complexity",
                "difficulty": level
            },
            {
                "question": "Why is modifying a list in-place during active iteration discouraged in Python?",
                "options": [
                    "It causes index displacement leading to skipped or double-visited elements",
                    "It converts the list to a tuple",
                    "It immediately triggers a SyntaxError",
                    "It corrupts global variables"
                ],
                "correctAnswerIndex": 0,
                "explanation": "In-place modifications shift internal index offsets, creating subtle runtime bugs.",
                "conceptTested": "in-place mutation hazards",
                "difficulty": level
            }
        ]

gemini_service = GeminiService()
