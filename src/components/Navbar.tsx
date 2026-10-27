import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, BookOpen, BarChart3, History, User, LogOut, GraduationCap, Mail } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenProfile: () => void;
  onOpenAuthModal: () => void;
  onOpenGmail: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  onOpenProfile,
  onOpenAuthModal,
  onOpenGmail,
}) => {
  const { user, logout, quickDemoLogin } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 sm:gap-8">
        {/* Zone 1: Brand title wordmark */}
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
            LearnWise AI
          </span>
        </div>

        {/* Zone 2: 4 concise single-line text nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              currentTab === 'dashboard' ? 'text-indigo-600 font-semibold' : ''
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => onNavigate('generate')}
            className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              currentTab === 'generate' ? 'text-indigo-600 font-semibold' : ''
            }`}
          >
            Generate Lesson
          </button>

          <button
            onClick={() => onNavigate('history')}
            className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              currentTab === 'history' ? 'text-indigo-600 font-semibold' : ''
            }`}
          >
            Learning History
          </button>

          <button
            onClick={() => onNavigate('landing')}
            className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              currentTab === 'landing' ? 'text-indigo-600 font-semibold' : ''
            }`}
          >
            Methodology
          </button>
        </nav>

        {/* Zone 3: 1 primary action / user state */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenGmail}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50/60 rounded-md transition-colors cursor-pointer"
            title="Gmail Workspace: Read emails and send study notes"
          >
            <Mail className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Gmail</span>
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                title="Student Profile & Settings"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-xs">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline font-medium text-slate-800">{user.displayName}</span>
                <span className="hidden lg:inline text-slate-400">·</span>
                <span className="hidden lg:inline text-slate-500 font-normal">{user.preferredLevel}</span>
              </button>

              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={quickDemoLogin}
                className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors whitespace-nowrap"
              >
                Demo Student
              </button>
              <button
                onClick={onOpenAuthModal}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
