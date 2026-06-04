import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import type React from 'react'

/** Slugify heading text into an anchor id. Shared so a TOC can match headings. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Shared premium MDX component map + renderer for all long-form SpawnOS content
 * (species guides, Lab Notes articles, calculator/compatibility explainers).
 * Renders luxurious cards, accent headings, callout blockquotes and real tables.
 */
export const mdxComponents = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => {
    const id = typeof props.children === 'string' ? slugify(props.children) : undefined
    return <h2 id={id} className="text-[1.7rem] sm:text-3xl font-black tracking-tight text-spawn-text mt-16 mb-5 pl-4 scroll-mt-28 border-l-[3px] border-spawn-cyan/70" {...props} />
  },
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-xl sm:text-2xl font-bold text-spawn-text mt-10 mb-3 scroll-mt-28" {...props} />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="text-base font-bold uppercase tracking-widest text-spawn-cyan/90 mt-8 mb-2" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-[1.0625rem] text-spawn-text-dim leading-[1.85] mb-5" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="space-y-2.5 mb-6 ml-1 marker:text-spawn-cyan list-disc pl-5 text-spawn-text-dim" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="space-y-2.5 mb-6 ml-1 list-decimal pl-5 marker:text-spawn-cyan marker:font-bold text-spawn-text-dim" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="text-[1.0625rem] text-spawn-text-dim leading-[1.7] pl-1.5" {...props} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-bold text-spawn-text" {...props} />
  ),
  em: (props: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic text-spawn-text-dim" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const href = props.href ?? '#'
    const cls = 'font-semibold text-spawn-cyan underline decoration-spawn-cyan/30 underline-offset-[3px] hover:decoration-spawn-cyan transition-colors'
    if (href.startsWith('/')) {
      return <Link href={href} className={cls}>{props.children}</Link>
    }
    return <a {...props} className={cls} target="_blank" rel="noopener noreferrer" />
  },
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="relative my-7 rounded-2xl border border-spawn-cyan/25 bg-gradient-to-br from-spawn-cyan/[0.07] to-transparent pl-6 pr-5 py-5 text-spawn-text-dim [&>p]:mb-0 [&>p+p]:mt-3 [&_strong]:text-spawn-cyan" {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code className="rounded-md bg-spawn-surface border border-spawn-border/60 px-1.5 py-0.5 text-[0.85em] font-mono text-spawn-cyan" {...props} />
  ),
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-8 overflow-x-auto rounded-2xl border border-spawn-border/70 bg-spawn-card/60 shadow-card backdrop-blur">
      <table className="w-full text-sm border-collapse" {...props} />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-spawn-cyan/[0.06] border-b border-spawn-border" {...props} />
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="px-5 py-3.5 text-left font-bold text-spawn-text text-[0.7rem] uppercase tracking-[0.12em]" {...props} />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-5 py-3.5 text-spawn-text-dim align-top [&>strong]:text-spawn-text" {...props} />
  ),
  tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="border-b border-spawn-border/30 last:border-0 hover:bg-spawn-surface/40 transition-colors" {...props} />
  ),
  hr: () => <hr className="border-0 h-px my-12 bg-gradient-to-r from-transparent via-spawn-border to-transparent" />,
}

export default function MdxRenderer({ source }: { source: string }) {
  return (
    <div className="max-w-none">
      <MDXRemote source={source} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
    </div>
  )
}
