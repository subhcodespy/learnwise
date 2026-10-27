# LearnWise AI — Sample Demonstration Outputs

Topic: **Python loops and iteration**

---

## 1. Beginner Level Output Sample

### Concept Explanation
In computer programming, a **loop** is an instruction that repeats a block of code until a condition is satisfied. Think of an automated conveyor belt: instead of writing 10 separate lines of code to inspect 10 items, a loop runs once for every item in the queue.

### Worked Code Example
```python
# Counting from 1 to 5 using range()
for count in range(1, 6):
    print(f"Current step: {count}")

# Output:
# Current step: 1
# Current step: 2
# Current step: 3
# Current step: 4
# Current step: 5
```

### Knowledge Check Question
**Question:** What numbers does `range(0, 4)` produce in Python?  
**Answer:** `0, 1, 2, 3` (stops right before 4).

---

## 2. Intermediate Level Output Sample

### Concept Explanation
At the intermediate level, Pythonic iteration shifts from manual index counting (`for i in range(len(list)):`) to direct iterator unpacking using `enumerate()`, parallel iteration using `zip()`, and guard conditions using the unique `for...else` construct.

### Worked Code Example
```python
# Safe linear search using loop-else
registered_users = ["usr_101", "usr_102", "usr_103"]
target = "usr_999"

for idx, uid in enumerate(registered_users):
    if uid == target:
        print(f"Found user at index {idx}")
        break
else:
    # Executes only if loop completes without a break!
    print("User ID not registered.")
```

### Knowledge Check Question
**Question:** Under what circumstance does the `else` block attached to a `for` loop execute in Python?  
**Answer:** When the loop iterates through all elements to completion without encountering a `break` statement.

---

## 3. Advanced Level Output Sample

### Concept Explanation
Advanced iteration examines memory cache locality, CPU branch prediction, generator streaming pipelines, and asymptotic complexity bounds. When processing large data arrays in AI pipelines, materializing complete lists in memory incurs an $O(N)$ space penalty, whereas generator expressions maintain an $O(1)$ constant memory overhead.

### Worked Code Example
```python
# O(1) space lazy streaming generator for large machine learning log files
def stream_anomaly_logs(log_stream, error_threshold=0.90):
    for log_record in log_stream:
        # Stream evaluation without loading entire dataset into RAM
        if log_record.get("anomaly_score", 0.0) >= error_threshold:
            yield log_record["timestamp"], log_record["message"]

# Memory consumption remains constant regardless of whether stream has 100 or 10,000,000 items
```

---

## 4. End-to-End Adaptive Demonstration Scenario (Section 16)

```
[Step 1] Student starts at: Intermediate
         Topic: "Python loops and iteration"
            │
            ▼
[Step 2] Student takes 5-question Diagnostic Quiz:
         Score: 20% (1/5 correct)
         Identified Weak Concepts: ["loop termination updates", "infinite while loops"]
            │
            ▼
[Step 3] Adaptive Engine fires:
         Rule: 20% < 40% threshold -> DEMOTE
         Recommendation: Step down to Beginner
         Reason: "Score falls below 40% threshold. Stepping down to Beginner to reinforce foundational loop termination invariants."
            │
            ▼
[Step 4] Student generates new Beginner Lesson:
         Prompt injects: Weak concepts ["loop termination updates"]
         Content specifically emphasizes how to increment counters and prevent infinite loops.
            │
            ▼
[Step 5] Student takes Beginner Diagnostic Quiz:
         Score: 80% (4/5 correct)
            │
            ▼
[Step 6] Adaptive Engine fires:
         Rule: 80% in 70-84% range -> ADVANCE
         Recommendation: Advance to Intermediate / Advanced
         Reason: "Demonstrated 80% mastery on foundational mechanics. Advancing to higher-order iteration and complexity reasoning."
```
