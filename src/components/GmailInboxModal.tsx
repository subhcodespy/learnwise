import React, { useState, useEffect } from 'react';
import { googleSignIn, getAccessToken, googleLogout } from '../services/googleAuth';
import { gmailService, GmailMessageSummary } from '../services/gmailService';
import {
  Mail,
  RefreshCw,
  Search,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  ExternalLink,
} from 'lucide-react';

interface GmailInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipient?: string;
  defaultLessonTitle?: string;
  defaultLessonBody?: string;
}

export const GmailInboxModal: React.FC<GmailInboxModalProps> = ({
  isOpen,
  onClose,
  defaultRecipient = '',
  defaultLessonTitle = '',
  defaultLessonBody = '',
}) => {
  const [hasToken, setHasToken] = useState(false);
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Active view tab: 'inbox' | 'compose'
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>(
    defaultLessonTitle ? 'compose' : 'inbox'
  );

  // Compose state
  const [toEmail, setToEmail] = useState(defaultRecipient);
  const [subject, setSubject] = useState(
    defaultLessonTitle ? `LearnWise AI Study Notes: ${defaultLessonTitle}` : ''
  );
  const [body, setBody] = useState(defaultLessonBody);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [showConfirmSend, setShowConfirmSend] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkTokenAndLoad();
    }
  }, [isOpen]);

  const checkTokenAndLoad = async () => {
    const token = await getAccessToken();
    if (token) {
      setHasToken(true);
      loadEmails();
    } else {
      setHasToken(false);
    }
  };

  const handleConnectGmail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setHasToken(true);
        await loadEmails();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Google Workspace');
    } finally {
      setLoading(false);
    }
  };

  const loadEmails = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const emails = await gmailService.fetchAllEmails(15, query);
      setMessages(emails);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch emails from Gmail');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadEmails(searchQuery);
  };

  const handleConfirmSend = async () => {
    if (!toEmail.trim() || !subject.trim()) {
      setError('Recipient email and subject are required.');
      return;
    }

    setShowConfirmSend(false);
    setSending(true);
    setError(null);
    setSendSuccess(false);

    try {
      await gmailService.sendEmail(toEmail.trim(), subject.trim(), body);
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send email via Gmail API');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 shadow-xl max-h-[85vh] flex flex-col space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Gmail Workspace Integration</h2>
              <p className="text-2xs text-slate-500 font-mono">Scope: https://mail.google.com/</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {sendSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Email sent successfully through your connected Gmail account!</span>
          </div>
        )}

        {!hasToken ? (
          /* Connect Gmail Prompt */
          <div className="py-12 px-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-900">Connect Google Workspace Gmail</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Authorize LearnWise AI to read your educational emails and send generated study guides directly to students or peers.
              </p>
            </div>

            <button
              onClick={handleConnectGmail}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>{loading ? 'Connecting...' : 'Authorize Gmail Access'}</span>
            </button>
          </div>
        ) : (
          /* Connected: Inbox / Compose Tabs */
          <div className="flex-1 flex flex-col overflow-hidden space-y-4">
            {/* View Switcher */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setActiveTab('inbox')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    activeTab === 'inbox'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Emails ({messages.length})
                </button>
                <button
                  onClick={() => setActiveTab('compose')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    activeTab === 'compose'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Send Lesson Note
                </button>
              </div>

              <button
                onClick={() => loadEmails(searchQuery)}
                disabled={loading}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                title="Refresh messages"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {activeTab === 'inbox' ? (
              /* All Emails List */
              <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                <form onSubmit={handleSearch} className="relative shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search all emails by keyword or sender..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </form>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-2xs text-slate-500">Querying Gmail API for all messages...</p>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl border border-slate-200 hover:border-indigo-200 bg-white hover:bg-slate-50/50 transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between text-2xs text-slate-500">
                          <span className="font-semibold text-slate-700 truncate max-w-[280px]">
                            {m.from}
                          </span>
                          <span>{m.date ? new Date(m.date).toLocaleDateString() : ''}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">
                          {m.subject}
                        </h4>
                        <p className="text-2xs text-slate-600 line-clamp-2 leading-relaxed">
                          {m.snippet}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No emails found in this Gmail account.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Compose / Send Email View */
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    Recipient Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="peer@university.edu or student@example.com"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    Email Subject <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="LearnWise AI Study Guide..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    Study Notes / Lesson Body
                  </label>
                  <textarea
                    rows={8}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono leading-relaxed resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowConfirmSend(true)}
                    disabled={sending || !toEmail.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send via Gmail</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mandatory Confirmation Modal for Mutating Action (Send Email) */}
        {showConfirmSend && (
          <div className="fixed inset-0 z-60 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-slate-200 max-w-sm w-full p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <AlertCircle className="w-4 h-4 text-indigo-600" />
                <span>Confirm Email Dispatch</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to send this study material to <strong>{toEmail}</strong> using your authenticated Gmail account?
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowConfirmSend(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSend}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Confirm & Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
