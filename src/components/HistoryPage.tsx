import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Lesson, QuizAttempt, ProficiencyLevel } from '../types';
import {
  BookOpen,
  Award,
  Search,
  Filter,
  Bookmark,
  Calendar,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface HistoryPageProps {
  onOpenLesson: (lessonId: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onOpenLesson }) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'quizzes' | 'saved'>('lessons');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [lesRes, attRes] = await Promise.allSettled([
          api.getLessons(),
          api.getQuizHistory(),
        ]);
        if (lesRes.status === 'fulfilled') {
          setLessons(lesRes.value?.lessons || []);
        }
        if (attRes.status === 'fulfilled') {
          setAttempts(attRes.value?.attempts || []);
        }
      } catch (err) {
        console.error('Failed to load history records:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredLessons = lessons.filter((l) => {
    const matchesSearch = l.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || l.proficiencyLevel === levelFilter;
    const matchesSaved = activeTab === 'saved' ? l.isSaved : true;
    return matchesSearch && matchesLevel && matchesSaved;
  });

  const filteredAttempts = attempts.filter((a) => {
    const matchesSearch = a.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || a.proficiencyLevel === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Persistent Student Record
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Learning History & Archives
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Review previous lesson modules, diagnostic test attempts, and demonstrated mastery milestones.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === 'lessons'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Lessons ({lessons.length})
          </button>

          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === 'quizzes'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Quiz Attempts ({attempts.length})
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Saved Bookmarks ({lessons.filter((l) => l.isSaved).length})
          </button>
        </div>
      </div>

      {/* Search & Level Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search learning topics by keyword..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
          >
            <option value="all">All Difficulty Tiers</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Main Content Feed */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading records...</p>
        </div>
      ) : activeTab === 'quizzes' ? (
        /* Quiz Attempts List */
        <div className="space-y-3">
          {filteredAttempts.length > 0 ? (
            filteredAttempts.map((att, idx) => (
              <div
                key={`hist-att-${att.id}-${idx}`}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">{att.topic}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-2xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {att.proficiencyLevel} Tier
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{att.correctAnswers} of {att.totalQuestions} questions correct</span>
                    <span aria-hidden="true">·</span>
                    <span>{new Date(att.submittedAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    className={`px-3 py-1.5 rounded-lg font-mono text-sm font-bold ${
                      att.score >= 70
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : att.score >= 40
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {att.score}%
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-xs text-slate-400 space-y-2">
              <Award className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No matching quiz attempts found.</p>
            </div>
          )}
        </div>
      ) : (
        /* Lessons List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLessons.length > 0 ? (
            filteredLessons.map((l, idx) => (
              <div
                key={`hist-les-${l.id}-${idx}`}
                onClick={() => onOpenLesson(l.id)}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-2xs text-slate-500">
                    <span className="font-semibold text-indigo-600">{l.subject}</span>
                    <span>{new Date(l.createdAt).toLocaleDateString()}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {l.topic}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {l.generatedContent.explanation}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-2xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-semibold ${
                        l.proficiencyLevel === 'Beginner'
                          ? 'bg-emerald-50 text-emerald-800'
                          : l.proficiencyLevel === 'Intermediate'
                          ? 'bg-indigo-50 text-indigo-800'
                          : 'bg-purple-50 text-purple-800'
                      }`}
                    >
                      {l.proficiencyLevel}
                    </span>
                    {l.isSaved && (
                      <span className="text-amber-600 flex items-center gap-0.5 font-medium">
                        <Bookmark className="w-3 h-3 fill-amber-500 text-amber-500" />
                        Saved
                      </span>
                    )}
                  </div>

                  <span className="text-indigo-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Read Module <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 bg-white p-12 text-center rounded-2xl border border-slate-200 text-xs text-slate-400 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No matching lessons found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
