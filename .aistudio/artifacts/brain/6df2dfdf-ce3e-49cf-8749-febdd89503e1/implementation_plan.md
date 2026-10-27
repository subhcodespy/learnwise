# LearnWise AI — Error Fixes, Google Sign-In & Enhanced Content Generation

This update resolves frontend console/rendering errors, introduces Google Sign-In via Google Identity Services with server-side session issuance, and upgrades learning content generation with a rich markdown renderer supporting formatted mathematical notation, syntax-highlighted code blocks, and dynamic curriculum tuning.

## User Review & Critical Decisions

> [!IMPORTANT]
> The architectural and design decisions below reflect user choices confirmed in Phase 1:

- **Confirmed Decision 1 (Google Authentication)**: Implement Google Identity Services (GIS) on the client with backend credential verification and session creation (`POST /api/auth/google`). Support both standard Google Sign-In button and seamless local Google credential simulation when Client ID is in test mode.
- **Confirmed Decision 2 (Content Generation Enhancement)**: Implement a dedicated `MarkdownRenderer` component that parses markdown headers, bullet/numbered lists, inline code, bold/italics, and multi-line code blocks with syntax highlighting, line numbers, and copy-code affordances, plus mathematical notation ($O(n)$, $\ge$, $\sum$) in clean academic math serif.
- **Confirmed Decision 3 (Error Remediation)**: Conduct a full audit of all components to resolve raw string unescaped characters (e.g. `$\ge$` in JSX), prevent undefined array accesses in quiz history, ensure robust JSON parsing in Gemini AI service with fallback repair, and eliminate console warnings.

---

## 1. Overview & Core Concept

1. **Google Identity Services**: Students can authenticate via their Google account with a single click. The backend validates the Google credential, provisions a student profile in the database, and issues an authenticated session token.
2. **Enhanced Content Generation**:
   - System prompts are refined to generate deeper pedagogical context, including step-by-step code execution traces and asymptotic resource analysis.
   - All lesson sections (Objectives, Deep Explanation, Worked Examples, Important Principles, and Common Misconceptions) render through a dedicated markdown parser with syntax-highlighted code blocks and mathematical symbols.
3. **Comprehensive Error Fixes**:
   - Replace raw JSX text formatting with properly rendered mathematical typography.
   - Protect all array mapping operations against null/empty records in lessons and quiz attempts.
   - Add JSON response sanitizer to handle markdown-wrapped code fences from LLM responses (`\`\`\`json ... \`\`\``).

---

## 2. User Experience & Visual Design

### Google Authentication Flow
```
[User clicks "Sign in with Google"]
             │
             ▼
[Google Identity Services SDK / One-Tap Dialog]
             │ (Returns Google ID Token credential)
             ▼
[Client POST /api/auth/google]
             │ (Decodes & validates email, name, avatar)
             ▼
[Server creates/retrieves User & returns session token]
             │
             ▼
[Authenticated Student Dashboard & Synchronized Progress]
```

### Visual Upgrades to Lesson Content
- **Mathematical Typography**: Formulas such as $O(1)$, $O(N)$, $O(N \log N)$, $\sum_{i=1}^n i$, and $N \ge 1$ render in high-contrast academic math typography (`Georgia, 'Times New Roman', serif`) with tabular numerals.
- **Code Highlighting**: Syntax tokens (keywords, strings, comments, numbers, functions) styled with high-contrast colors on deep slate backgrounds (`#0f172a`), complete with copy buttons and language badges.
- **Academic Callouts**: Important notes and misconceptions styled as bordered callout cards with distinct icons rather than plain text.

---

## 3. Technical Changes & Architecture

### Backend API (`server.ts` & Python FastAPI)
- Add `POST /api/auth/google`:
  - Accepts `{ credential, clientId }`.
  - Decodes Google JWT payload (sub, email, name, picture).
  - Finds or creates user record in `users` table.
  - Creates authenticated session and returns `{ user, token }`.
- Enhance `POST /api/lessons/generate`:
  - Enhanced system prompt with explicit markdown formatting directives (bolding, code blocks, lists).
  - Robust JSON extractor stripping markdown backticks if returned by the model.

### Frontend Components
- `index.html`: Load Google Identity Services script `<script src="https://accounts.google.com/gsi/client" async defer></script>`.
- `src/components/MarkdownRenderer.tsx`: Create modular markdown parser supporting:
  - Code blocks with syntax highlighting (Python, JS, SQL, pseudocode) and copy affordance.
  - Inline code formatting.
  - Math formula tokens.
  - Lists and blockquotes.
- `src/components/AuthModal.tsx`: Add "Continue with Google" button and GIS trigger.
- `src/components/LessonViewer.tsx`: Update to use `MarkdownRenderer` for all explanation, note, and misconception fields.
- `src/components/Dashboard.tsx`: Fix unescaped characters in JSX and protect timeline rendering against empty states.

---

## 4. Verification & Testing Strategy

1. **Google Sign-In Verification**: Verify clicking "Continue with Google" securely provisions the student account and redirects to the authenticated dashboard.
2. **Content Generation Verification**: Generate a lesson on "Python loops" and verify headers, bold text, bullet lists, math symbols, and code blocks render with syntax coloring.
3. **Console & Lint Audit**: Verify zero browser console errors, zero warnings, and clean compilation via `compile_applet` and `lint_applet`.
