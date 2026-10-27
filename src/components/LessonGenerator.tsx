import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ProficiencyLevel, Lesson } from '../types';
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  ArrowRight,
  Layers,
  Code,
  Compass,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface LessonGeneratorProps {
  onLessonGenerated: (lesson: Lesson) => void;
  onCancel: () => void;
}

export const LessonGenerator: React.FC<LessonGeneratorProps> = ({
  onLessonGenerated,
  onCancel,
}) => {
  const { user } = useAuth();

  const [topic, setTopic] = useState('Python loops and iteration');
  const [subject, setSubject] = useState('Computer Science & AI');
  const [proficiencyLevel, setProficiencyLevel] = useState<ProficiencyLevel>(
    user?.preferredLevel || 'Intermediate'
  );
  const [contentType, setContentType] = useState('Step-by-step tutorial');
  const [learningPreference, setLearningPreference] = useState(
    user?.learningPreference || 'Practical coding'
  );
  const [goals, setGoals] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  const suggestedTopics = [
    'Python loops and iteration',
    'Binary Search Trees & Balancing',
    'Gradient Descent & Backpropagation',
    'Transformer Attention Mechanism',
    'Hash Tables & Collision Resolution',
    'Dynamic Programming: Knapsack Problem',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please enter a learning topic');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLoadingStep('Retrieving historical performance & gap analysis...');

      setTimeout(() => {
        setLoadingStep('Injecting adaptive parameters & assembling Gemini prompt...');
      }, 700);

      setTimeout(() => {
        setLoadingStep('Synthesizing structured lesson with verified code examples...');
      }, 1500);

      const res = await api.generateLesson({
        topic: topic.trim(),
        subject: subject.trim(),
        proficiencyLevel,
        contentType,
        learningPreference,
        goals: goals.trim() || undefined,
      });

      onLessonGenerated(res.lesson);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate personalized content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
      <div className="mb-8">
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          AI-Powered Curriculum Synthesis
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
          Generate Personalized Learning Content
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Specify your subject domain, target proficiency tier, and pedagogy preferences. Gemini AI will synthesize a structured, verified learning module.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        {/* Topic Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
            Learning Topic <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Python loops and iteration, Graph Neural Networks..."
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
          />

          {/* Quick-Pick Chips */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-2xs text-slate-400 mr-1">Suggested:</span>
            {suggestedTopics.map((item, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setTopic(item)}
                className="text-2xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Domain & Proficiency Level in 2 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
              Subject Domain
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            >
              <option value="Computer Science & AI">Computer Science & AI</option>
              <option value="Machine Learning & Deep Learning">Machine Learning & Deep Learning</option>
              <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
              <option value="Mathematics for Engineering">Mathematics for Engineering</option>
              <option value="Software Systems & Architecture">Software Systems & Architecture</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
              Target Proficiency Tier <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setProficiencyLevel(lvl)}
                  className={`py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    proficiencyLevel === lvl
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <p className="text-2xs text-slate-500 mt-1.5">
              {proficiencyLevel === 'Beginner' && 'Foundational concepts, everyday analogies, simple line-by-line syntax.'}
              {proficiencyLevel === 'Intermediate' && 'Mechanisms, relationships, idioms, and practical application problems.'}
              {proficiencyLevel === 'Advanced' && 'Asymptotic Big-O complexity, memory hierarchy, edge cases, and architectural scaling.'}
            </p>
          </div>
        </div>

        {/* Content Type & Learning Preference in 2 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
              Content Format
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            >
              <option value="Step-by-step tutorial">Step-by-step tutorial</option>
              <option value="Practical examples">Practical examples & exercises</option>
              <option value="Exam revision notes">Exam revision notes</option>
              <option value="Deep conceptual explanation">Deep conceptual explanation</option>
              <option value="Condensed cheatsheet">Condensed cheatsheet</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
              Preferred Learning Style
            </label>
            <select
              value={learningPreference}
              onChange={(e) => setLearningPreference(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            >
              <option value="Practical coding">Practical coding & runnable snippets</option>
              <option value="Simple explanations">Simple explanations & clear analogies</option>
              <option value="Examples first">Worked examples first, theory second</option>
              <option value="Exam-focused">Exam-focused definitions & pitfalls</option>
            </select>
          </div>
        </div>

        {/* Optional Student Goals */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
            Specific Learning Goals <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={2}
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="e.g. Prepare for mid-semester exam on algorithmic complexity, or understand how to prevent infinite while loops in Python..."
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors resize-none"
          />
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{loadingStep || 'Generating Content...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Personalized Lesson</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
