"""
Unit tests for LearnWise AI Adaptive Engine.
Tests all specified threshold boundary values:
- 0%
- 39%
- 40%
- 69%
- 70%
- 84%
- 85%
- 100%
"""

import pytest
from backend.app.services.adaptive_service import calculate_adaptive_level

def test_adaptive_threshold_0_percent():
    # 0%: Should demote from Intermediate to Beginner
    rec, reason = calculate_adaptive_level("Intermediate", 0.0, "Python loops")
    assert rec == "Beginner"
    assert "below" in reason.lower()

    # Boundary: at Beginner already, cannot demote below Beginner
    rec_beg, _ = calculate_adaptive_level("Beginner", 0.0, "Python loops")
    assert rec_beg == "Beginner"

def test_adaptive_threshold_39_percent():
    # 39%: Just below the 40% threshold -> should demote
    rec, reason = calculate_adaptive_level("Advanced", 39.0, "Python loops")
    assert rec == "Intermediate"
    assert "below" in reason.lower()

def test_adaptive_threshold_40_percent():
    # 40%: Lower bound of maintain bracket (40-69%)
    rec, reason = calculate_adaptive_level("Intermediate", 40.0, "Python loops")
    assert rec == "Intermediate"
    assert "maintaining" in reason.lower() or "emerging" in reason.lower()

def test_adaptive_threshold_69_percent():
    # 69%: Upper bound of maintain bracket (40-69%)
    rec, reason = calculate_adaptive_level("Intermediate", 69.0, "Python loops")
    assert rec == "Intermediate"
    assert "maintaining" in reason.lower() or "emerging" in reason.lower()

def test_adaptive_threshold_70_percent():
    # 70%: Lower bound of advance bracket (70-84%)
    rec, reason = calculate_adaptive_level("Beginner", 70.0, "Python loops")
    assert rec == "Intermediate"
    assert "advancing" in reason.lower()

    rec_adv, _ = calculate_adaptive_level("Intermediate", 70.0, "Python loops")
    assert rec_adv == "Advanced"

def test_adaptive_threshold_84_percent():
    # 84%: Upper bound of standard advance bracket
    rec, reason = calculate_adaptive_level("Beginner", 84.0, "Python loops")
    assert rec == "Intermediate"
    assert "advancing" in reason.lower()

def test_adaptive_threshold_85_percent():
    # 85%: Mastery threshold (85-100%) -> advance + challenge
    rec, reason = calculate_adaptive_level("Intermediate", 85.0, "Python loops")
    assert rec == "Advanced"
    assert "mastery" in reason.lower()

def test_adaptive_threshold_100_percent():
    # 100%: Perfect score -> capped at Advanced
    rec, reason = calculate_adaptive_level("Advanced", 100.0, "Python loops")
    assert rec == "Advanced"
    assert "mastery" in reason.lower()

def test_weak_concept_injection():
    # Weak concepts should be recorded in recommendation reason
    weak = ["range offset", "off-by-one errors"]
    _, reason = calculate_adaptive_level("Intermediate", 35.0, "Python loops", weak_concepts=weak)
    assert "range offset" in reason

def test_historical_trend_smoothing():
    # If historical attempts were low (average < 40%), hold at current level rather than jumping
    recent = [20.0, 30.0]
    rec, reason = calculate_adaptive_level("Intermediate", 75.0, "Python loops", recent_scores=recent)
    assert rec == "Intermediate"
    assert "volatility" in reason.lower() or "consolidating" in reason.lower()
