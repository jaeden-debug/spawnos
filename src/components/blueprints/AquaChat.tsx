'use client'

import { useState, useRef, useEffect, useCallback, useId } from 'react'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

// ─── Starter prompts — shown only before first message ───────────────────────
const STARTERS = [
  'Build me a 60L blackwater planted betta setup',
  'What water parameters do cherry shrimp actually need?',
  "My fish have white spots — what is it and how do I treat it?",
  'Can discus and angelfish share a tank?',
  'Set up a 120L community tank for a beginner',
  'Why does my pH crash overnight?',
]

// ─── Inline text renderer ────────────────────────────────────────────────────
// Handles bold, inline code, and [links](url). That's all.
// The AI is instructed not to produce headers or heavy markdown.
function renderInline(text: string, key: string | number): React.ReactNode {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index))
    }
    if (match[2] !== undefined) {
      parts.push(
        <strong key={`b${match.index}`} className="font-semibold text-spawn-text">
          {match[2]}
        </strong>
      )
    } else if (match[3] !== undefined) {
      parts.push(
        <code key={`c${match.index}`} className="font-mono text-spawn-cyan text-[0.85em] bg-spawn-surface/80 px-1.5 py-0.5 rounded">
          {match[3]}
        </code>
      )
    } else if (match[4] !== undefined && match[5] !== undefined) {
      const href = match[5]
      const label = match[4]
      parts.push(
        href.startsWith('/') ? (
          <Link key={`l${match.index}`} href={href} className="text-spawn-cyan underline underline-offset-2 decoration-spawn-cyan/40 hover:decoration-spawn-cyan transition-colors">
            {label}
          </Link>
        ) : (
          <a key={`l${match.index}`} href={href} target="_blank" rel="noopener noreferrer" className="text-spawn-cyan underline underline-offset-2 decoration-spawn-cyan/40 hover:decoration-spawn-cyan transition-colors">
            {label}
          </a>
        )
      )
    }
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <span key={key}>{parts}</span>
}

