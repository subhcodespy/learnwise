import React, { useState } from 'react';
import { Quiz, QuizAttempt, LearningRecommendation } from '../types';
import { api } from '../services/api';
import {
  BrainCircuit,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Award,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

interface QuizEngineProps {
  quiz: Quiz;
  onRetake: () => void;
  onNavigateGenerate: (recommendedLevel?: string) => void;
  onBackToDashboard: () => void;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({
  quiz,
  onRetake,
  onNavigateGenerate,
  onBackToDashboard,
}) => {
  // Current question index (0 to 4)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Selected answer index for each question: { [questionId]: selectedOptionIndex }
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Results state once server returns authoritative score and adaptive recommendation
  const [attemptResult, setAttemptResult] = useState<QuizAttempt | null>(null);
  const [recommendation, setRecommendation] = useState<LearningRecommendation | null>(null);

  const questions = quiz.questions || [];
  const currentQ = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (attemptResult) return; // Locked once submitted
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = answeredCount === totalQuestions;

  const handleSubmit = async () => {
    if (!allAnswered) {
      setSubmissionError('Please select an answer for all questions before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmissionError(null);

      const formattedAnswers = questions.map((q) => ({
        questionId: q.id,
        selectedAnswerIndex: selectedAnswers[q.id] ?? -1,
      }));

      const res = await api.submitQuiz(quiz.id, formattedAnswers);
      setAttemptResult(res.attempt);
      setRecommendation(res.recommendation);
    } catch (err: any) {
      setSubmissionError(err.message || 'Failed to submit quiz to evaluation server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If results have been returned, render post-submission breakdown view
  if (attemptResult) {
    const scorePct = attemptResult.score;
    const isPassing = scorePct >= 70;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Results Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                <span>Diagnostic Assessment Complete</span>
                <span aria-hidden="true">·</span>
                <span>Server-Validated Scoring</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Evaluation Results: {quiz.topic}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Proficiency Level Tested: <strong className="text-slate-800">{quiz.proficiencyLevel}</strong>
              </p>
            </div>

            {/* Score Metric Circular/Box */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-200 min-w-[140px] shrink-0">
              <span className="text-3xl font-extrabold text-slate-900 font-mono">
                {scorePct}%
              </span>
              <span className="text-2xs text-slate-500 mt-0.5">
                {attemptResult.correctAnswers} of {attemptResult.totalQuestions} Correct
              </span>
            </div>
          </div>

          {/* Adaptive Recommendation Card */}
          {recommendation && (
            <div className="p-5 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider font-mono">
                  Adaptive Engine Recommendation
                </span>
                <span className="text-indigo-300">·</span>
                <span className="text-xs font-semibold text-indigo-900">
                  Recommended Level: {recommendation.recommendedLevel}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-950 leading-relaxed">
                {recommendation.recommendationReason}
              </p>

              {recommendation.weakConcepts && recommendation.weakConcepts.length > 0 && (
                <div className="pt-2 border-t border-indigo-200/60 flex flex-wrap items-center gap-2 text-2xs text-indigo-800">
                  <span className="font-semibold">Target Concepts for Next Lesson:</span>
                  {recommendation.weakConcepts.map((gap, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-white border border-indigo-200 font-medium">
                      {gap}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={onRetake}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onBackToDashboard}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>

              <button
                onClick={() => onNavigateGenerate(recommendation?.recommendedLevel)}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Generate {recommendation?.recommendedLevel || 'Next'} Lesson</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Question-by-Question Review */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Question-by-Question Analysis
          </h2>

          {attemptResult.answers.map((ans, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border transition-all space-y-3 ${
                ans.isCorrect ? 'bg-white border-emerald-200' : 'bg-white border-rose-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      QUESTION {idx + 1}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-2xs text-slate-500 font-mono">
                      Concept: {ans.conceptTested}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {ans.question}
                  </h3>
                </div>

                <div className="shrink-0 mt-0.5">
                  {ans.isCorrect ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle className="w-3.5 h-3.5" />
                      Incorrect
                    </span>
                  )}
                </div>
              </div>

              {/* Options Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {ans.options.map((opt, optIdx) => {
                  const isUserSelection = optIdx === ans.selectedAnswerIndex;
                  const isCorrectAnswer = optIdx === ans.correctAnswerIndex;

                  let optClass = 'bg-slate-50 border-slate-200 text-slate-600';
                  if (isCorrectAnswer) {
                    optClass = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold';
                  } else if (isUserSelection && !ans.isCorrect) {
                    optClass = 'bg-rose-50 border-rose-300 text-rose-900 line-through';
                  }

                  return (
                    <div
                      key={optIdx}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${optClass}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md flex items-center justify-center font-mono text-2xs font-bold bg-white/60">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isCorrectAnswer && <span className="text-2xs text-emerald-700 font-bold">Answer Key</span>}
                      {isUserSelection && !isCorrectAnswer && <span className="text-2xs text-rose-600 font-bold">Your Choice</span>}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Note */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Explanation:</strong> {ans.explanation}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Active Quiz In-Progress Screen
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Quiz Progress Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">{quiz.topic}</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">{quiz.proficiencyLevel} Tier</span>
          </div>

          <div className="text-slate-500 font-mono">
            Question <span className="text-indigo-600 font-bold">{currentQuestionIndex + 1}</span> of {totalQuestions}
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {submissionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
          {submissionError}
        </div>
      )}

      {/* Current Question Card */}
      {currentQ && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
              Diagnostic Question {currentQuestionIndex + 1}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug whitespace-pre-line">
              {currentQ.question}
            </h2>
          </div>

          {/* 4 Multi-Choice Options */}
          <div className="space-y-3">
            {currentQ.options.map((option, optIdx) => {
              const isSelected = selectedAnswers[currentQ.id] === optIdx;
              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(currentQ.id, optIdx)}
                  className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 font-semibold shadow-2xs'
                      : 'bg-slate-50/50 hover:bg-slate-100/70 border-slate-200 text-slate-700'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold transition-colors ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-300 text-slate-500'
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </div>
                  <span className="flex-1 leading-snug">{option}</span>
                </div>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <div className="text-2xs text-slate-400 font-mono">
              {answeredCount} of {totalQuestions} answered
            </div>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !allAnswered}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Submit for Evaluation</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
