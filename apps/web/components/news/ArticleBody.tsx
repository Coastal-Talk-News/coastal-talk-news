import Image from 'next/image';
import { Fragment, type ReactNode } from 'react';
import type { ArticleContent } from '@coastal-talk-news/types';
import { ArticleFigure } from './ArticleFigure';

interface Mark {
  type?: string;
  attrs?: Record<string, unknown>;
}

interface Node {
  type?: string;
  text?: string;
  marks?: Mark[];
  attrs?: Record<string, unknown>;
  content?: Node[];
}

/**
 * Article bodies are authored in the CMS and stored as a Tiptap document, so
 * they are untrusted input rendered on a public page. Every node is turned into
 * a React element by name — nothing is ever passed to innerHTML — and link and
 * image URLs are checked, because `javascript:` in an href would otherwise be
 * a stored XSS.
 */
const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:'];

function safeUrl(value: unknown, allowRelative = true): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  try {
    // The base only matters for relative hrefs; absolute ones ignore it.
    const parsed = new URL(value, 'https://relative.invalid');
    if (!SAFE_PROTOCOLS.includes(parsed.protocol)) return null;
    if (!allowRelative && parsed.hostname === 'relative.invalid') return null;
    return value;
  } catch {
    return null;
  }
}

function attr(node: Node, name: string): string | undefined {
  const value = node.attrs?.[name];
  return typeof value === 'string' ? value : undefined;
}

function numberAttr(node: Node, name: string): number | undefined {
  const value = node.attrs?.[name];
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

/**
 * The CMS can align a paragraph or heading. The stored value picks a class
 * from this list rather than being written into a style attribute, so an
 * attribute that arrives as anything else simply falls back to the default.
 */
const ALIGN_CLASSES: Record<string, string> = {
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

function alignClass(node: Node): string | undefined {
  return ALIGN_CLASSES[attr(node, 'textAlign') ?? ''];
}

function withMarks(text: string, marks: Mark[] | undefined): ReactNode {
  if (!marks || marks.length === 0) return text;

  return marks.reduce<ReactNode>((child, mark) => {
    switch (mark.type) {
      case 'bold':
        return <strong>{child}</strong>;
      case 'italic':
        return <em>{child}</em>;
      case 'underline':
        return <u>{child}</u>;
      case 'strike':
        return <s>{child}</s>;
      case 'code':
        return <code>{child}</code>;
      case 'link': {
        const href = safeUrl(mark.attrs?.['href']);
        if (!href) return child;
        return (
          <a
            href={href}
            target="_blank"
            // Author-entered links are user content, so they carry nofollow/ugc
            // alongside the usual tab-nabbing protection.
            rel="noopener noreferrer nofollow ugc"
          >
            {child}
          </a>
        );
      }
      default:
        return child;
    }
  }, text);
}

const HEADING_TAGS = ['h2', 'h3', 'h4', 'h5', 'h6'] as const;

function renderNode(node: Node, key: string): ReactNode {
  const children = node.content?.map((child, index) =>
    renderNode(child, `${key}.${index}`),
  );

  switch (node.type) {
    case 'text':
      return (
        <Fragment key={key}>{withMarks(node.text ?? '', node.marks)}</Fragment>
      );

    case 'paragraph':
      // Tiptap emits an empty paragraph for a blank line; it would render as a
      // stray gap, so it is dropped.
      if (!node.content?.length) return null;
      return (
        <p key={key} className={alignClass(node)}>
          {children}
        </p>
      );

    case 'heading': {
      const level = node.attrs?.['level'];
      const index =
        typeof level === 'number' ? Math.min(Math.max(level, 1), 5) - 1 : 1;
      // The page's own h1 is the headline, so body headings start at h2.
      const Tag = HEADING_TAGS[index] ?? 'h3';
      return (
        <Tag key={key} className={alignClass(node)}>
          {children}
        </Tag>
      );
    }

    case 'bulletList':
      return <ul key={key}>{children}</ul>;
    case 'orderedList':
      return <ol key={key}>{children}</ol>;
    case 'listItem':
      return <li key={key}>{children}</li>;
    case 'blockquote':
      return <blockquote key={key}>{children}</blockquote>;
    case 'codeBlock':
      return (
        <pre key={key}>
          <code>{children}</code>
        </pre>
      );
    case 'horizontalRule':
      return <hr key={key} />;
    case 'hardBreak':
      return <br key={key} />;

    case 'image': {
      const src = safeUrl(attr(node, 'src'), false);
      if (!src) return null;
      const caption = attr(node, 'title');
      return (
        <ArticleFigure
          key={key}
          placement={node.attrs?.['placement']}
          widthPercent={node.attrs?.['widthPercent']}
        >
          {/* An author can paste any URL into the editor's image button, so a
              body image's host is unknowable and cannot be listed in
              next.config.js — and an unconfigured host makes next/image throw,
              taking the whole article down. `unoptimized` skips the loader that
              enforces that allowlist. It also means the browser fetches the
              image directly, so no-referrer keeps the reader's article URL from
              leaking to whatever third-party host it turns out to be.

              Library pictures arrive with their real size (cropped, when the
              editor cropped them), which reserves the right space; an outside
              one has none, so height:auto lets its true ratio take over once
              it loads. */}
          <Image
            src={src}
            alt={attr(node, 'alt') ?? caption ?? ''}
            width={numberAttr(node, 'naturalWidth') ?? 1280}
            height={numberAttr(node, 'naturalHeight') ?? 720}
            unoptimized
            referrerPolicy="no-referrer"
            className="h-auto w-full rounded-sm"
          />
          {caption && <figcaption>{caption}</figcaption>}
        </ArticleFigure>
      );
    }

    default:
      // An unrecognised node still renders whatever text it contains, so a new
      // editor extension degrades instead of silently dropping copy.
      return children ? <div key={key}>{children}</div> : null;
  }
}

export function ArticleBody({ content }: { content: ArticleContent }) {
  const nodes = Array.isArray(content?.content)
    ? (content.content as Node[])
    : [];

  return (
    <div className="article-body">
      {nodes.map((node, index) => renderNode(node, String(index)))}
    </div>
  );
}
