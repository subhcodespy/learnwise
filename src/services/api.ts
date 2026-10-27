import {
  User,
  Lesson,
  Quiz,
  QuizAttempt,
  LearningRecommendation,
  ProgressSummary,
  TopicAnalytic,
  ProficiencyLevel,
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('learnwise_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async register(data: {
    displayName: string;
    email: string;
    password: string;
    preferredLevel?: string;
    learningPreference?: string;
  }): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }
    const result = await res.json();
    localStorage.setItem('learnwise_token', result.token);
    return result;
  },

  async login(data: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Invalid credentials');
    }
    const result = await res.json();
    localStorage.setItem('learnwise_token', result.token);
    return result;
  },

  async loginWithGoogle(
    credential?: string,
    fallback?: { email: string; displayName: string }
  ): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, ...fallback }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Google login failed' }));
      throw new Error(err.error || 'Google login failed');
    }
    const result = await res.json();
    localStorage.setItem('learnwise_token', result.token);
    return result;
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } finally {
      localStorage.removeItem('learnwise_token');
    }
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Not authenticated');
    }
    return res.json();
  },

  // Lessons
  async generateLesson(data: {
    topic: string;
    subject?: string;
    proficiencyLevel?: ProficiencyLevel;
    contentType?: string;
    learningPreference?: string;
    goals?: string;
  }): Promise<{ lesson: Lesson }> {
    const res = await fetch(`${API_BASE}/lessons/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lesson generation failed' }));
      throw new Error(err.error || 'Failed to generate lesson');
    }
    return res.json();
  },

  async getLessons(): Promise<{ lessons: Lesson[] }> {
    const res = await fetch(`${API_BASE}/lessons`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch lessons');
    return res.json();
  },

  async getLesson(id: string): Promise<{ lesson: Lesson }> {
    const res = await fetch(`${API_BASE}/lessons/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch lesson');
    return res.json();
  },

  async toggleSaveLesson(id: string): Promise<{ isSaved: boolean }> {
    const res = await fetch(`${API_BASE}/lessons/${id}/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to bookmark lesson');
    return res.json();
  },

  async simplifyLesson(id: string): Promise<{ simplifiedText: string }> {
    const res = await fetch(`${API_BASE}/lessons/${id}/simplify`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to generate simplified explanation');
    return res.json();
  },

  async expandLesson(id: string): Promise<{ expandedText: string }> {
    const res = await fetch(`${API_BASE}/lessons/${id}/expand`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to generate expanded explanation');
    return res.json();
  },

  // Quizzes
  async generateQuiz(data: {
    topic: string;
    proficiencyLevel?: ProficiencyLevel;
    lessonId?: string;
  }): Promise<{ quiz: Quiz }> {
    const res = await fetch(`${API_BASE}/quizzes/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Quiz generation failed' }));
      throw new Error(err.error || 'Failed to generate quiz');
    }
    return res.json();
  },

  async getQuiz(id: string): Promise<{ quiz: Quiz }> {
    const res = await fetch(`${API_BASE}/quizzes/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch quiz');
    return res.json();
  },

  async submitQuiz(
    quizId: string,
    answers: { questionId: string; selectedAnswerIndex: number }[]
  ): Promise<{ attempt: QuizAttempt; recommendation: LearningRecommendation }> {
    const res = await fetch(`${API_BASE}/quizzes/${quizId}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Submission failed' }));
      throw new Error(err.error || 'Failed to submit quiz');
    }
    return res.json();
  },

  async getQuizHistory(): Promise<{ attempts: QuizAttempt[] }> {
    const res = await fetch(`${API_BASE}/quizzes/history`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch quiz history');
    return res.json();
  },

  // Analytics & Progress
  async getProgressSummary(): Promise<ProgressSummary> {
    const res = await fetch(`${API_BASE}/progress/summary`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch progress summary');
    return res.json();
  },

  async getTopicAnalytics(): Promise<{ topics: TopicAnalytic[] }> {
    const res = await fetch(`${API_BASE}/progress/topics`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch topic analytics');
    return res.json();
  },

  async getRecommendations(): Promise<{ recommendations: LearningRecommendation[] }> {
    const res = await fetch(`${API_BASE}/progress/recommendations`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  },

  // Profile
  async updateProfile(data: {
    displayName?: string;
    preferredLevel?: string;
    learningPreference?: string;
  }): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // Demo Scenario
  async runDemoScenario(): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/run-scenario`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to run demo scenario');
    return res.json();
  },
};