// ─── Prose renderer ──────────────────────────────────────────────────────────
// Converts the AI's text into clean paragraphs.
// Supports: paragraphs (blank line), soft line breaks, bullet lists, inline formatting.
// Does NOT attempt to render markdown headers — the AI is told not to use them.
function ProseMessage({ text, isStreaming }: { text: string; isStreaming?: boolean }) {
  const cursor = isStreaming ? (
    <span className="inline-block w-[2px] h-[1.1em] bg-spawn-cyan/80 align-middle ml-0.5 animate-pulse" aria-hidden="true" />
  ) : null

  // Split into blocks on double newlines
  const blocks = text.split(/\n\n+/)
  const rendered: React.ReactNode[] = []

  blocks.forEach((block, bi) => {
    const trimmed = block.trim()
    if (!trimmed) return

    // Bullet list block
    const lines = trimmed.split('\n')
    const isList = lines.every((l) => l.match(/^[-*]\s/) || l.match(/^\d+\.\s/))

    if (isList && lines.length >= 2) {
      rendered.push(
        <ul key={`ul${bi}`} className="space-y-1.5 my-3 pl-0">
          {lines.map((line, li) => {
            const content = line.replace(/^[-*]\s/, '').replace(/^\d+\.\s/, '')
            return (
              <li key={li} className="flex gap-2.5 text-[0.925rem] leading-relaxed text-spawn-muted-text">
                <span className="mt-[0.35em] w-1 h-1 rounded-full bg-spawn-cyan/50 shrink-0" />
                <span>{renderInline(content, li)}</span>
              </li>
            )
          })}
        </ul>
      )
      return
    }

    // Mixed block — may have soft line breaks within a paragraph
    const softLines = trimmed.split('\n').filter(Boolean)
    const isLast = bi === blocks.filter((b) => b.trim()).length - 1

    rendered.push(
      <p key={`p${bi}`} className="text-[0.925rem] leading-[1.75] text-spawn-muted-text">
        {softLines.map((line, li) => (
          <span key={li}>
            {renderInline(line, li)}
            {li < softLines.length - 1 && ' '}
          </span>
        ))}
        {isLast && cursor}
      </p>
    )
  })

  // If still streaming but no blocks rendered yet (first few chars)
  if (rendered.length === 0 && isStreaming) {
    rendered.push(
      <p key="empty" className="text-[0.925rem] leading-[1.75] text-spawn-muted-text">
        {cursor}
      </p>
    )
  }

  return <div className="space-y-3">{rendered}</div>
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AquaChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const uid = useId()

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant', block: 'end' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Auto-resize textarea
  function resize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return

    // Abort any prior stream
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: trimmed }
    const history = [...messages, userMsg]

    setMessages(history)
    setDraft('')
    setError('')
    setIsStreaming(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }

    // Placeholder streaming message
    const assistantId = `a-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', streaming: true },
    ])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(errData.error ?? 'Request failed')
      }

      if (!res.body) throw new Error('No response stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        const snap = accumulated
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: snap, streaming: true } : m))
        )
        scrollToBottom(false)
      }

      // Finalise — remove streaming flag
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated, streaming: false } : m))
      )
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setError(msg)
      // Remove the empty placeholder
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
    } finally {
      setIsStreaming(false)
      scrollToBottom()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(draft)
    }
  }

  function reset() {
    abortRef.current?.abort()
    setMessages([])
    setDraft('')
    setError('')
    setIsStreaming(false)
    textareaRef.current?.focus()
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-spawn-border/30 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-spawn-cyan animate-pulse" />
          <span className="text-sm font-semibold text-spawn-text tracking-tight">SpawnOS Intelligence</span>
        </div>
        {!isEmpty && (
          <button
            onClick={reset}
            className="text-xs text-spawn-muted-text hover:text-spawn-text transition-colors flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 6a4 4 0 1 1 4 4H4m0 0 2-2m-2 2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New chat
          </button>
        )}
      </div>

      {/* ── Message thread ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          /* ── Empty state ─── */
          <div className="flex flex-col items-center justify-center h-full px-6 pb-8 text-center">
            <p className="text-spawn-muted-text text-sm mb-8 max-w-xs leading-relaxed">
              Ask anything — fish care, chemistry, compatibility, breeding, or disease.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={isStreaming}
                  className="text-left px-4 py-3 rounded-xl border border-spawn-border/40 text-xs text-spawn-muted-text hover:text-spawn-text hover:border-spawn-border/80 transition-all leading-snug"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Conversation ─── */
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-8">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === 'user' ? (
                  /* User message */
                  <div className="flex justify-end">
                    <p className="text-[0.875rem] text-spawn-muted-text max-w-[78%] leading-relaxed text-right">
                      {msg.content}
                    </p>
                  </div>
                ) : (
                  /* Assistant message */
                  <div className="flex gap-3">
                    <div className="w-[2px] bg-spawn-cyan/20 rounded-full shrink-0 mt-1" style={{ minHeight: '1.2em' }} />
                    <div className="flex-1 min-w-0">
                      <ProseMessage text={msg.content} isStreaming={msg.streaming} />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {error && (
              <div className="flex justify-center">
                <div className="text-xs text-rose-400/80 flex items-center gap-2">
                  <span>Something went wrong.</span>
                  <button onClick={() => setError('')} className="underline hover:no-underline">Dismiss</button>
                </div>
              </div>
            )}

            <div ref={bottomRef} className="h-px" />
          </div>
        )}
      </div>

      {/* ── Input bar ───────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-spawn-border/30 bg-spawn-bg/80 backdrop-blur-sm px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              id={`${uid}-input`}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                resize(e.target)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your fish, tank, or water chemistry…"
              rows={1}
              disabled={isStreaming}
              aria-label="Message input"
              className="flex-1 resize-none bg-spawn-surface/50 border border-spawn-border/50 rounded-xl px-4 py-3 text-sm text-spawn-text placeholder:text-spawn-muted focus:outline-none focus:border-spawn-cyan/40 focus:ring-1 focus:ring-spawn-cyan/15 transition-all leading-relaxed disabled:opacity-60"
              style={{ maxHeight: '140px', minHeight: '46px' }}
            />
            <button
              onClick={() => send(draft)}
              disabled={!draft.trim() || isStreaming}
              aria-label={isStreaming ? 'Waiting for response' : 'Send message'}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 disabled:opacity-35 disabled:cursor-not-allowed ${
                draft.trim() && !isStreaming
                  ? 'bg-spawn-cyan text-spawn-bg'
                  : 'bg-spawn-surface border border-spawn-border/50 text-spawn-muted-text'
              }`}
            >
              {isStreaming ? (
                <span className="w-3 h-3 rounded-sm bg-current opacity-70" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M14 2L7 9M14 2L10 14L7 9M14 2L2 6L7 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          <p className="text-[0.7rem] text-spawn-muted mt-2 text-center opacity-50">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

    </div>
  )
}
