import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google Gen AI SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Database file persistence path
const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface User {
  id: string;
  displayName: string;
  email: string;
  passwordHash: string;
  preferredLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  learningPreference: string;
  createdAt: string;
  updatedAt: string;
}

interface LessonContent {
  learningObjectives: string[];
  explanation: string;
  keyConcepts: { term: string; definition: string }[];
  workedExamples: { title: string; code?: string; explanation: string }[];
  importantNotes: string[];
  commonMisconceptions: { misconception: string; clarification: string }[];
  practiceExercises: { problem: string; hint?: string }[];
  knowledgeCheck: { question: string; answer: string }[];
  suggestedNextStep: string;
}

interface Lesson {
  id: string;
  userId: string;
  topic: string;
  subject: string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  contentType: string;
  learningPreference: string;
  generatedContent: LessonContent;
  promptVersion: string;
  isSaved: boolean;
  createdAt: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number; // Strictly private on server
  explanation: string;
  conceptTested: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

interface Quiz {
  id: string;
  userId: string;
  lessonId: string | null;
  topic: string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  questions: QuizQuestion[];
  createdAt: string;
}

interface QuizAnswerSubmission {
  questionId: string;
  selectedAnswerIndex: number;
}

interface EvaluatedAnswer {
  questionId: string;
  question: string;
  options: string[];
  selectedAnswerIndex: number;
  correctAnswerIndex: number;
  isCorrect: boolean;
  explanation: string;
  conceptTested: string;
}

interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  topic: string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  score: number; // 0 - 100 percentage
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: string;
  answers: EvaluatedAnswer[];
}

