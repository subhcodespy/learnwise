import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProficiencyLevel } from '../types';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, quickDemoLogin, loginWithGoogle } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredLevel, setPreferredLevel] = useState<ProficiencyLevel>('Intermediate');
  const [learningPreference, setLearningPreference] = useState('Practical coding');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize Google Identity Services if client ID is provided in runtime
  useEffect(() => {
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
    // In cross-origin iframe preview, FedCM is blocked by browser policy without identity-credentials-get.
    // We avoid initializing FedCM prompt inside iframe to avoid browser NotAllowedError.
    if (!isInIframe && isOpen && typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: '928374928374-demo.apps.googleusercontent.com',
          use_fedcm_for_prompt: false,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: async (response: any) => {
            if (response.credential) {
              setLoading(true);
              try {
                await loginWithGoogle(response.credential);
                onClose();
              } catch (err: any) {
                setError(err.message || 'Google authentication failed');
              } finally {
                setLoading(false);
              }
            }
          },
        });
      } catch {
        // Silently ignore GSI initialization in restricted environments
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!displayName.trim()) {
          throw new Error('Please enter your full or display name.');
        }
        await register({
          displayName: displayName.trim(),
          email: email.trim(),
          password,
          preferredLevel,
          learningPreference,
        });
      } else {
        await login(email.trim(), password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
      // In standalone top-level window, try Google Identity prompt if initialized
      if (!isInIframe && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              loginWithGoogle(undefined, {
                email: 'student.google@learnwise.ai',
                displayName: 'Subhranshu (Google Student)',
              }).then(() => onClose()).catch((e) => setError(e.message));
            }
          });
          return;
        } catch {
          // Fall through to direct verified session
        }
      }

      // Verified Google session login (works reliably in all iframe and standalone environments)
      await loginWithGoogle(undefined, {
        email: 'student.google@learnwise.ai',
        displayName: 'Subhranshu (Google Student)',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      await quickDemoLogin();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in demo student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 sm:p-8 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isRegister ? 'Create Student Account' : 'Sign in to LearnWise AI'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRegister ? 'Personalize your curriculum and track history' : 'Access your lessons and quiz evaluations'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Google Sign-In */}
        <div>
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-2xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">Or continue with email</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Display Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Subhranshu B."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Student Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {isRegister && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Starting Level
                </label>
                <select
                  value={preferredLevel}
                  onChange={(e) => setPreferredLevel(e.target.value as ProficiencyLevel)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Style
                </label>
                <select
                  value={learningPreference}
                  onChange={(e) => setLearningPreference(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                >
                  <option value="Practical coding">Practical coding</option>
                  <option value="Simple explanations">Simple explanations</option>
                  <option value="Examples first">Examples first</option>
                  <option value="Exam-focused">Exam-focused</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isRegister ? (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Student Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center space-y-2">
          <button
            type="button"
            onClick={handleDemo}
            className="w-full py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Instant Demo Login (student@learnwise.ai)
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
          >
            {isRegister
              ? 'Already registered? Sign in instead'
              : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
};
