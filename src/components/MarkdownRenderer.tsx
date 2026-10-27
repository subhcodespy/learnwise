import React, { useState } from 'react';
import { Copy, Check, Terminal, Info } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Lightweight syntax highlighter for code blocks
function highlightCode(code: string, language: string = 'python'): React.ReactNode {
  const lines = code.split('\n');

  // Common keywords for Python & systems programming
  const keywords = new Set([
    'def', 'class', 'return', 'import', 'from', 'as', 'for', 'while', 'in', 'if', 'elif', 'else',
    'try', 'except', 'finally', 'with', 'yield', 'lambda', 'break', 'continue', 'pass', 'raise',
    'True', 'False', 'None', 'async', 'await', 'const', 'let', 'function', 'var', 'SELECT', 'FROM', 'WHERE'
  ]);

  const builtins = new Set([
    'print', 'range', 'len', 'enumerate', 'zip', 'sum', 'min', 'max', 'int', 'float', 'str',
    'list', 'dict', 'set', 'tuple', 'sorted', 'reversed', 'map', 'filter', 'any', 'all', 'isinstance'
  ]);

  return (
    <div className="font-mono text-xs leading-relaxed">
      {lines.map((line, lineIdx) => {
        // Highlight line
        const trimmed = line.trim();
        const isComment = trimmed.startsWith('#') || trimmed.startsWith('//');

        if (isComment) {
          return (
            <div key={lineIdx} className="table-row">
              <span className="table-cell pr-4 select-none text-slate-500 text-right opacity-50 text-2xs">
                {lineIdx + 1}
              </span>
              <span className="table-cell text-slate-400 italic">{line}</span>
            </div>
          );
        }

        // Tokenize strings, numbers, words
        const tokens: React.ReactNode[] = [];
        // Regex matches strings, numbers, comments, identifiers
        const regex = /(".*?"|'.*?'|#.*|\b\d+\.?\d*\b|\b[a-zA-Z_]\w*\b|[^\s\w]+|\s+)/g;
        let match;
        let key = 0;

        while ((match = regex.exec(line)) !== null) {
          const tok = match[0];
          key++;

          if (tok.startsWith('"') || tok.startsWith("'")) {
            tokens.push(<span key={key} className="text-emerald-400">{tok}</span>);
          } else if (tok.startsWith('#')) {
            tokens.push(<span key={key} className="text-slate-400 italic">{tok}</span>);
          } else if (/^\d+\.?\d*$/.test(tok)) {
            tokens.push(<span key={key} className="text-amber-400">{tok}</span>);
          } else if (keywords.has(tok)) {
            tokens.push(<span key={key} className="text-indigo-400 font-semibold">{tok}</span>);
          } else if (builtins.has(tok)) {
            tokens.push(<span key={key} className="text-cyan-400">{tok}</span>);
          } else if (/^[()\[\]{}:,;]$/.test(tok)) {
            tokens.push(<span key={key} className="text-slate-400">{tok}</span>);
          } else {
            tokens.push(<span key={key} className="text-slate-200">{tok}</span>);
          }
        }

        return (
          <div key={lineIdx} className="table-row hover:bg-slate-800/40">
            <span className="table-cell pr-4 select-none text-slate-500 text-right opacity-40 text-2xs">
              {lineIdx + 1}
            </span>
            <span className="table-cell whitespace-pre">{tokens.length ? tokens : ' '}</span>
          </div>
        );
      })}
    </div>
  );
}

// Formats inline math notation like $O(N)$, $N \ge 1$, etc.
function renderInlineTextWithMath(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Split on inline code (`...`) and inline math ($...$) and bold (**...**)
  const regex = /(\$[^$]+\$|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    idx++;

    if (token.startsWith('$') && token.endsWith('$')) {
      const mathContent = token.slice(1, -1)
        .replace(/\\ge/g, '≥')
        .replace(/\\le/g, '≤')
        .replace(/\\ne/g, '≠')
        .replace(/\\approx/g, '≈')
        .replace(/\\times/g, '×')
        .replace(/\\cdot/g, '·')
        .replace(/\\in/g, '∈')
        .replace(/\\sum/g, '∑')
        .replace(/\\infty/g, '∞');

      parts.push(
        <span
          key={`math-${idx}`}
          className="font-serif italic font-medium px-1 text-indigo-950 bg-indigo-50/70 rounded border border-indigo-100 text-[13px] tracking-wide inline-block"
        >
          {mathContent}
        </span>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      const codeContent = token.slice(1, -1);
      parts.push(
        <code
          key={`code-${idx}`}
          className="font-mono text-2xs px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 border border-slate-200/80 font-medium"
        >
          {codeContent}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`bold-${idx}`} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={`italic-${idx}`} className="italic text-slate-700">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const [copiedBlocks, setCopiedBlocks] = useState<Record<number, boolean>>({});

  if (!content) return null;

  const handleCopy = (codeText: string, blockIdx: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedBlocks((prev) => ({ ...prev, [blockIdx]: true }));
    setTimeout(() => {
      setCopiedBlocks((prev) => ({ ...prev, [blockIdx]: false }));
    }, 2000);
  };

  // Parse blocks: code blocks (```lang ... ```) vs normal text paragraphs / lists
  const blocks: { type: 'code' | 'text' | 'quote' | 'header'; lang?: string; content: string }[] = [];
  const lines = content.split('\n');

  let currentBlockType: 'text' | 'code' | 'quote' = 'text';
  let currentLang = '';
  let currentBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (currentBlockType === 'code') {
        // End code block
        blocks.push({
          type: 'code',
          lang: currentLang || 'python',
          content: currentBuffer.join('\n'),
        });
        currentBuffer = [];
        currentBlockType = 'text';
      } else {
        // Start code block
        if (currentBuffer.length > 0) {
          blocks.push({
            type: currentBlockType,
            content: currentBuffer.join('\n'),
          });
          currentBuffer = [];
        }
        currentBlockType = 'code';
        currentLang = line.trim().slice(3).trim();
      }
    } else {
      currentBuffer.push(line);
    }
  }

  if (currentBuffer.length > 0) {
    blocks.push({
      type: currentBlockType,
      lang: currentLang,
      content: currentBuffer.join('\n'),
    });
  }

  return (
    <div className={`space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          const isCopied = !!copiedBlocks[idx];
          return (
            <div
              key={idx}
              className="my-3 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-slate-950/70 border-b border-slate-800 text-2xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-mono uppercase font-semibold text-slate-300">
                    {block.lang || 'python'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(block.content, idx)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 overflow-x-auto">
                {highlightCode(block.content, block.lang)}
              </div>
            </div>
          );
        }

        // Render text lines with headers, lists, and math
        const textLines = block.content.split('\n');
        return (
          <div key={idx} className="space-y-2">
            {textLines.map((line, lIdx) => {
              const trimmed = line.trim();

              if (!trimmed) {
                return <div key={lIdx} className="h-1.5" />;
              }

              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={lIdx} className="text-sm font-bold text-slate-900 pt-2 pb-1">
                    {renderInlineTextWithMath(trimmed.slice(4))}
                  </h4>
                );
              }

              if (trimmed.startsWith('## ')) {
                return (
                  <h3 key={lIdx} className="text-base font-bold text-slate-900 pt-3 pb-1">
                    {renderInlineTextWithMath(trimmed.slice(3))}
                  </h3>
                );
              }

              if (trimmed.startsWith('# ')) {
                return (
                  <h2 key={lIdx} className="text-lg font-bold text-slate-900 pt-3 pb-1">
                    {renderInlineTextWithMath(trimmed.slice(2))}
                  </h2>
                );
              }

              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={lIdx} className="flex items-start gap-2.5 pl-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                    <span className="flex-1">{renderInlineTextWithMath(trimmed.slice(2))}</span>
                  </div>
                );
              }

              // Numbered list
              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
              if (numMatch) {
                return (
                  <div key={lIdx} className="flex items-start gap-2.5 pl-2">
                    <span className="font-mono text-2xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                      {numMatch[1]}.
                    </span>
                    <span className="flex-1">{renderInlineTextWithMath(numMatch[2])}</span>
                  </div>
                );
              }

              // Blockquote / Callout
              if (trimmed.startsWith('> ')) {
                return (
                  <div
                    key={lIdx}
                    className="p-3 my-2 rounded-lg bg-indigo-50/50 border-l-3 border-indigo-500 text-xs text-indigo-950 flex items-start gap-2.5"
                  >
                    <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="flex-1">{renderInlineTextWithMath(trimmed.slice(2))}</div>
                  </div>
                );
              }

              // Standard paragraph
              return (
                <p key={lIdx} className="leading-relaxed">
                  {renderInlineTextWithMath(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
