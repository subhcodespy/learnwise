export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface User {
  id: string;
  displayName: string;
  email: string;
  preferredLevel: ProficiencyLevel;
  learningPreference: string;
  createdAt: string;
  updatedAt: string;
}

export interface KeyConcept {
  term: string;
  definition: string;
}

export interface WorkedExample {
  title: string;
  code?: string;
  explanation: string;
}

export interface Misconception {
  misconception: string;
  clarification: string;
}

export interface PracticeExercise {
  problem: string;
  hint?: string;
}

export interface KnowledgeCheckItem {
  question: string;
  answer: string;
}

export interface LessonContent {
  learningObjectives: string[];
  explanation: string;
  keyConcepts: KeyConcept[];
  workedExamples: WorkedExample[];
  importantNotes: string[];
  commonMisconceptions: Misconception[];
  practiceExercises: PracticeExercise[];
  knowledgeCheck: KnowledgeCheckItem[];
  suggestedNextStep: string;
}

export interface Lesson {
  id: string;
  userId: string;
  topic: string;
  subject: string;
  proficiencyLevel: ProficiencyLevel;
  contentType: string;
  learningPreference: string;
  generatedContent: LessonContent;
  promptVersion: string;
  isSaved: boolean;
  createdAt: string;
}

export interface QuizQuestionClient {
  id: string;
  question: string;
  options: string[];
  explanation?: string;
  conceptTested?: string;
  difficulty: ProficiencyLevel;
}

export interface Quiz {
  id: string;
  userId: string;
  lessonId: string | null;
  topic: string;
  proficiencyLevel: ProficiencyLevel;
  questions: QuizQuestionClient[];
  createdAt: string;
}

export interface EvaluatedAnswer {
  questionId: string;
  question: string;
  options: string[];
  selectedAnswerIndex: number;
  correctAnswerIndex: number;
  isCorrect: boolean;
  explanation: string;
  conceptTested: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  topic: string;
  proficiencyLevel: ProficiencyLevel;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: string;
  answers: EvaluatedAnswer[];
}

export interface LearningRecommendation {
  id: string;
  topic: string;
  previousLevel: ProficiencyLevel;
  recommendedLevel: ProficiencyLevel;
  latestScore: number;
  recommendationReason: string;
  weakConcepts: string[];
  createdAt: string;
}

export interface ProgressSummary {
  totalLessons: number;
  totalQuizzes: number;
  averageScore: number;
  streakDays: number;
  scoreTimeline: {
    index: number;
    date: string;
    score: number;
    topic: string;
    level: string;
  }[];
  latestRecommendation: LearningRecommendation | null;
}

export interface TopicAnalytic {
  topic: string;
  attemptsCount: number;
  averageScore: number;
  levelsMastered: string[];
  lastAttempt: string | null;
}
