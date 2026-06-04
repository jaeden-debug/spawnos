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

// ─── Categorised starter prompts (shown before first message) ────────────────
const STARTER_GROUPS: { label: string; icon: React.ReactNode; prompts: string[] }[] = [
  {
    label: 'Feeding',
    icon: <path d="M8 2v12M3 5c0 2 1 3 2.5 3.5M13 5c0 2-1 3-2.5 3.5" />,
    prompts: [
      'What is the best live food for my betta?',
      'My fish stopped eating — what should I do?',
    ],
  },
  {
    label: 'Setup',
    icon: <path d="M2 12h12M4 12V7m4 5V4m4 8V8" />,
    prompts: [
      'Build me a 20-gallon planted betta tank',
      'Set up a beginner 120L community tank',
    ],
  },
  {
    label: 'Health',
    icon: <path d="M8 2.5 9.6 6l3.9.3-3 2.6.9 3.8L8 10.8 4.6 12.7l.9-3.8-3-2.6L6.4 6 8 2.5Z" />,
    prompts: [
      'My fish have white spots — what is it?',
      'Why is my betta laying on the bottom?',
    ],
  },
  {
    label: 'Breeding',
    icon: <path d="M5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6 0a3 3 0 1 0 0-6M8 11v3" />,
    prompts: [
      'How do I condition a betta pair to spawn?',
      'What is the best first food for fry?',
    ],
  },
]

// ─── Brand mark used as the assistant avatar ─────────────────────────────────
function AssistantAvatar() {
  return (
    <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-gradient-to-br from-spawn-cyan/25 to-spawn-cyan/5 border border-spawn-cyan/30 shadow-[0_0_16px_rgba(0,212,255,0.18)]">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-spawn-cyan">
        <path d="M8 1.5 9.7 6.3 14.5 8 9.7 9.7 8 14.5 6.3 9.7 1.5 8 6.3 6.3 8 1.5Z" fill="currentColor" />
      </svg>
    </div>
  )
}

// ─── Inline text renderer: bold, inline code, [links](url) ───────────────────
function renderInline(text: string, key: string | number): React.ReactNode {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[2] !== undefined) {
      parts.push(
        <strong key={`b${match.index}`} className="font-semibold text-spawn-text">{match[2]}</strong>
      )
    } else if (match[3] !== undefined) {
      parts.push(
        <code key={`c${match.index}`} className="font-mono text-spawn-cyan text-[0.85em] bg-spawn-surface/80 border border-spawn-border/50 px-1.5 py-0.5 rounded">{match[3]}</code>
      )
    } else if (match[4] !== undefined && match[5] !== undefined) {
      const href = match[5]
      const label = match[4]
      const cls = 'font-medium text-spawn-cyan underline underline-offset-2 decoration-spawn-cyan/30 hover:decoration-spawn-cyan transition-colors'
      parts.push(
        href.startsWith('/') ? (
          <Link key={`l${match.index}`} href={href} className={cls}>{label}</Link>
        ) : (
          <a key={`l${match.index}`} href={href} target="_blank" rel="noopener noreferrer" className={cls}>{label}↗</a>
        )
      )
    }
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <span key={key}>{parts}</span>
}

