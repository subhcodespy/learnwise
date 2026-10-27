import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ProgressSummary,
  TopicAnalytic,
  Lesson,
  QuizAttempt,
} from '../types';
import {
  BookOpen,
  Award,
  Zap,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Clock,
  PlayCircle,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Flame,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DashboardProps {
  onNavigateGenerate: () => void;
  onOpenLesson: (lessonId: string) => void;
  onStartQuiz: (quizId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateGenerate,
  onOpenLesson,
  onStartQuiz,
}) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [topics, setTopics] = useState<TopicAnalytic[]>([]);
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningDemo, setRunningDemo] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, topRes, lesRes, attRes] = await Promise.allSettled([
        api.getProgressSummary(),
        api.getTopicAnalytics(),
        api.getLessons(),
        api.getQuizHistory(),
      ]);

      if (sumRes.status === 'fulfilled') {
        setSummary(sumRes.value);
      }
      if (topRes.status === 'fulfilled') {
        setTopics(topRes.value?.topics || []);
      }
      if (lesRes.status === 'fulfilled') {
        setRecentLessons((lesRes.value?.lessons || []).slice(0, 4));
      }
      if (attRes.status === 'fulfilled') {
        setRecentAttempts((attRes.value?.attempts || []).slice(0, 4));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleRunDemoScenario = async () => {
    try {
      setRunningDemo(true);
      setDemoMessage(null);
      const res = await api.runDemoScenario();
      setDemoMessage(res.message);
      await fetchDashboardData();
    } catch (err: any) {
      setDemoMessage(`Demo error: ${err.message}`);
    } finally {
      setRunningDemo(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-500 font-medium">Synchronizing student learning records...</p>
      </div>
    );
  }

  const latestRec = summary?.latestRecommendation;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Welcome & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Student Learning Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-0.5">
            Welcome back, {user?.displayName || 'Learner'}
          </h1>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span>Current Tier: <strong className="text-slate-800 font-medium">{user?.preferredLevel || 'Beginner'}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Style: <strong className="text-slate-800 font-medium">{user?.learningPreference || 'Simple explanations'}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunDemoScenario}
            disabled={runningDemo}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Demonstrates Section 16 scenario: Intermediate (20%) -> Recommend Beginner -> Beginner (80%) -> Recommend Advanced"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${runningDemo ? 'animate-spin' : ''}`} />
            <span>Run AIML Demo Scenario</span>
          </button>

          <button
            onClick={onNavigateGenerate}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Lesson</span>
          </button>
        </div>
      </div>

      {demoMessage && (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong>Demonstration Executed:</strong> {demoMessage}
          </div>
          <button
            onClick={() => setDemoMessage(null)}
            className="text-indigo-400 hover:text-indigo-700 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Lessons Generated</span>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
            {summary?.totalLessons ?? 0}
          </div>
          <p className="text-2xs text-slate-500 mt-1">Personalized curriculum units</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Quizzes Completed</span>
            <Award className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
            {summary?.totalQuizzes ?? 0}
          </div>
          <p className="text-2xs text-slate-500 mt-1">Diagnostic evaluations</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Average Quiz Score</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
            {summary?.averageScore ?? 0}%
          </div>
          <p className="text-2xs text-slate-500 mt-1">Server-validated mastery</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Learning Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
            {summary?.streakDays ?? 1} <span className="text-sm font-sans font-normal text-slate-500">days</span>
          </div>
          <p className="text-2xs text-slate-500 mt-1">Active study streak</p>
        </div>
      </div>

      {/* Adaptive Recommendation Alert Banner */}
      {latestRec && (
        <div className="bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/40 p-5 rounded-xl border border-indigo-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider font-mono">
                Adaptive Recommendation
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs text-slate-600 font-medium">{latestRec.topic}</span>
            </div>
            <p className="text-sm text-slate-800 leading-snug">
              {latestRec.recommendationReason}
            </p>
            {latestRec.weakConcepts && latestRec.weakConcepts.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-rose-700 pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Identified gap: {latestRec.weakConcepts.join(', ')}</span>
              </div>
            )}
          </div>

          <button
            onClick={onNavigateGenerate}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shrink-0 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Learn Next: {latestRec.recommendedLevel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Chart & Topic-wise Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Progress Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Quiz Performance Trajectory</h3>
                <p className="text-xs text-slate-500">Chronological score history across diagnostic evaluations</p>
              </div>
              <span className="text-xs font-mono text-slate-400">Target ≥ 70%</span>
            </div>

            <div className="h-64 w-full">
              {summary?.scoreTimeline && summary.scoreTimeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.scoreTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      ticks={[0, 25, 50, 75, 100]}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg space-y-1">
                              <p className="font-semibold">{data.topic}</p>
                              <div className="flex justify-between gap-4 text-slate-300">
                                <span>Score:</span>
                                <span className="font-bold text-emerald-400">{data.score}%</span>
                              </div>
                              <div className="flex justify-between gap-4 text-slate-400 text-2xs">
                                <span>Tier: {data.level}</span>
                                <span>{data.date}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#scoreColor)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                  <BookOpen className="w-8 h-8 text-slate-300 mb-2" />
                  <p>No quiz attempts recorded yet.</p>
                  <p className="text-2xs text-slate-400 mt-1">Take a quiz to visualize your score progression.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Dynamic threshold: 0–39% (Demote), 40–69% (Maintain), 70–84% (Advance), 85–100% (Mastery)</span>
          </div>
        </div>

        {/* Topic-wise Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Topic-Wise Performance</h3>
            <p className="text-xs text-slate-500 mb-4">Demonstrated mastery categorized by subject area</p>

            <div className="space-y-3">
              {topics.length > 0 ? (
                topics.map((t, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
                        {t.topic}
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-600">
                        {t.averageScore}% avg
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          t.averageScore >= 70 ? 'bg-emerald-500' : t.averageScore >= 40 ? 'bg-indigo-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, t.averageScore))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-2xs text-slate-500">
                      <span>{t.attemptsCount} evaluation{t.attemptsCount > 1 ? 's' : ''}</span>
                      <span>Mastered: {t.levelsMastered.join(', ')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No topics tested yet. Generate your first topic lesson above.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-2xs text-slate-400">Records stored in PostgreSQL/SQLite</span>
            <button
              onClick={onNavigateGenerate}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              Add New Topic <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Learning Activity & Saved Lessons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Lessons */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">Recent Lessons</h3>
            <span className="text-xs text-slate-400">{recentLessons.length} units</span>
          </div>

          <div className="space-y-3">
            {recentLessons.length > 0 ? (
              recentLessons.map((l, idx) => (
                <div
                  key={`les-${l.id}-${idx}`}
                  onClick={() => onOpenLesson(l.id)}
                  className="p-3 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <h4 className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 truncate">
                      {l.topic}
                    </h4>
                    <div className="flex items-center gap-2 text-2xs text-slate-500">
                      <span>{l.proficiencyLevel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{l.contentType}</span>
                      <span aria-hidden="true">·</span>
                      <span>{new Date(l.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 shrink-0 transition-colors" />
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No lessons created yet. Click "Generate Lesson" to begin.
              </div>
            )}
          </div>
        </div>

        {/* Recent Quiz Attempts */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">Recent Quiz Evaluations</h3>
            <span className="text-xs text-slate-400">{recentAttempts.length} attempts</span>
          </div>

          <div className="space-y-3">
            {recentAttempts.length > 0 ? (
              recentAttempts.map((att, idx) => (
                <div
                  key={`att-${att.id}-${idx}`}
                  className="p-3 rounded-lg border border-slate-100 flex items-center justify-between"
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <h4 className="text-xs font-semibold text-slate-800 truncate">
                      {att.topic}
                    </h4>
                    <div className="flex items-center gap-2 text-2xs text-slate-500">
                      <span>{att.proficiencyLevel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{att.correctAnswers}/{att.totalQuestions} correct</span>
                      <span aria-hidden="true">·</span>
                      <span>{new Date(att.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md ${
                      att.score >= 70
                        ? 'bg-emerald-50 text-emerald-700'
                        : att.score >= 40
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {att.score}%
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No quizzes submitted yet. Take a quiz after generating a lesson!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
