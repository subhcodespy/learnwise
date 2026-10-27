/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { LessonGenerator } from './components/LessonGenerator';
import { LessonViewer } from './components/LessonViewer';
import { QuizEngine } from './components/QuizEngine';
import { HistoryPage } from './components/HistoryPage';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { GmailInboxModal } from './components/GmailInboxModal';
import { Lesson, Quiz, ProficiencyLevel } from './types';
import { api } from './services/api';

function MainApp() {
  const { user, loading } = useAuth();

  // Tab state: 'landing' | 'dashboard' | 'generate' | 'lesson' | 'quiz' | 'history'
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [gmailModalOpen, setGmailModalOpen] = useState(false);
  const [emailLessonData, setEmailLessonData] = useState<{ title: string; body: string } | null>(null);

  // If user is not logged in on initial load, show landing page by default
  useEffect(() => {
    if (!loading && !user && currentTab === 'dashboard') {
      setCurrentTab('landing');
    } else if (!loading && user && currentTab === 'landing') {
      // If user logs in while on landing, redirect to dashboard
      setCurrentTab('dashboard');
    }
  }, [user, loading]);

  const handleOpenLesson = async (lessonId: string) => {
    try {
      const res = await api.getLesson(lessonId);
      setActiveLesson(res.lesson);
      setCurrentTab('lesson');
    } catch (err) {
      console.error('Failed to open lesson:', err);
    }
  };

  const handleStartQuiz = async (quizOrId: Quiz | string) => {
    if (typeof quizOrId === 'string') {
      try {
        const res = await api.getQuiz(quizOrId);
        setActiveQuiz(res.quiz);
        setCurrentTab('quiz');
      } catch (err) {
        console.error('Failed to open quiz:', err);
      }
    } else {
      setActiveQuiz(quizOrId);
      setCurrentTab('quiz');
    }
  };

  const handleLessonGenerated = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setCurrentTab('lesson');
  };

  const handleNavigateGenerate = (recommendedLevel?: string) => {
    if (recommendedLevel && user) {
      user.preferredLevel = recommendedLevel as ProficiencyLevel;
    }
    setCurrentTab('generate');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase font-mono">
          Initializing LearnWise AI...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onNavigate={(tab) => {
          if (tab === 'dashboard' && !user) {
            setAuthModalOpen(true);
            return;
          }
          setCurrentTab(tab);
        }}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenGmail={() => {
          setEmailLessonData(null);
          setGmailModalOpen(true);
        }}
      />

      <main className="flex-1">
        {currentTab === 'landing' && (
          <LandingPage
            onStartLearning={() => {
              if (user) {
                setCurrentTab('dashboard');
              } else {
                setAuthModalOpen(true);
              }
            }}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {currentTab === 'dashboard' && (
          <Dashboard
            onNavigateGenerate={() => setCurrentTab('generate')}
            onOpenLesson={handleOpenLesson}
            onStartQuiz={handleStartQuiz}
          />
        )}

        {currentTab === 'generate' && (
          <LessonGenerator
            onLessonGenerated={handleLessonGenerated}
            onCancel={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'lesson' && activeLesson && (
          <LessonViewer
            lesson={activeLesson}
            onBack={() => setCurrentTab('dashboard')}
            onStartQuiz={(quiz) => {
              setActiveQuiz(quiz);
              setCurrentTab('quiz');
            }}
            onRegenerate={() => setCurrentTab('generate')}
            onEmailLesson={(title, body) => {
              setEmailLessonData({ title, body });
              setGmailModalOpen(true);
            }}
          />
        )}

        {currentTab === 'quiz' && activeQuiz && (
          <QuizEngine
            quiz={activeQuiz}
            onRetake={() => {
              handleStartQuiz(activeQuiz.id);
            }}
            onNavigateGenerate={(recLevel) => {
              handleNavigateGenerate(recLevel);
            }}
            onBackToDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'history' && (
          <HistoryPage onOpenLesson={handleOpenLesson} />
        )}
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      <GmailInboxModal
        isOpen={gmailModalOpen}
        onClose={() => {
          setGmailModalOpen(false);
          setEmailLessonData(null);
        }}
        defaultLessonTitle={emailLessonData?.title}
        defaultLessonBody={emailLessonData?.body}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
