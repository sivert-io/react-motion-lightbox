import { useEffect, useState, type ReactNode } from 'react'
import { parse, render, type ParseOptions } from 'sugar-high/core'
import * as css from 'sugar-high/lang/css'
import * as javascript from 'sugar-high/lang/javascript'
import * as shell from 'sugar-high/lang/shell'

// Only the three languages on the page, not sugar-high's whole registry. The
// cast is sugar-high's own documented pattern; its types don't quite line up.
const highlight = (code: string, name: string) =>
  render(parse(code, (name.endsWith('.css') ? css : name === 'Terminal' ? shell : javascript) as ParseOptions))

/** One step of the walkthrough: what to do and its code, and beside it, when there is one, a live example. */
export function Step({ n, title, demo, children }: { n: number; title: string; demo?: ReactNode; children: ReactNode }) {
  return (
    <li className={`grid items-start gap-x-12 gap-y-6 ${demo ? 'lg:grid-cols-2' : 'max-w-3xl'}`}>
      <div className="grid min-w-0 gap-4">
        <h3 className="flex items-baseline gap-3 text-xl sm:text-2xl">
          <span className="font-body text-base text-accent tabular-nums">{n}</span>
          {title}
        </h3>
        <div className="grid gap-4 text-muted [&_code]:text-ink">{children}</div>
      </div>
      {demo && <div className="min-w-0 lg:sticky lg:top-8">{demo}</div>}
    </li>
  )
}

/** A file's code with its name and a copy button along the top. Our own code, so the highlighted HTML is safe to set. */
export function Code({ name, children }: { name: string; children: string }) {
  return (
    <figure className="code">
      <figcaption>
        <code>{name}</code>
        <CopyButton text={children} />
      </figcaption>
      <pre className="text-ink">
        <code dangerouslySetInnerHTML={{ __html: highlight(children, name) }} />
      </pre>
    </figure>
  )
}

/** An on/off switch with its label. */
export function Switch({ checked, onChange, children }: { checked: boolean; onChange: (on: boolean) => void; children: ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="switch" onClick={() => onChange(!checked)}>
      <span className="switch-track" aria-hidden="true">
        <span className="switch-knob" />
      </span>
      {children}
    </button>
  )
}

/** The install line as one thing to copy. */
export function Copyable({ text }: { text: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-full border border-rule bg-paper-2 py-1.5 pr-1.5 pl-5">
      <code className="truncate text-ink">{text}</code>
      <CopyButton text={text} />
    </div>
  )
}

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])
  return (
    <button
      type="button"
      className={`min-h-9 shrink-0 cursor-pointer rounded-full bg-accent px-4 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90 active:opacity-80 ${className}`}
      onClick={() => {
        navigator.clipboard.writeText(text).then(
          () => setCopied(true),
          () => {},
        )
      }}
    >
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}
