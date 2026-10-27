"""
Adaptive Difficulty Engine for LearnWise AI.
Implements the pedagogical rule set:
- 0–39%: Move one level down (minimum Beginner)
- 40–69%: Maintain current level
- 70–84%: Move one level up (maximum Advanced)
- 85–100%: Move one level up with advanced challenge designation
"""

from typing import List, Dict, Any, Tuple
from backend.app.core.config import settings

LEVELS = ["Beginner", "Intermediate", "Advanced"]

def calculate_adaptive_level(
    current_level: str,
    score: float,
    topic: str,
    weak_concepts: List[str] = None,
    recent_scores: List[float] = None
) -> Tuple[str, str]:
    """
    Evaluates score and history against configurable threshold rules.
    Returns: (recommended_level, reason)
    """
    if current_level not in LEVELS:
        current_level = "Beginner"
    
    idx = LEVELS.index(current_level)
    weak_str = f" Focus areas: {', '.join(weak_concepts[:3])}." if weak_concepts else ""

    # Check for repeated difficulty if history is available
    repeated_struggle = False
    if recent_scores and len(recent_scores) >= 2:
        avg_recent = sum(recent_scores[-3:]) / len(recent_scores[-3:])
        if avg_recent < settings.THRESHOLD_DEMOTE:
            repeated_struggle = True

    if score < settings.THRESHOLD_DEMOTE:
        next_idx = max(0, idx - 1)
        recommended = LEVELS[next_idx]
        reason = (
            f"Score of {score:.0f}% falls below the {settings.THRESHOLD_DEMOTE}% threshold. "
            f"Stepping down to {recommended} to rebuild foundational prerequisites and close concept gaps.{weak_str}"
        )
    elif score < settings.THRESHOLD_MAINTAIN:
        recommended = current_level
        reason = (
            f"Score of {score:.0f}% demonstrates emerging comprehension ({settings.THRESHOLD_DEMOTE}-{settings.THRESHOLD_MAINTAIN-1}% range). "
            f"Maintaining {current_level} level to reinforce core mechanisms before advancing.{weak_str}"
        )
    elif score < settings.THRESHOLD_ADVANCE:
        # If student had repeated struggle recently, hold at current level rather than immediately jumping up
        if repeated_struggle and idx > 0:
            recommended = current_level
            reason = (
                f"Score of {score:.0f}% is strong, but previous attempts show historical volatility. "
                f"Consolidating at {current_level} for mastery before advancing."
            )
        else:
            next_idx = min(len(LEVELS) - 1, idx + 1)
            recommended = LEVELS[next_idx]
            reason = (
                f"Score of {score:.0f}% met the {settings.THRESHOLD_MAINTAIN}%-{settings.THRESHOLD_ADVANCE-1}% target benchmark. "
                f"Advancing from {current_level} to {recommended} for higher-order reasoning."
            )
    else:
        next_idx = min(len(LEVELS) - 1, idx + 1)
        recommended = LEVELS[next_idx]
        reason = (
            f"Mastery score of {score:.0f}% (>= {settings.THRESHOLD_ADVANCE}%). "
            f"Advancing to {recommended} with complex architectural and algorithmic challenge problems."
        )

    return recommended, reason