// ─── Prose renderer — paragraphs, lists, light headings, inline formatting ───
function ProseMessage({ text, isStreaming }: { text: string; isStreaming?: boolean }) {
  const cursor = isStreaming ? (
    <span className="inline-block w-[2px] h-[1.05em] bg-spawn-cyan/80 align-[-0.15em] ml-0.5 animate-pulse" aria-hidden="true" />
  ) : null

  const blocks = text.split(/\n\n+/)
  const visible = blocks.filter((b) => b.trim())
  const rendered: React.ReactNode[] = []

  blocks.forEach((block, bi) => {
    const trimmed = block.trim()
    if (!trimmed) return

    // Light heading support (AI is told to avoid these, but render gracefully)
    const headingMatch = trimmed.match(/^#{2,4}\s+(.*)$/)
    if (headingMatch && trimmed.split('\n').length === 1) {
      rendered.push(
        <p key={`h${bi}`} className="text-[0.8rem] font-bold uppercase tracking-widest text-spawn-cyan/90 mt-1">
          {renderInline(headingMatch[1], bi)}
        </p>
      )
      return
    }

    const lines = trimmed.split('\n')
    const isList = lines.every((l) => l.match(/^[-*]\s/) || l.match(/^\d+\.\s/))

    if (isList && lines.length >= 1 && lines.some((l) => l.match(/^[-*]\s/) || l.match(/^\d+\.\s/))) {
      rendered.push(
        <ul key={`ul${bi}`} className="space-y-2 my-1">
          {lines.map((line, li) => {
            const content = line.replace(/^[-*]\s/, '').replace(/^\d+\.\s/, '')
            return (
              <li key={li} className="flex gap-2.5 leading-[1.7]">
                <span className="mt-[0.6em] w-1.5 h-1.5 rounded-full bg-spawn-cyan/60 shrink-0" />
                <span>{renderInline(content, li)}</span>
              </li>
            )
          })}
        </ul>
      )
      return
    }

    const softLines = trimmed.split('\n').filter(Boolean)
    rendered.push(
      <p key={`p${bi}`} className="leading-[1.75]">
        {softLines.map((line, li) => (
          <span key={li}>
            {renderInline(line, li)}
            {li < softLines.length - 1 && <br />}
          </span>
        ))}
        {bi === blocks.length - 1 && cursor}
      </p>
    )
  })

  if (visible.length === 0 && isStreaming) {
    return (
      <div className="flex items-center gap-1.5 h-5" aria-label="Thinking">
        <span className="w-1.5 h-1.5 rounded-full bg-spawn-cyan/70 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-spawn-cyan/70 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-spawn-cyan/70 animate-bounce" />
      </div>
    )
  }

  return <div className="space-y-4 text-[0.95rem] text-spawn-text-dim">{rendered}</div>
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

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  function resize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return

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

    const assistantId = `a-${Date.now()}`
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', streaming: true }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
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
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: snap, streaming: true } : m)))
        scrollToBottom(false)
      }

      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated, streaming: false } : m)))
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setError(msg)
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
    <div className="flex flex-col flex-1 overflow-hidden bg-spawn-bg">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-spawn-border/40 shrink-0 bg-spawn-bg/70 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <AssistantAvatar />
          <div className="leading-tight">
            <div className="text-sm font-bold text-spawn-text tracking-tight">SpawnOS Intelligence</div>
            <div className="text-[0.68rem] text-spawn-muted-text flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-spawn-cyan animate-pulse" />
              Aquatic AI · GPT-4o
            </div>
          </div>
        </div>
        {!isEmpty && (
          <button
            onClick={reset}
            className="text-xs font-medium text-spawn-muted-text hover:text-spawn-text transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-spawn-border/50 hover:border-spawn-border"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 6a4 4 0 1 1 4 4H4m0 0 2-2m-2 2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            New chat
          </button>
        )}
      </div>

      {/* ── Message thread ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center min-h-full px-5 py-10 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-spawn-cyan/25 to-spawn-cyan/5 border border-spawn-cyan/30 shadow-[0_0_32px_rgba(0,212,255,0.22)] mb-6">
              <svg width="26" height="26" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-spawn-cyan">
                <path d="M8 1.5 9.7 6.3 14.5 8 9.7 9.7 8 14.5 6.3 9.7 1.5 8 6.3 6.3 8 1.5Z" fill="currentColor" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-spawn-text mb-2">How can I help your tank?</h2>
            <p className="text-spawn-muted-text text-sm mb-9 max-w-sm leading-relaxed">
              Fish care, water chemistry, compatibility, breeding, disease — straight answers from a real aquatic intelligence.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
              {STARTER_GROUPS.map((group) => (
                <div key={group.label} className="text-left rounded-2xl border border-spawn-border/50 bg-spawn-card/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-spawn-cyan" aria-hidden="true">
                      {group.icon}
                    </svg>
                    <span className="text-[0.7rem] font-bold uppercase tracking-widest text-spawn-muted-text">{group.label}</span>
                  </div>
                  <div className="space-y-1.5">
                    {group.prompts.map((p) => (
                      <button
                        key={p}
                        onClick={() => send(p)}
                        disabled={isStreaming}
                        className="block w-full text-left text-[0.82rem] text-spawn-text-dim hover:text-spawn-text px-3 py-2 rounded-xl hover:bg-spawn-surface/70 transition-colors leading-snug"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-7 space-y-7">
            {messages.map((msg) => (
              <div key={msg.id} className="animate-fade-in">
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="bg-spawn-surface border border-spawn-border/60 rounded-2xl rounded-br-md px-4 py-2.5 max-w-[85%] text-[0.95rem] text-spawn-text leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <AssistantAvatar />
                    <div className="flex-1 min-w-0 pt-0.5">
                      <ProseMessage text={msg.content} isStreaming={msg.streaming} />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {error && (
              <div className="flex justify-center">
                <div className="text-xs text-rose-400/90 flex items-center gap-2 bg-rose-500/5 border border-rose-500/20 rounded-lg px-3 py-2">
                  <span>{error}</span>
                  <button onClick={() => setError('')} className="underline hover:no-underline">Dismiss</button>
                </div>
              </div>
            )}

            <div ref={bottomRef} className="h-px" />
          </div>
        )}
      </div>

      {/* ── Input bar ───────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-spawn-border/40 bg-spawn-bg/85 backdrop-blur-md px-4 sm:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-2 rounded-3xl border border-spawn-border/60 bg-spawn-surface/60 pl-4 pr-2 py-2 transition-all focus-within:border-spawn-cyan/40 focus-within:ring-2 focus-within:ring-spawn-cyan/10">
            <textarea
              ref={textareaRef}
              id={`${uid}-input`}
              value={draft}
              onChange={(e) => { setDraft(e.target.value); resize(e.target) }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your fish, tank, or water chemistry…"
              rows={1}
              disabled={isStreaming}
              aria-label="Message input"
              className="flex-1 resize-none bg-transparent py-2 text-[0.95rem] text-spawn-text placeholder:text-spawn-muted focus:outline-none leading-relaxed disabled:opacity-60"
              style={{ maxHeight: '160px', minHeight: '24px' }}
            />
            <button
              onClick={() => send(draft)}
              disabled={!draft.trim() || isStreaming}
              aria-label={isStreaming ? 'Waiting for response' : 'Send message'}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 mb-0.5 disabled:opacity-30 disabled:cursor-not-allowed ${
                draft.trim() && !isStreaming
                  ? 'bg-spawn-cyan text-spawn-bg shadow-[0_0_16px_rgba(0,212,255,0.4)] hover:scale-105'
                  : 'bg-spawn-border/60 text-spawn-muted-text'
              }`}
            >
              {isStreaming ? (
                <span className="w-2.5 h-2.5 rounded-sm bg-current opacity-80" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 13V3M8 3 4 7M8 3l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-[0.68rem] text-spawn-muted mt-2 text-center">
            SpawnOS Intelligence can make mistakes — verify critical parameters. Enter to send · Shift+Enter for new line.
          </p>
        </div>
      </div>

    </div>
  )
}
