import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  BrainCircuit,
  GraduationCap,
  Target,
  LineChart,
  CheckCircle2,
  Cpu,
  Layers,
  BookOpen,
  Code2,
} from 'lucide-react';

interface LandingPageProps {
  onStartLearning: () => void;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartLearning, onOpenAuth }) => {
  const { user, quickDemoLogin } = useAuth();
  const [selectedPreviewLevel, setSelectedPreviewLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');

  const levelDemos = {
    Beginner: {
      title: 'Beginner: Foundational & Intuitive',
      target: 'Novice programmers with minimal prior syntax background',
      focus: 'Familiar analogies, step-by-step counting, plain-English definitions, syntax anatomy.',
      codeSample: `# Counting from 1 to 5 step-by-step
for number in range(1, 6):
    print(f"Current count: {number}")

# Explanation:
# range(1, 6) produces numbers 1, 2, 3, 4, 5.
# On each pass, 'number' holds the current integer.`,
      features: [
        'Accessible real-world analogy (conveyor belt / counting coins)',
        'Explicit 0-indexed range breakdown',
        'Line-by-line syntax anatomy',
        'Basic accumulator patterns with running totals',
      ],
    },
    Intermediate: {
      title: 'Intermediate: Mechanisms & Idioms',
      target: 'Students with basic syntax looking to write clean, idiomatic code',
      focus: 'Iterator protocols, enumerate/zip utilities, loop-else constructs, list comprehensions.',
      codeSample: `# Idiomatic target search with loop-else
user_ids = ["usr_10", "usr_42", "usr_99"]

for index, uid in enumerate(user_ids):
    if uid == "usr_42":
        print(f"Found target at index {index}")
        break
else:
    # Runs ONLY if loop completes without encountering a break!
    print("User ID not found in batch.")`,
      features: [
        'Clean tuple unpacking with enumerate() and zip()',
        'Eliminates flag variables with loop-else syntax',
        'In-place mutation risks explained',
        'Data transformation via filtered list comprehensions',
      ],
    },
    Advanced: {
      title: 'Advanced: Complexity & Edge Cases',
      target: 'AIML and Systems students requiring performance and formal guarantees',
      focus: 'Big-O time & space asymptotic analysis, memory cache locality, CPU branch prediction, generator pipelines.',
      codeSample: `# Memory-constant generator pipeline for massive log streams
def stream_anomaly_detector(log_iterator, threshold=0.95):
    for entry in log_iterator:
        # Avoid allocating full matrix in RAM
        if entry.loss_metric > threshold:
            yield entry.timestamp, entry.node_id

# Maintains O(1) space complexity regardless of stream size`,
      features: [
        'Formal asymptotic bounds ($O(n)$ vs $O(n \\cdot m)$ nested iteration)',
        'CPU cache line locality in contiguous array traversals',
        'Lazy generator streaming to prevent out-of-memory crashes',
        'Thread safety, iterator invalidation, and snapshot semantics',
      ],
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-8 border-b border-slate-200/80 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 tracking-wider uppercase mb-4">
            <span>Academic AI Architecture</span>
            <span aria-hidden="true">·</span>
            <span>Third-Semester AIML Project</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 text-balance mb-6">
            Intelligent, Adaptive Learning Content Powered by Gemini AI.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed mb-8 text-balance">
            Static textbooks treat every student identically. LearnWise AI continuously evaluates your comprehension gaps, adapts lesson depth across three calibrated tiers, and generates custom diagnostic quizzes.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <button
                onClick={onStartLearning}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-colors"
              >
                Go to Student Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={quickDemoLogin}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-colors cursor-pointer"
                >
                  Launch Demo Student
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenAuth}
                  className="px-5 py-3 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  Create Student Account
                </button>
              </>
            )}
          </div>

          {/* Quick metadata strip */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <span>Server-Authoritative Quizzes</span>
            <span aria-hidden="true">·</span>
            <span>Configurable Adaptive Thresholds</span>
            <span aria-hidden="true">·</span>
            <span>Google Gen AI SDK (gemini-3.8-flash)</span>
          </div>
        </div>
      </section>

      {/* The 5-Step Continuous Mastery Cycle */}
      <section className="py-16 px-4 sm:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Algorithmic Lifecycle</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            The LearnWise Mastery Cycle
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
            Traditional learning stops at consumption. LearnWise enforces an active feedback loop where assessment directly shapes the next lesson.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              step: '01',
              label: 'LEARN',
              title: 'Structured Lesson',
              desc: 'Tailored content with objectives, mechanics, worked code, and common pitfalls.',
            },
            {
              step: '02',
              label: 'PRACTICE',
              title: 'Active Retention',
              desc: 'Self-check exercises and code tracing problems embedded directly in the lesson.',
            },
            {
              step: '03',
              label: 'EVALUATE',
              title: 'Diagnostic Quiz',
              desc: '5-question test scored server-side against protected answer keys.',
            },
            {
              step: '04',
              label: 'ADAPT',
              title: 'Gap Analysis',
              desc: 'Adaptive engine checks 4 score brackets & diagnoses specific weak concept tags.',
            },
            {
              step: '05',
              label: 'LEARN AGAIN',
              title: 'Calibrated Progression',
              desc: 'Subsequent lessons inject previous mistakes into the prompt for targeted mastery.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                  <span>STAGE {item.step}</span>
                  <span className="text-indigo-600 font-bold">{item.label}</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive 3-Level Comparison Preview */}
      <section className="py-16 px-4 sm:px-8 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Multi-Tier Synthesis</span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
                Same Topic, Meaningfully Different Content
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Compare how LearnWise calibrates depth and language on the demo topic: <strong>Python loops and iteration</strong>.
              </p>
            </div>

            {/* Segmented Level Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedPreviewLevel(lvl)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    selectedPreviewLevel === lvl
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Level Showcase Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8">
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div>
                <div className="text-xs font-mono text-indigo-600 font-semibold mb-1">
                  TIER: {selectedPreviewLevel.toUpperCase()}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {levelDemos[selectedPreviewLevel].title}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  <strong>Audience:</strong> {levelDemos[selectedPreviewLevel].target}
                </p>
                <p className="text-sm text-slate-700 leading-relaxed mb-6">
                  {levelDemos[selectedPreviewLevel].focus}
                </p>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    Key Pedagogical Features:
                  </div>
                  {levelDemos[selectedPreviewLevel].features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">Live prompt calibration v2.1</span>
                <button
                  onClick={onStartLearning}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  Generate for this level <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 bg-slate-900 text-slate-100 rounded-xl p-5 font-mono text-xs overflow-x-auto shadow-inner flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400 text-2xs mb-3">
                  <span>python_loops_{selectedPreviewLevel.toLowerCase()}.py</span>
                  <span>Python 3.11</span>
                </div>
                <pre className="text-emerald-400 whitespace-pre font-mono leading-relaxed">
                  {levelDemos[selectedPreviewLevel].codeSample}
                </pre>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-slate-400 text-2xs flex justify-between">
                <span>Algorithmic Rigor: High</span>
                <span>Syntactically Validated</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Adaptive Decision Engine Rules */}
      <section className="py-16 px-4 sm:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Score Threshold Rules</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Deterministic Adaptive Boundaries
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-xl mx-auto">
            Configured on the backend to prevent arbitrary score hallucination and ensure predictable academic progression.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-rose-200">
            <div className="text-lg font-bold text-rose-600 font-mono">0% – 39%</div>
            <div className="text-sm font-semibold text-slate-900 mt-1 mb-2">Step Down 1 Level</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Detects fundamental prerequisite gaps. Shifts difficulty down to reinforce prerequisite terms and mechanisms.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-amber-200">
            <div className="text-lg font-bold text-amber-600 font-mono">40% – 69%</div>
            <div className="text-sm font-semibold text-slate-900 mt-1 mb-2">Maintain Level</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Demonstrates emerging understanding. Holds current level to consolidate core understanding and address weak concepts.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-indigo-200">
            <div className="text-lg font-bold text-indigo-600 font-mono">70% – 84%</div>
            <div className="text-sm font-semibold text-slate-900 mt-1 mb-2">Advance 1 Level</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Solid comprehension achieved. Steps up one proficiency tier for more demanding applied problem solving.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-emerald-200">
            <div className="text-lg font-bold text-emerald-600 font-mono">85% – 100%</div>
            <div className="text-sm font-semibold text-slate-900 mt-1 mb-2">Advance + Challenge</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Exemplary mastery. Advances to top tier with extension exercises, asymptotic complexity, and edge cases.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-8 border-t border-slate-200 bg-white text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-800">LearnWise AI</span>
            <span>— Third-Semester AIML Academic Project</span>
          </div>
          <div>
            Built with React, FastAPI, PostgreSQL, and Google Gemini API.
          </div>
        </div>
      </footer>
    </div>
  );
};