interface LearningRecommendation {
  id: string;
  userId: string;
  topic: string;
  previousLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  recommendedLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  latestScore: number;
  recommendationReason: string;
  weakConcepts: string[];
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  sessions: { token: string; userId: string; createdAt: string }[];
  lessons: Lesson[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  recommendations: LearningRecommendation[];
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_learnwise_salt_v1').digest('hex');
}

// Initial seed data generator
function getInitialDb(): DatabaseSchema {
  const defaultUserId = 'usr_student_demo_1';
  const defaultUser: User = {
    id: defaultUserId,
    displayName: 'Subhranshu (Student)',
    email: 'student@learnwise.ai',
    passwordHash: hashPassword('learnwise123'),
    preferredLevel: 'Intermediate',
    learningPreference: 'Practical coding',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const initialLessons: Lesson[] = [
    {
      id: 'lsn_python_loops_beginner',
      userId: defaultUserId,
      topic: 'Python loops and iteration',
      subject: 'Computer Science & AI',
      proficiencyLevel: 'Beginner',
      contentType: 'Step-by-step tutorial',
      learningPreference: 'Simple explanations',
      promptVersion: 'v1.2',
      isSaved: true,
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      generatedContent: {
        learningObjectives: [
          'Understand what a loop is and why programmers use them to avoid repetitive code',
          'Learn the syntax and anatomy of a Python `for` loop with the `range()` function',
          'Learn the anatomy of a `while` loop and how to avoid infinite loops',
          'Write basic accumulator loops to calculate running totals',
        ],
        explanation:
          'In computer programming, iteration means executing a set of instructions repeatedly until a specific condition is met. Imagine counting 10 coins: instead of saying "count coin 1, count coin 2, count coin 3..." individually in 10 lines of code, you use a loop that repeats the action for each coin in the stack.\n\nPython provides two primary loop constructs:\n1. `for` loops: Used when you know the sequence or collection in advance (definite iteration).\n2. `while` loops: Used when you want to repeat an action as long as a logical condition remains `True` (indefinite iteration).',
        keyConcepts: [
          { term: 'Iteration', definition: 'The repetition of a process in order to generate a sequence of outcomes.' },
          { term: 'for loop', definition: 'A control flow statement for specifying iteration over a sequence of items.' },
          { term: 'while loop', definition: 'A loop that continues executing as long as its Boolean condition evaluates to True.' },
          { term: 'range(start, stop, step)', definition: 'A built-in Python generator that creates an immutable sequence of numbers.' },
          { term: 'Loop Variable', definition: 'The variable that takes on the value of the current item on each iteration.' },
        ],
        workedExamples: [
          {
            title: 'Example 1: Basic for loop with range()',
            code: `# Counting from 1 to 5 inclusive
for number in range(1, 6):
    print(f"Current count: {number}")

# Output:
# Current count: 1
# Current count: 2
# Current count: 3
# Current count: 4
# Current count: 5`,
            explanation: 'The range(1, 6) starts at 1 and stops just before 6. On each pass, the variable number holds the next integer.',
          },
          {
            title: 'Example 2: Accumulating a running sum with a while loop',
            code: `total = 0
counter = 1

while counter <= 5:
    total += counter
    counter += 1  # Crucial update step!

print(f"Sum of 1 through 5 is: {total}")  # Output: 15`,
            explanation: 'The counter variable increments on every pass. If we forgot counter += 1, the condition counter <= 5 would remain True forever (infinite loop).',
          },
        ],
        importantNotes: [
          'Python uses 0-indexed ranges by default: range(5) produces 0, 1, 2, 3, 4.',
          'Always ensure that your while loop condition is guaranteed to become False eventually.',
          'Indentation in Python defines the loop body; unindented code marks the end of the loop.',
        ],
        commonMisconceptions: [
          {
            misconception: 'range(1, 10) includes the number 10.',
            clarification: 'In Python, range stops strictly before the stop argument (up to stop - 1).',
          },
          {
            misconception: 'while loops are faster than for loops in Python.',
            clarification: 'for loops iterating over C-optimized sequences or ranges are generally faster and less error-prone in Python.',
          },
        ],
        practiceExercises: [
          { problem: 'Write a for loop that prints the even numbers from 2 to 20 inclusive.', hint: 'Use the step parameter in range(start, stop, step).' },
          { problem: 'Write a loop that calculates the product of numbers from 1 to 5 (factorial of 5).', hint: 'Initialize product = 1 and multiply each number.' },
        ],
        knowledgeCheck: [
          { question: 'What values does range(2, 8, 2) generate?', answer: '2, 4, 6' },
          { question: 'What happens if a while loop condition never becomes False?', answer: 'It results in an infinite loop that freezes or crashes the program.' },
        ],
        suggestedNextStep: 'Proceed to Intermediate loops to learn accumulator patterns, list comprehensions, and loop control statements (break, continue, else).',
      },
    },
    {
      id: 'lsn_python_loops_intermediate',
      userId: defaultUserId,
      topic: 'Python loops and iteration',
      subject: 'Computer Science & AI',
      proficiencyLevel: 'Intermediate',
      contentType: 'Practical examples',
      learningPreference: 'Practical coding',
      promptVersion: 'v1.2',
      isSaved: true,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      generatedContent: {
        learningObjectives: [
          'Master Pythonic iteration tools: enumerate(), zip(), and reversed()',
          'Use loop control statements (break, continue) and understand loop-else syntax',
          'Implement accumulator patterns and dictionary grouping during iteration',
          'Transform nested loops into concise, memory-aware list and dict comprehensions',
        ],
        explanation:
          'At the intermediate level, loop iteration shifts from basic counting to processing structured data pipelines efficiently. Python emphasizes idiomatic iteration: rather than indexing arrays manually with indices like `for i in range(len(items)):`, Pythonic code iterates directly over elements, pairs collections with `zip()`, or unpacks indexes alongside items using `enumerate()`.\n\nFurthermore, Python features a unique `else` clause on loops, which runs only if the loop completes normally without encountering a `break` statement. This is invaluable in search algorithms.',
        keyConcepts: [
          { term: 'enumerate(iterable, start=0)', definition: 'Yields tuples containing an incrementing count and the values obtained from iterating over iterable.' },
          { term: 'zip(*iterables)', definition: 'Aggregates elements from each of the iterables in parallel until the shortest input is exhausted.' },
          { term: 'Loop-Else construct', definition: 'An else block attached to a for or while loop that executes only when the loop completes without a break.' },
          { term: 'List Comprehension', definition: 'A concise syntax [expr for item in iterable if condition] that builds a new list.' },
        ],
        workedExamples: [
          {
            title: 'Example 1: Safe Search with loop-else construct',
            code: `target = "user_42"
user_ids = ["user_10", "user_25", "user_42", "user_99"]

for index, uid in enumerate(user_ids):
    if uid == target:
        print(f"Target found at index {index}")
        break
else:
    # Executes ONLY if no break was triggered!
    print("User ID not found in database batch.")`,
            explanation: 'The else block eliminates the need for an external "found = False" flag variable, keeping search loops clean and readable.',
          },
          {
            title: 'Example 2: Parallel Iteration and Data Cleansing with zip() and comprehension',
            code: `features = ["learning_rate", "batch_size", "epochs"]
values = [0.001, 32, 100]

# Constructing model hyperparameter configuration
config = {feat: val for feat, val in zip(features, values)}
print(config)
# {'learning_rate': 0.001, 'batch_size': 32, 'epochs': 100}`,
            explanation: 'zip() pairs corresponding elements in lockstep, and dictionary comprehension binds them into an O(1) lookup map.',
          },
        ],
        importantNotes: [
          'Avoid modifying a list while iterating over it (e.g. removing items inside for item in my_list:); iterate over a slice copy my_list[:] or use a list comprehension instead.',
          'zip() stops at the shortest iterator. Use itertools.zip_longest() if padding is needed.',
        ],
        commonMisconceptions: [
          {
            misconception: 'The else block in for-else runs when the loop condition is False, like an if-else.',
            clarification: 'In Python loops, else runs if the loop was NOT terminated by break. If the loop is terminated by break, else is skipped.',
          },
        ],
        practiceExercises: [
          { problem: 'Given a list of student scores, create a dictionary mapping student index to "Pass" if score >= 70 else "Review".', hint: 'Combine enumerate() with dictionary comprehension.' },
        ],
        knowledgeCheck: [
          { question: 'When does the else block attached to a for loop execute?', answer: 'When the loop finishes iterating all elements without encountering a break statement.' },
        ],
        suggestedNextStep: 'Advance to nested loops, multi-dimensional tensor iteration, and big-O algorithmic time complexity.',
      },
    },
  ];

  const initialQuizzes: Quiz[] = [
    {
      id: 'qz_python_loops_intermediate_1',
      userId: defaultUserId,
      lessonId: 'lsn_python_loops_intermediate',
      topic: 'Python loops and iteration',
      proficiencyLevel: 'Intermediate',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      questions: [
        {
          id: 'q1',
          question: 'What is the primary advantage of using `enumerate(collection)` over `range(len(collection))` in Python?',
          options: [
            'It allocates an array of integers upfront in memory',
            'It provides cleaner tuple unpacking of index and value without manual indexing',
            'It automatically sorts the collection before iterating',
            'It forces the loop to run on multiple CPU cores',
          ],
          correctAnswerIndex: 1,
          explanation: 'enumerate() produces index-value tuples lazily, adhering to Pythonic readability and avoiding error-prone collection[i] lookups.',
          conceptTested: 'enumerate and iterator unpacking',
          difficulty: 'Intermediate',
        },
        {
          id: 'q2',
          question: 'Consider the code below. What is printed?\n\nfor x in [1, 2, 3]:\n    if x == 4:\n        break\nelse:\n    print("Done")',
          options: ['Nothing is printed', 'Done', 'An IndexError is raised', '1 2 3 Done'],
          correctAnswerIndex: 1,
          explanation: 'Since x == 4 is never True, break is never executed. The loop finishes all iterations normally, so the loop-else block executes and prints "Done".',
          conceptTested: 'loop-else control flow',
          difficulty: 'Intermediate',
        },
        {
          id: 'q3',
          question: 'What occurs when using `zip([1, 2, 3], ["a", "b"])` in standard Python 3?',
          options: [
            'An error is raised because the lengths do not match',
            'It yields (1, "a") and (2, "b"), truncating at the length of the shortest iterable',
            'It pads the second list with None',
            'It repeats "a" for the third element',
          ],
          correctAnswerIndex: 1,
          explanation: 'Built-in zip() stops immediately once the shortest input iterable is exhausted.',
          conceptTested: 'zip parallel iteration',
          difficulty: 'Intermediate',
        },
        {
          id: 'q4',
          question: 'Why is modifying a list (e.g. `items.remove(x)`) while directly iterating over `for x in items:` dangerous?',
          options: [
            'Python will throw a SyntaxError immediately',
            'The internal iterator index shifts, causing subsequent elements to be skipped silently',
            'The list becomes immutable automatically',
            'Memory leaks occur in the garbage collector',
          ],
          correctAnswerIndex: 1,
          explanation: 'Mutating the length of a list during iteration modifies the underlying contiguous buffer offsets, causing the loop index to skip items.',
          conceptTested: 'mutation during iteration',
          difficulty: 'Intermediate',
        },
        {
          id: 'q5',
          question: 'Which comprehension correctly creates a list of squared numbers only for even numbers between 0 and 9?',
          options: [
            '[x**2 for x in range(10) if x % 2 == 0]',
            '[x**2 if x % 2 == 0 for x in range(10)]',
            '[for x in range(10) return x**2 if x % 2 == 0]',
            '{x: x**2 for x in range(10) if x % 2 == 0}',
          ],
          correctAnswerIndex: 0,
          explanation: 'List comprehension filtering syntax is [expression for item in iterable if condition].',
          conceptTested: 'filtered list comprehension',
          difficulty: 'Intermediate',
        },
      ],
    },
  ];

  const initialAttempts: QuizAttempt[] = [
    {
      id: 'att_demo_initial',
      userId: defaultUserId,
      quizId: 'qz_python_loops_intermediate_1',
      topic: 'Python loops and iteration',
      proficiencyLevel: 'Intermediate',
      score: 80,
      totalQuestions: 5,
      correctAnswers: 4,
      submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      answers: [
        {
          questionId: 'q1',
          question: 'What is the primary advantage of using enumerate(collection)?',
          options: ['Allocates integers', 'Cleaner tuple unpacking', 'Sorts collection', 'Multi-core'],
          selectedAnswerIndex: 1,
          correctAnswerIndex: 1,
          isCorrect: true,
          explanation: 'Correct unpacking syntax.',
          conceptTested: 'enumerate and iterator unpacking',
        },
        {
          questionId: 'q2',
          question: 'Loop-else behavior',
          options: ['Nothing', 'Done', 'IndexError', '1 2 3 Done'],
          selectedAnswerIndex: 1,
          correctAnswerIndex: 1,
          isCorrect: true,
          explanation: 'Executes when no break occurs.',
          conceptTested: 'loop-else control flow',
        },
        {
          questionId: 'q3',
          question: 'zip uneven length behavior',
          options: ['Error', 'Truncates to shortest', 'Pads with None', 'Repeats'],
          selectedAnswerIndex: 1,
          correctAnswerIndex: 1,
          isCorrect: true,
          explanation: 'Truncates at shortest iterable.',
          conceptTested: 'zip parallel iteration',
        },
        {
          questionId: 'q4',
          question: 'Mutation during iteration',
          options: ['SyntaxError', 'Index shifts causing skipped items', 'Immutable', 'Memory leak'],
          selectedAnswerIndex: 0,
          correctAnswerIndex: 1,
          isCorrect: false,
          explanation: 'Does not throw SyntaxError; causes silent index-shift bugs.',
          conceptTested: 'mutation during iteration',
        },
        {
          questionId: 'q5',
          question: 'Filtered list comprehension syntax',
          options: ['[x**2 for x in range(10) if x % 2 == 0]', 'Wrong syntax', 'Wrong syntax', 'Dict syntax'],
          selectedAnswerIndex: 0,
          correctAnswerIndex: 0,
          isCorrect: true,
          explanation: 'Proper list comprehension filtering clause.',
          conceptTested: 'filtered list comprehension',
        },
      ],
    },
  ];

  const initialRecommendations: LearningRecommendation[] = [
    {
      id: 'rec_demo_1',
      userId: defaultUserId,
      topic: 'Python loops and iteration',
      previousLevel: 'Intermediate',
      recommendedLevel: 'Advanced',
      latestScore: 80,
      recommendationReason: 'Score of 80% indicates solid comprehension of iteration mechanisms. Advancing to Advanced for nested loops and algorithmic complexity.',
      weakConcepts: ['mutation during iteration'],
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  return {
    users: [defaultUser],
    sessions: [{ token: 'demo_session_token_123', userId: defaultUserId, createdAt: new Date().toISOString() }],
    lessons: initialLessons,
    quizzes: initialQuizzes,
    attempts: initialAttempts,
    recommendations: initialRecommendations,
  };
}

// Persistent Database Layer
class Database {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch {
        this.data = getInitialDb();
        this.save();
      }
    } else {
      this.data = getInitialDb();
      this.save();
    }

    // Deduplicate any records loaded from storage to prevent duplicate keys
    let changed = false;
    if (Array.isArray(this.data.attempts)) {
      const seen = new Set<string>();
      const initialLen = this.data.attempts.length;
      this.data.attempts = this.data.attempts.filter((a) => {
        if (!a || !a.id || seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });
      if (this.data.attempts.length !== initialLen) changed = true;
    }
    if (Array.isArray(this.data.recommendations)) {
      const seen = new Set<string>();
      const initialLen = this.data.recommendations.length;
      this.data.recommendations = this.data.recommendations.filter((r) => {
        if (!r || !r.id || seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
      if (this.data.recommendations.length !== initialLen) changed = true;
    }
    if (changed) {
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save database file:', e);
    }
  }

  // Users
  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return user;
  }

  // Sessions
  createSession(userId: string): string {
    const token = 'sess_' + crypto.randomBytes(24).toString('hex');
    this.data.sessions.push({ token, userId, createdAt: new Date().toISOString() });
    this.save();
    return token;
  }

  getUserBySession(token: string): User | undefined {
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return undefined;
    return this.getUserById(session.userId);
  }

  deleteSession(token: string) {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.save();
  }

  // Lessons
  getLessons(userId: string): Lesson[] {
    return this.data.lessons.filter((l) => l.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getLessonById(id: string, userId: string): Lesson | undefined {
    return this.data.lessons.find((l) => l.id === id && l.userId === userId);
  }

  saveLesson(lesson: Lesson): Lesson {
    const existingIndex = this.data.lessons.findIndex((l) => l.id === lesson.id);
    if (existingIndex >= 0) {
      this.data.lessons[existingIndex] = lesson;
    } else {
      this.data.lessons.unshift(lesson);
    }
    this.save();
    return lesson;
  }

  toggleSaveLesson(id: string, userId: string): boolean {
    const lesson = this.getLessonById(id, userId);
    if (!lesson) return false;
    lesson.isSaved = !lesson.isSaved;
    this.save();
    return lesson.isSaved;
  }

  // Quizzes
  createQuiz(quiz: Quiz): Quiz {
    this.data.quizzes.unshift(quiz);
    this.save();
    return quiz;
  }

  getQuizById(id: string, userId: string): Quiz | undefined {
    return this.data.quizzes.find((q) => q.id === id && q.userId === userId);
  }

  // Quiz Attempts
  recordAttempt(attempt: QuizAttempt): QuizAttempt {
    const existingIndex = this.data.attempts.findIndex((a) => a.id === attempt.id);
    if (existingIndex >= 0) {
      this.data.attempts[existingIndex] = attempt;
    } else {
      this.data.attempts.unshift(attempt);
    }
    this.save();
    return attempt;
  }

  getAttempts(userId: string): QuizAttempt[] {
    const userAttempts = this.data.attempts.filter((a) => a.userId === userId);
    const seen = new Set<string>();
    const uniqueAttempts = userAttempts.filter((a) => {
      if (!a.id || seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
    return uniqueAttempts.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  // Recommendations
  recordRecommendation(rec: LearningRecommendation): LearningRecommendation {
    const existingIndex = this.data.recommendations.findIndex((r) => r.id === rec.id);
    if (existingIndex >= 0) {
      this.data.recommendations[existingIndex] = rec;
    } else {
      this.data.recommendations.unshift(rec);
    }
    this.save();
    return rec;
  }

  getRecommendations(userId: string): LearningRecommendation[] {
    const userRecs = this.data.recommendations.filter((r) => r.userId === userId);
    const seen = new Set<string>();
    const uniqueRecs = userRecs.filter((r) => {
      if (!r.id || seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
    return uniqueRecs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getLatestRecommendation(userId: string, topic?: string): LearningRecommendation | undefined {
    return this.data.recommendations.find((r) => r.userId === userId && (!topic || r.topic.toLowerCase() === topic.toLowerCase()));
  }
}

const db = new Database();

// Adaptive Engine Rules & Recommendation Service
export function calculateAdaptiveRecommendation(
  currentLevel: 'Beginner' | 'Intermediate' | 'Advanced',
  score: number,
  topic: string,
  weakConcepts: string[]
): { recommendedLevel: 'Beginner' | 'Intermediate' | 'Advanced'; reason: string } {
  const levels: ('Beginner' | 'Intermediate' | 'Advanced')[] = ['Beginner', 'Intermediate', 'Advanced'];
  const currentIndex = levels.indexOf(currentLevel);

  if (score < 40) {
    const nextIndex = Math.max(0, currentIndex - 1);
    const recommended = levels[nextIndex];
    const weakList = weakConcepts.length > 0 ? ` Reinforcing detected weak concepts: ${weakConcepts.slice(0, 3).join(', ')}.` : '';
    return {
      recommendedLevel: recommended,
      reason: `Score of ${score}% falls below the 40% mastery threshold. System adjusted difficulty down to ${recommended} to solidify core fundamentals.${weakList}`,
    };
  } else if (score < 70) {
    const weakList = weakConcepts.length > 0 ? ` Focus on reviewing: ${weakConcepts.slice(0, 3).join(', ')}.` : '';
    return {
      recommendedLevel: currentLevel,
      reason: `Score of ${score}% demonstrates developing proficiency (40-69% range). Maintaining ${currentLevel} level to reinforce core mechanisms.${weakList}`,
    };
  } else if (score < 85) {
    const nextIndex = Math.min(levels.length - 1, currentIndex + 1);
    const recommended = levels[nextIndex];
    return {
      recommendedLevel: recommended,
      reason: `Score of ${score}% achieved target proficiency (70-84% range). Advancing to ${recommended} level for deeper conceptual and practical challenges.`,
    };
  } else {
    const nextIndex = Math.min(levels.length - 1, currentIndex + 1);
    const recommended = levels[nextIndex];
    return {
      recommendedLevel: recommended,
      reason: `Exemplary score of ${score}% (85-100% mastery). Advanced to ${recommended} with extension challenges and architectural edge-case reasoning.`,
    };
  }
}

// Authentication Middleware
function authenticate(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '') || (req.query.token as string);

  if (!token) {
    // If running in development without auth token, bind to demo student
    const defaultUser = db.getUserById('usr_student_demo_1');
    if (defaultUser) {
      (req as any).user = defaultUser;
      return next();
    }
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = db.getUserBySession(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }

  (req as any).user = user;
  next();
}

// API Routes

// 1. Auth Endpoints
app.post('/api/auth/register', (req, res) => {
  const { displayName, email, password, preferredLevel, learningPreference } = req.body;

  if (!displayName || !email || !password) {
    return res.status(400).json({ error: 'Display name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const newUser: User = {
    id: 'usr_' + crypto.randomUUID(),
    displayName: displayName.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    preferredLevel: preferredLevel || 'Beginner',
    learningPreference: learningPreference || 'Simple explanations',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createUser(newUser);
  const token = db.createSession(newUser.id);

  const { passwordHash, ...safeUser } = newUser;
  return res.status(201).json({ user: safeUser, token });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.getUserByEmail(email);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = db.createSession(user.id);
  const { passwordHash, ...safeUser } = user;
  return res.json({ user: safeUser, token });
});

app.post('/api/auth/logout', authenticate, (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  if (token) {
    db.deleteSession(token);
  }
  return res.json({ message: 'Logged out successfully' });
});

function cleanJsonFromLlm(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

app.post('/api/auth/google', (req, res) => {
  const { credential, email: fallbackEmail, displayName: fallbackName } = req.body;

  let email = fallbackEmail;
  let displayName = fallbackName || 'Google Student';

  if (credential) {
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
        const payload = JSON.parse(payloadJson);
        if (payload.email) {
          email = payload.email;
        }
        if (payload.name) {
          displayName = payload.name;
        }
      }
    } catch (e) {
      console.warn('Failed to parse Google JWT credential:', e);
    }
  }

  if (!email) {
    return res.status(400).json({ error: 'Valid Google email is required for authentication' });
  }

  let user = db.getUserByEmail(email);
  if (!user) {
    user = {
      id: 'usr_g_' + crypto.randomUUID(),
      displayName: displayName.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(crypto.randomBytes(16).toString('hex')),
      preferredLevel: 'Intermediate',
      learningPreference: 'Practical coding',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.createUser(user);
  }

  const token = db.createSession(user.id);
  const { passwordHash, ...safeUser } = user;
  return res.json({ user: safeUser, token });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const { passwordHash, ...safeUser } = user;
  return res.json({ user: safeUser });
});

// 2. Lesson Generation Endpoints
app.post('/api/lessons/generate', authenticate, async (req, res) => {
  try {
    const user = (req as any).user as User;
    const { topic, subject = 'Computer Science & AI', proficiencyLevel, contentType, learningPreference, goals } = req.body;

    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const level = proficiencyLevel || user.preferredLevel || 'Beginner';
    const preference = learningPreference || user.learningPreference || 'Simple explanations';
    const cType = contentType || 'Step-by-step tutorial';

    // Retrieve past learning performance & weak concepts for this topic
    const latestRec = db.getLatestRecommendation(user.id, topic);
    const previousScore = latestRec ? `${latestRec.latestScore}%` : 'No prior quiz attempts';
    const weakConcepts = latestRec?.weakConcepts && latestRec.weakConcepts.length > 0 ? latestRec.weakConcepts.join(', ') : 'None identified yet';

    const systemInstruction = `You are LearnWise AI, an expert, rigorous academic tutor specializing in computer science, artificial intelligence, and STEM education.
Your goal is to generate structured, pedgogically sound personalized learning content adapted to the student's exact proficiency tier.

Level-Specific Calibration:
- Beginner: Assume little prior knowledge. Use simple language, accessible everyday analogies, step-by-step mechanisms, clean foundational examples, and avoid unexplained jargon.
- Intermediate: Assume solid fundamental fluency. Emphasize idioms, internal mechanisms, relations between components, practical engineering problems, and balanced trade-offs.
- Advanced: Assume deep mastery. Use rigorous technical precision, discuss big-O algorithmic time/space complexity, edge cases, concurrent or distributed scaling implications, and analytical coding patterns. Avoid trivial beginner explanations.

Adaptive Context:
- Latest Quiz Score: ${previousScore}
- Detected Weak Concepts: ${weakConcepts}
If recent scores show difficulty or weak concepts are flagged, explicitly address those prerequisite misunderstandings in the explanation and worked examples.

Return strict JSON conforming to this schema:
{
  "learningObjectives": ["string"],
  "explanation": "string (formatted with paragraphs and markdown when useful)",
  "keyConcepts": [{"term": "string", "definition": "string"}],
  "workedExamples": [{"title": "string", "code": "string", "explanation": "string"}],
  "importantNotes": ["string"],
  "commonMisconceptions": [{"misconception": "string", "clarification": "string"}],
  "practiceExercises": [{"problem": "string", "hint": "string"}],
  "knowledgeCheck": [{"question": "string", "answer": "string"}],
  "suggestedNextStep": "string"
}`;

    const prompt = `Topic: "${topic}"
Subject Domain: "${subject}"
Student Proficiency Level: "${level}"
Content Type: "${cType}"
Student Learning Preference: "${preference}"
${goals ? `Student Learning Goals: "${goals}"` : ''}

Generate the comprehensive structured lesson following the instructions.`;

    let generatedContent: LessonContent;

    if (process.env.GEMINI_API_KEY) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const responseText = response.text || '';
      try {
        generatedContent = JSON.parse(cleanJsonFromLlm(responseText));
      } catch (parseError) {
        console.error('Failed to parse Gemini response as JSON:', responseText);
        throw new Error('AI response formatting error');
      }
    } else {
      // Offline fallback generator for development preview if API key not yet injected
      generatedContent = {
        learningObjectives: [
          `Master fundamental mechanisms of ${topic} at the ${level} tier`,
          `Analyze practical patterns aligned with ${preference} style`,
          `Avoid common pitfalls and edge cases in ${topic}`,
        ],
        explanation: `${topic} is a cornerstone concept in ${subject}. At the ${level} proficiency tier, understanding the underlying execution model and algorithmic guarantees allows engineers to write cleaner, more performant software.\n\nWhen applying ${topic}, prioritize deterministic behavior, minimal cognitive load, and idiomatic conventions.`,
        keyConcepts: [
          { term: `${topic} Core Primitive`, definition: `The foundational operational structure governing ${topic} execution.` },
          { term: 'State Lifecycle', definition: 'The series of transitions and variable mutations during execution.' },
          { term: 'Complexity Guarantee', definition: 'The mathematical bound on time and space resources consumed.' },
        ],
        workedExamples: [
          {
            title: `Practical Demonstration: ${topic}`,
            code: `# Practical ${level} demonstration of ${topic}
def process_data(items):
    results = []
    for item in items:
        # Applying ${level} logic
        transformed = item * 2
        results.append(transformed)
    return results

print(process_data([1, 2, 3, 4]))  # [2, 4, 6, 8]`,
            explanation: `Demonstrates clean iteration and state preservation suitable for ${level} practitioners.`,
          },
        ],
        importantNotes: [
          `Always benchmark ${topic} against edge cases such as empty inputs or boundary values.`,
          `Favor readable, standard library constructs over premature micro-optimizations.`,
        ],
        commonMisconceptions: [
          {
            misconception: `Assume ${topic} behaves identically across all runtimes.`,
            clarification: `Compiler optimizations and interpreter differences can impact execution characteristics.`,
          },
        ],
        practiceExercises: [
          { problem: `Implement a robust function demonstrating ${topic} with boundary validation.`, hint: `Check input lengths and types before execution.` },
        ],
        knowledgeCheck: [
          { question: `What is the key principle behind ${topic}?`, answer: `Deterministic state transitions and predictable memory characteristics.` },
        ],
        suggestedNextStep: `Take the diagnostic quiz to evaluate your retention and generate an adaptive progression path.`,
      };
    }

    const lesson: Lesson = {
      id: 'lsn_' + crypto.randomUUID(),
      userId: user.id,
      topic: topic.trim(),
      subject: subject.trim(),
      proficiencyLevel: level,
      contentType: cType,
      learningPreference: preference,
      generatedContent,
      promptVersion: 'v2.1',
      isSaved: false,
      createdAt: new Date().toISOString(),
    };

    db.saveLesson(lesson);
    return res.status(201).json({ lesson });
  } catch (error: any) {
    console.error('Error generating lesson:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate personalized lesson' });
  }
});

app.get('/api/lessons', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const lessons = db.getLessons(user.id);
  return res.json({ lessons });
});

app.get('/api/lessons/:id', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const lesson = db.getLessonById(req.params.id, user.id);
  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }
  return res.json({ lesson });
});

app.post('/api/lessons/:id/save', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const isSaved = db.toggleSaveLesson(req.params.id, user.id);
  return res.json({ isSaved });
});

app.post('/api/lessons/:id/simplify', authenticate, async (req, res) => {
  try {
    const user = (req as any).user as User;
    const lesson = db.getLessonById(req.params.id, user.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    let simplifiedText = '';
    if (process.env.GEMINI_API_KEY) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are LearnWise AI. Re-explain the following lesson topic in remarkably clear, simple, intuitive language using a real-world analogy. Avoid complex jargon. Break down the concept into 3 easy visual steps.\n\nTopic: ${lesson.topic}\nCurrent Explanation: ${lesson.generatedContent.explanation}`,
        config: {
          temperature: 0.5,
        },
      });
      simplifiedText = response.text || '';
    } else {
      simplifiedText = `### Simplified Explanation: ${lesson.topic}\n\nThink of ${lesson.topic} like an automated assembly line in a toy factory. Instead of hand-assembling every single toy one by one from scratch, you set up a belt that moves each item forward automatically, performs the exact step needed, and checks if the batch is done.\n\n1. **Step 1 (Start)**: The conveyor belt takes the first item.\n2. **Step 2 (Action)**: The machine applies the required paint or screw.\n3. **Step 3 (Check)**: If there are more toys left, it repeats; otherwise, it stops automatically.`;
    }

    return res.json({ simplifiedText });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to simplify explanation' });
  }
});

app.post('/api/lessons/:id/expand', authenticate, async (req, res) => {
  try {
    const user = (req as any).user as User;
    const lesson = db.getLessonById(req.params.id, user.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    let expandedText = '';
    if (process.env.GEMINI_API_KEY) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are LearnWise AI. Deeply expand upon the following lesson topic for an advanced computer science / AI student. Include formal computational complexity (Big-O time and space), hardware/memory cache locality implications, concurrent execution edge cases, and industry-grade engineering practices.\n\nTopic: ${lesson.topic}\nCurrent Explanation: ${lesson.generatedContent.explanation}`,
        config: {
          temperature: 0.6,
        },
      });
      expandedText = response.text || '';
    } else {
      expandedText = `### In-Depth Architectural Analysis: ${lesson.topic}\n\n#### 1. Computational & Asymptotic Complexity\n- **Time Complexity**: Standard sequential traversal exhibits $O(n)$ bounds. Nested constructs multiply execution orders to $O(n^2)$ or $O(n \\cdot m)$, necessitating hash-map indexed lookups ($O(1)$ amortized) when dataset size exceeds cache boundaries.\n- **Space Complexity**: Generator iteration maintains $O(1)$ auxiliary space footprint by streaming elements lazily without materializing full lists in RAM.\n\n#### 2. Memory Hierarchy & CPU Cache Locality\nContiguous array buffers take advantage of L1/L2 prefetching lines. Linked structures or boxed reference pointers incur pointer indirection penalties and CPU cache misses.\n\n#### 3. Concurrency & Reentrancy\nWhen iterating over shared data structures in multithreaded environments, iterator invalidation or race conditions will occur unless guarded by reader-writer locks or immutable copy-on-write snapshot semantics.`;
    }

    return res.json({ expandedText });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to expand explanation' });
  }
});

// 3. Quiz Endpoints
app.post('/api/quizzes/generate', authenticate, async (req, res) => {
  try {
    const user = (req as any).user as User;
    const { topic, proficiencyLevel, lessonId } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required for quiz generation' });
    }

    const level = proficiencyLevel || user.preferredLevel || 'Beginner';

    const systemInstruction = `You are LearnWise AI Assessment Engine.
Generate an interactive diagnostic quiz with EXACTLY 5 multiple-choice questions testing student mastery of "${topic}" at the "${level}" level.

Requirements:
- Exactly 5 questions.
- Each question MUST have exactly 4 options.
- Exactly one option is correct (correctAnswerIndex must be an integer between 0 and 3).
- Provide a clear, educational explanation for why that answer is correct.
- Specify the specific concept or skill being tested in "conceptTested" (e.g., "nested loop index bound", "accumulator initialization", "memory efficiency").
- Level-appropriate: Beginner tests core definitions and basic code output; Intermediate tests mechanisms, edge cases, and idioms; Advanced tests big-O complexity, tricky code execution, and architectural subtleties.

Return strict JSON conforming to this schema:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswerIndex": 0,
      "explanation": "string",
      "conceptTested": "string",
      "difficulty": "${level}"
    }
  ]
}`;

    let parsedQuestions: QuizQuestion[] = [];

    if (process.env.GEMINI_API_KEY) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Generate 5 multiple choice questions for Topic: "${topic}", Level: "${level}".`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.5,
        },
      });

      const text = response.text || '';
      try {
        const parsed = JSON.parse(cleanJsonFromLlm(text));
        parsedQuestions = (parsed.questions || []).map((q: any, i: number) => ({
          id: `q_${i + 1}`,
          question: q.question,
          options: q.options,
          correctAnswerIndex: Number(q.correctAnswerIndex),
          explanation: q.explanation,
          conceptTested: q.conceptTested || topic,
          difficulty: level,
        }));
      } catch (err) {
        console.error('Quiz JSON parse failed:', text);
        throw new Error('AI quiz formatting error');
      }
    } else {
      // Offline fallback quiz
      parsedQuestions = [
        {
          id: 'q_1',
          question: `What is the primary role of iteration in ${topic}?`,
          options: [
            'To repeat instructions over a sequence or until a condition is met',
            'To compile code into binary machine language',
            'To allocate permanent hard disk storage',
            'To bypass type checking at runtime',
          ],
          correctAnswerIndex: 0,
          explanation: 'Iteration repeatedly executes statements until termination criteria are reached.',
          conceptTested: 'iteration definition and purpose',
          difficulty: level,
        },
        {
          id: 'q_2',
          question: `In ${topic}, which condition leads directly to an infinite loop?`,
          options: [
            'Using an immutable data structure',
            'The loop termination condition never evaluates to False',
            'Iterating over a collection with zero elements',
            'Using type annotations in function signatures',
          ],
          correctAnswerIndex: 1,
          explanation: 'When the guard condition never transitions to False, execution runs indefinitely.',
          conceptTested: 'loop termination invariants',
          difficulty: level,
        },
        {
          id: 'q_3',
          question: `How does lazy evaluation benefit iteration when processing millions of records?`,
          options: [
            'It forces all items into RAM simultaneously',
            'It yields items one by one, preserving constant O(1) memory footprint',
            'It automatically parallelizes across GPU shaders',
            'It disables garbage collection',
          ],
          correctAnswerIndex: 1,
          explanation: 'Lazy evaluation streams records on demand without materializing massive arrays in memory.',
          conceptTested: 'lazy iterator memory efficiency',
          difficulty: level,
        },
        {
          id: 'q4',
          question: `What is the time complexity of scanning an unsorted array of size N using a single loop?`,
          options: ['O(1)', 'O(log N)', 'O(N)', 'O(N^2)'],
          correctAnswerIndex: 2,
          explanation: 'Examining each item sequentially in an array of size N requires linear time O(N).',
          conceptTested: 'asymptotic linear traversal complexity',
          difficulty: level,
        },
        {
          id: 'q_5',
          question: `What is considered a best practice when writing loop control conditions?`,
          options: [
            'Modifying the container length directly inside the for loop',
            'Keeping loop conditions deterministic with clear progress towards termination',
            'Using global variables to track loop indices',
            'Avoiding break or continue statements entirely in all languages',
          ],
          correctAnswerIndex: 1,
          explanation: 'Ensuring deterministic progress toward the termination condition guarantees program termination.',
          conceptTested: 'loop safety and termination proof',
          difficulty: level,
        },
      ];
    }

    const quiz: Quiz = {
      id: 'qz_' + crypto.randomUUID(),
      userId: user.id,
      lessonId: lessonId || null,
      topic: topic.trim(),
      proficiencyLevel: level,
      questions: parsedQuestions,
      createdAt: new Date().toISOString(),
    };

    db.createQuiz(quiz);

    // CRITICAL: Strip correctAnswerIndex before sending to client to prevent inspect-element cheating!
    const clientSafeQuestions = quiz.questions.map(({ correctAnswerIndex, ...safeQ }) => safeQ);

    return res.status(201).json({
      quiz: {
        ...quiz,
        questions: clientSafeQuestions,
      },
    });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate quiz' });
  }
});

app.get('/api/quizzes/history', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const attempts = db.getAttempts(user.id) || [];
  return res.json({ attempts });
});

app.get('/api/quizzes/:id', authenticate, (req, res) => {
  const user = (req as any).user as User;
  if (req.params.id === 'history') {
    const attempts = db.getAttempts(user.id) || [];
    return res.json({ attempts });
  }

  const quiz = db.getQuizById(req.params.id, user.id);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

  // Return questions without correctAnswerIndex
  const clientSafeQuestions = quiz.questions.map(({ correctAnswerIndex, ...safeQ }) => safeQ);
  return res.json({
    quiz: {
      ...quiz,
      questions: clientSafeQuestions,
    },
  });
});

app.post('/api/quizzes/:id/submit', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const quiz = db.getQuizById(req.params.id, user.id);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

  const { answers } = req.body as { answers: QuizAnswerSubmission[] };
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'Answers array is required' });
  }

  // Server-authoritative scoring against stored questions
  let correctCount = 0;
  const evaluatedAnswers: EvaluatedAnswer[] = [];
  const weakConcepts: string[] = [];

  for (const q of quiz.questions) {
    const submission = answers.find((a) => a.questionId === q.id);
    const selectedIndex = submission !== undefined ? submission.selectedAnswerIndex : -1;
    const isCorrect = selectedIndex === q.correctAnswerIndex;

    if (isCorrect) {
      correctCount++;
    } else {
      if (q.conceptTested && !weakConcepts.includes(q.conceptTested)) {
        weakConcepts.push(q.conceptTested);
      }
    }

    evaluatedAnswers.push({
      questionId: q.id,
      question: q.question,
      options: q.options,
      selectedAnswerIndex: selectedIndex,
      correctAnswerIndex: q.correctAnswerIndex,
      isCorrect,
      explanation: q.explanation,
      conceptTested: q.conceptTested,
    });
  }

  const totalQuestions = quiz.questions.length;
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

  // Run Adaptive Engine calculation
  const adaptiveResult = calculateAdaptiveRecommendation(quiz.proficiencyLevel, scorePercentage, quiz.topic, weakConcepts);

  const attempt: QuizAttempt = {
    id: 'att_' + crypto.randomUUID(),
    userId: user.id,
    quizId: quiz.id,
    topic: quiz.topic,
    proficiencyLevel: quiz.proficiencyLevel,
    score: scorePercentage,
    totalQuestions,
    correctAnswers: correctCount,
    submittedAt: new Date().toISOString(),
    answers: evaluatedAnswers,
  };

  db.recordAttempt(attempt);

  const recommendation: LearningRecommendation = {
    id: 'rec_' + crypto.randomUUID(),
    userId: user.id,
    topic: quiz.topic,
    previousLevel: quiz.proficiencyLevel,
    recommendedLevel: adaptiveResult.recommendedLevel,
    latestScore: scorePercentage,
    recommendationReason: adaptiveResult.reason,
    weakConcepts,
    createdAt: new Date().toISOString(),
  };

  db.recordRecommendation(recommendation);

  // Update user default level if recommendation suggests advancement
  db.updateUser(user.id, { preferredLevel: adaptiveResult.recommendedLevel });

  return res.json({
    attempt,
    recommendation,
  });
});

// 4. Progress & Analytics Endpoints
app.get('/api/progress/summary', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const lessons = db.getLessons(user.id);
  const attempts = db.getAttempts(user.id);
  const recommendations = db.getRecommendations(user.id);

  const totalLessons = lessons.length;
  const totalQuizzes = attempts.length;
  const averageScore = totalQuizzes > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalQuizzes) : 0;

  // Calculate learning streak (days with at least 1 lesson or quiz activity)
  const activityDates = new Set<string>();
  lessons.forEach((l) => activityDates.add(l.createdAt.split('T')[0]));
  attempts.forEach((a) => activityDates.add(a.submittedAt.split('T')[0]));
  const streakDays = activityDates.size;

  // Chart data: chronological scores
  const scoreTimeline = [...attempts]
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
    .map((att, idx) => ({
      index: idx + 1,
      date: new Date(att.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: att.score,
      topic: att.topic,
      level: att.proficiencyLevel,
    }));

  return res.json({
    totalLessons,
    totalQuizzes,
    averageScore,
    streakDays,
    scoreTimeline,
    latestRecommendation: recommendations[0] || null,
  });
});

app.get('/api/progress/topics', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const attempts = db.getAttempts(user.id);

  const topicMap: Record<string, { totalAttempts: number; totalScore: number; levels: Set<string>; lastAttempt: string }> = {};

  for (const att of attempts) {
    if (!topicMap[att.topic]) {
      topicMap[att.topic] = { totalAttempts: 0, totalScore: 0, levels: new Set(), lastAttempt: att.submittedAt };
    }
    topicMap[att.topic].totalAttempts++;
    topicMap[att.topic].totalScore += att.score;
    topicMap[att.topic].levels.add(att.proficiencyLevel);
    if (new Date(att.submittedAt) > new Date(topicMap[att.topic].lastAttempt)) {
      topicMap[att.topic].lastAttempt = att.submittedAt;
    }
  }

  const topics = Object.entries(topicMap).map(([topic, data]) => ({
    topic,
    attemptsCount: data.totalAttempts,
    averageScore: Math.round(data.totalScore / data.totalAttempts),
    levelsMastered: Array.from(data.levels),
    lastAttempt: data.lastAttempt,
  }));

  return res.json({ topics });
});

app.get('/api/progress/recommendations', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const recommendations = db.getRecommendations(user.id);
  return res.json({ recommendations });
});

// 5. Profile Management
app.get('/api/profile', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const { passwordHash, ...safeUser } = user;
  return res.json({ user: safeUser });
});

app.patch('/api/profile', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const { displayName, preferredLevel, learningPreference } = req.body;

  const updated = db.updateUser(user.id, {
    ...(displayName ? { displayName: displayName.trim() } : {}),
    ...(preferredLevel ? { preferredLevel } : {}),
    ...(learningPreference ? { learningPreference } : {}),
  });

  if (!updated) return res.status(404).json({ error: 'User not found' });
  const { passwordHash, ...safeUser } = updated;
  return res.json({ user: safeUser });
});

// 6. Demo Scenario Runner (Section 16 in requirements)
// Intermediate -> 20% -> Recommend Beginner -> Beginner -> 80% -> Recommend Advanced
app.post('/api/demo/run-scenario', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const topic = 'Python loops and iteration';
  const runTag = Date.now();

  // Step 1: Intermediate attempt with 20% score
  const rec1 = calculateAdaptiveRecommendation('Intermediate', 20, topic, ['while loop condition update', 'infinite loop risk']);
  const attempt1: QuizAttempt = {
    id: `att_demo_scenario_1_${runTag}`,
    userId: user.id,
    quizId: `qz_scenario_1_${runTag}`,
    topic,
    proficiencyLevel: 'Intermediate',
    score: 20,
    totalQuestions: 5,
    correctAnswers: 1,
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    answers: [],
  };
  db.recordAttempt(attempt1);
  const recommendation1 = db.recordRecommendation({
    id: `rec_demo_scenario_1_${runTag}`,
    userId: user.id,
    topic,
    previousLevel: 'Intermediate',
    recommendedLevel: rec1.recommendedLevel,
    latestScore: 20,
    recommendationReason: rec1.reason,
    weakConcepts: ['while loop condition update', 'infinite loop risk'],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  });

  // Step 2: Beginner attempt with 80% score
  const rec2 = calculateAdaptiveRecommendation('Beginner', 80, topic, []);
  const attempt2: QuizAttempt = {
    id: `att_demo_scenario_2_${runTag}`,
    userId: user.id,
    quizId: `qz_scenario_2_${runTag}`,
    topic,
    proficiencyLevel: 'Beginner',
    score: 80,
    totalQuestions: 5,
    correctAnswers: 4,
    submittedAt: new Date().toISOString(),
    answers: [],
  };
  db.recordAttempt(attempt2);
  const recommendation2 = db.recordRecommendation({
    id: `rec_demo_scenario_2_${runTag}`,
    userId: user.id,
    topic,
    previousLevel: 'Beginner',
    recommendedLevel: rec2.recommendedLevel,
    latestScore: 80,
    recommendationReason: rec2.reason,
    weakConcepts: [],
    createdAt: new Date().toISOString(),
  });

  return res.json({
    message: 'Demo scenario executed successfully: Intermediate (20%) -> Recommended Beginner -> Beginner (80%) -> Recommended Intermediate/Advanced',
    scenario: [
      { step: 1, level: 'Intermediate', score: 20, recommendation: recommendation1 },
      { step: 2, level: 'Beginner', score: 80, recommendation: recommendation2 },
    ],
  });
});

// Setup Vite middleware for development
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LearnWise AI] Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
