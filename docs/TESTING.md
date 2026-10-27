# LearnWise AI — Testing Methodology & Verification Report

## 1. Overview
The testing architecture spans unit testing, boundary condition verification, and integration validation. Automated tests are configured in `backend/tests/` using `pytest`.

---

## 2. Adaptive Difficulty Boundary Test Matrix

Section 14 requires explicit verification of the adaptive algorithm across all key threshold boundaries:

| Test Case | Current Level | Score % | Expected Recommendation | Pedagogical Rationale | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `test_adaptive_0%` | Intermediate | 0% | **Beginner** | Severe prerequisite gaps; step down 1 level | PASS |
| `test_adaptive_0%_floor` | Beginner | 0% | **Beginner** | Cannot demote below lowest tier (Beginner) | PASS |
| `test_adaptive_39%` | Advanced | 39% | **Intermediate** | Falls strictly below 40% threshold; demote | PASS |
| `test_adaptive_40%` | Intermediate | 40% | **Intermediate** | Lower bound of maintain bracket (40–69%) | PASS |
| `test_adaptive_69%` | Intermediate | 69% | **Intermediate** | Upper bound of maintain bracket (40–69%) | PASS |
| `test_adaptive_70%` | Beginner | 70% | **Intermediate** | Lower bound of standard advance bracket (70–84%) | PASS |
| `test_adaptive_84%` | Beginner | 84% | **Intermediate** | Upper bound of standard advance bracket (70–84%) | PASS |
| `test_adaptive_85%` | Intermediate | 85% | **Advanced** | Lower bound of mastery bracket (85–100%) | PASS |
| `test_adaptive_100%` | Advanced | 100% | **Advanced** | Capped at highest tier with challenge flag | PASS |

---

## 3. Server-Authoritative Scoring Integrity Test
- **Objective**: Ensure that a client cannot bypass scoring by submitting forged score values.
- **Verification**: The server discards any client-submitted score numbers, iterates through the stored `correctAnswerIndex` properties on record in the database, counts matches, and generates the definitive percentage.

---

## 4. How to Execute Test Suites

```bash
# In the Python backend directory:
cd backend
pytest tests/ -v
```
