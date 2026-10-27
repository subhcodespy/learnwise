import React, { useState } from 'react';
import { Lesson, Quiz } from '../types';
import { api } from '../services/api';
import {
  Bookmark,
  Download,
  Printer,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Code2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Maximize2,
  Minimize2,
  HelpCircle,
  Mail,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface LessonViewerProps {
  lesson: Lesson;
  onBack: () => void;
  onStartQuiz: (quiz: Quiz) => void;
  onRegenerate: () => void;
  onEmailLesson?: (title: string, body: string) => void;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({
  lesson,
  onBack,
  onStartQuiz,
  onRegenerate,
  onEmailLesson,
}) => {
  const [isSaved, setIsSaved] = useState(lesson.isSaved);
  const [savingBookmark, setSavingBookmark] = useState(false);

  // Simplification / Expansion drawer state
  const [modalType, setModalType] = useState<'simplify' | 'expand' | null>(null);
  const [modalContent, setModalContent] = useState<string>('');
  const [modalLoading, setModalLoading] = useState(false);

  // Quiz generation state
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Knowledge check revealed state
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const toggleBookmark = async () => {
    try {
      setSavingBookmark(true);
      const res = await api.toggleSaveLesson(lesson.id);
      setIsSaved(res.isSaved);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingBookmark(false);
    }
  };

  const handleSimplify = async () => {
    setModalType('simplify');
    setModalLoading(true);
    try {
      const res = await api.simplifyLesson(lesson.id);
      setModalContent(res.simplifiedText);
    } catch (err: any) {
      setModalContent('Failed to generate simplified breakdown. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleExpand = async () => {
    setModalType('expand');
    setModalLoading(true);
    try {
      const res = await api.expandLesson(lesson.id);
      setModalContent(res.expandedText);
    } catch (err: any) {
      setModalContent('Failed to generate advanced expansion. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    try {
      setGeneratingQuiz(true);
      setQuizError(null);
      const res = await api.generateQuiz({
        topic: lesson.topic,
        proficiencyLevel: lesson.proficiencyLevel,
        lessonId: lesson.id,
      });
      onStartQuiz(res.quiz);
    } catch (err: any) {
      setQuizError(err.message || 'Failed to generate quiz');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadMarkdown = () => {
    const content = `# ${lesson.topic} (${lesson.proficiencyLevel})
Subject: ${lesson.subject}
Date: ${new Date(lesson.createdAt).toLocaleDateString()}

## Learning Objectives
${lesson.generatedContent.learningObjectives.map((o) => `- ${o}`).join('\n')}

## Explanation
${lesson.generatedContent.explanation}

## Key Concepts
${lesson.generatedContent.keyConcepts.map((k) => `### ${k.term}\n${k.definition}`).join('\n\n')}

## Worked Examples
${lesson.generatedContent.workedExamples
  .map(
    (e) => `### ${e.title}
\`\`\`python
${e.code || ''}
\`\`\`
${e.explanation}`
  )
  .join('\n\n')}

## Important Notes
${lesson.generatedContent.importantNotes.map((n) => `- ${n}`).join('\n')}

## Common Misconceptions
${lesson.generatedContent.commonMisconceptions
  .map((m) => `**Misconception:** ${m.misconception}\n**Clarification:** ${m.clarification}`)
  .join('\n\n')}

## Practice Exercises
${lesson.generatedContent.practiceExercises.map((p) => `- ${p.problem} (Hint: ${p.hint || 'None'})`).join('\n')}

## Suggested Next Step
${lesson.generatedContent.suggestedNextStep}
`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${lesson.topic.toLowerCase().replace(/\s+/g, '_')}_lesson.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailNotes = () => {
    if (onEmailLesson) {
      const summary = `LearnWise AI Study Notes: ${lesson.topic} (${lesson.proficiencyLevel})\n\n` +
        `Learning Objectives:\n${lesson.generatedContent.learningObjectives.map((o) => `• ${o}`).join('\n')}\n\n` +
        `Summary & Concepts:\n${lesson.generatedContent.explanation}\n\n` +
        `Next Step: ${lesson.generatedContent.suggestedNextStep}`;
      onEmailLesson(lesson.topic, summary);
    }
  };

  const { generatedContent: c } = lesson;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8 print:p-0">
      {/* Top Navigation & Utility Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleBookmark}
            disabled={savingBookmark}
            className={`p-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              isSaved
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Bookmark lesson"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            title="Download lesson as Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Markdown</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            title="Print or export as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          {onEmailLesson && (
            <button
              onClick={handleEmailNotes}
              className="p-2 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-lg text-slate-600 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              title="Email study notes via Gmail Workspace"
            >
              <Mail className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Email Notes</span>
            </button>
          )}

          <button
            onClick={handleGenerateQuiz}
            disabled={generatingQuiz}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {generatingQuiz ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <BrainCircuit className="w-3.5 h-3.5" />
            )}
            <span>Practice Quiz</span>
          </button>
        </div>
      </div>

      {quizError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
          {quizError}
        </div>
      )}

      {/* Lesson Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>{lesson.subject}</span>
            <span aria-hidden="true">·</span>
            <span>{lesson.contentType}</span>
            <span aria-hidden="true">·</span>
            <span>Generated {new Date(lesson.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Level:</span>
            <span
              className={`px-2 py-0.5 text-2xs font-semibold rounded ${
                lesson.proficiencyLevel === 'Beginner'
                  ? 'bg-emerald-100 text-emerald-800'
                  : lesson.proficiencyLevel === 'Intermediate'
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              {lesson.proficiencyLevel}
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
          {lesson.topic}
        </h1>

        {/* Quick Assistant Actions Bar */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs print:hidden">
          <span className="text-2xs text-slate-400 mr-1 font-medium">Adaptive Refinement:</span>
          <button
            onClick={handleSimplify}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Explain Simpler (Analogy)</span>
          </button>

          <button
            onClick={handleExpand}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Expand in Depth (Advanced)</span>
          </button>

          <button
            onClick={onRegenerate}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            <span>Regenerate Module</span>
          </button>
        </div>
      </div>

      {/* 1. Learning Objectives */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-indigo-600">SECTION 01</span>
          <span className="text-slate-300">·</span>
          <h2 className="text-lg font-bold text-slate-900">Learning Objectives</h2>
        </div>
        <p className="text-xs text-slate-500">
          Upon completing this module, you will be able to demonstrate:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {c.learningObjectives.map((obj, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-700 leading-relaxed">{obj}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Deep Explanation */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-indigo-600">SECTION 02</span>
          <span className="text-slate-300">·</span>
          <h2 className="text-lg font-bold text-slate-900">Concept Explanation</h2>
        </div>
        <div className="pt-1">
          <MarkdownRenderer content={c.explanation} />
        </div>
      </section>

      {/* 3. Key Concepts & Definitions */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-indigo-600">SECTION 03</span>
          <span className="text-slate-300">·</span>
          <h2 className="text-lg font-bold text-slate-900">Key Concepts & Vocabulary</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {c.keyConcepts.map((item, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-1.5">
              <div className="text-xs font-bold text-indigo-900 font-mono tracking-tight">
                {item.term}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.definition}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Worked Examples */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-indigo-600">SECTION 04</span>
          <span className="text-slate-300">·</span>
          <h2 className="text-lg font-bold text-slate-900">Step-by-Step Worked Examples</h2>
        </div>

        <div className="space-y-6">
          {c.workedExamples.map((ex, idx) => (
            <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">{ex.title}</span>
                {ex.code && (
                  <button
                    onClick={() => handleCopyCode(ex.code!, idx)}
                    className="flex items-center gap-1 text-2xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {ex.code && (
                <div className="bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto">
                  <pre className="text-emerald-400 whitespace-pre">{ex.code}</pre>
                </div>
              )}

              <div className="p-4 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                <strong>Mechanism:</strong> {ex.explanation}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Important Notes & Operational Principles */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-indigo-600">SECTION 05</span>
          <span className="text-slate-300">·</span>
          <h2 className="text-lg font-bold text-slate-900">Important Operational Principles</h2>
        </div>
        <ul className="space-y-2.5">
          {c.importantNotes.map((note, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 6. Common Misconceptions */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-indigo-600">SECTION 06</span>
          <span className="text-slate-300">·</span>
          <h2 className="text-lg font-bold text-slate-900">Common Misconceptions & Corrections</h2>
        </div>

        <div className="space-y-3">
          {c.commonMisconceptions.map((item, i) => (
            <div key={i} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
              <div className="flex items-start gap-2 text-xs font-medium text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Fallacy:</strong> {item.misconception}
                </span>
              </div>
              <div className="pl-6 text-xs text-slate-700 leading-relaxed">
                <strong>Clarification:</strong> {item.clarification}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Practice Exercises */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-indigo-600">SECTION 07</span>
          <span className="text-slate-300">·</span>
          <h2 className="text-lg font-bold text-slate-900">Hands-on Practice Exercises</h2>
        </div>

        <div className="space-y-3">
          {c.practiceExercises.map((ex, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="text-xs font-semibold text-slate-900">
                Problem {i + 1}: {ex.problem}
              </div>
              {ex.hint && (
                <div className="text-2xs text-slate-500 italic">
                  💡 Hint: {ex.hint}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. Short Knowledge Check */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-indigo-600">SECTION 08</span>
          <span className="text-slate-300">·</span>
          <h2 className="text-lg font-bold text-slate-900">Quick Knowledge Check</h2>
        </div>

        <div className="space-y-3">
          {c.knowledgeCheck.map((kc, i) => {
            const isRevealed = !!revealedAnswers[i];
            return (
              <div key={i} className="p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-slate-800">
                    Q{i + 1}: {kc.question}
                  </span>
                  <button
                    onClick={() =>
                      setRevealedAnswers((prev) => ({ ...prev, [i]: !prev[i] }))
                    }
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium shrink-0 cursor-pointer"
                  >
                    {isRevealed ? 'Hide Answer' : 'Reveal Answer'}
                  </button>
                </div>
                {isRevealed && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 text-xs border border-emerald-100">
                    <strong>Answer:</strong> {kc.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. Suggested Next Step & CTA */}
      <section className="bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/60 p-6 sm:p-8 rounded-2xl border border-indigo-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <span className="text-xs font-mono font-bold text-indigo-600">SECTION 09</span>
          <h3 className="text-lg font-bold text-slate-900">Recommended Next Step</h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            {c.suggestedNextStep}
          </p>
        </div>

        <button
          onClick={handleGenerateQuiz}
          disabled={generatingQuiz}
          className="px-5 py-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
        >
          {generatingQuiz ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <BrainCircuit className="w-4 h-4" />
          )}
          <span>Launch Diagnostic Quiz (5 Questions)</span>
        </button>
      </section>

      {/* Simplification / Expansion Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 shadow-xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {modalType === 'simplify' ? (
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-indigo-600" />
                )}
                <h3 className="text-base font-bold text-slate-900">
                  {modalType === 'simplify' ? 'Intuitive Analogy & Breakdown' : 'Advanced Architectural Analysis'}
                </h3>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {modalLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-500">Querying Gemini API for tailored breakdown...</p>
              </div>
            ) : (
              <div className="pt-2">
                <MarkdownRenderer content={modalContent} />
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
