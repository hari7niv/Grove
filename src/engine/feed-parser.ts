/**
 * RSS/Atom feed parser — pure engine module.
 *
 * Parses raw XML strings into normalized FeedData and ArticleData objects.
 * No network, no side effects. Handles both RSS 2.0 and Atom 1.0 formats.
 */

export interface ParsedFeed {
  title: string;
  siteUrl: string | null;
  articles: ParsedArticle[];
}

export interface ParsedArticle {
  /** Unique identifier — <guid>, <id>, or fallback to url */
  guid: string;
  title: string;
  url: string;
  author: string | null;
  publishedAt: string | null;
  content: string | null;
  summary: string | null;
}

/**
 * Parse an RSS 2.0 or Atom 1.0 XML string into a normalized feed object.
 */
export function parseFeed(xml: string): ParsedFeed {
  // Detect format
  const isAtom = xml.includes('<feed') && xml.includes('xmlns="http://www.w3.org/2005/Atom"');

  if (isAtom) {
    return parseAtom(xml);
  }
  return parseRSS(xml);
}

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Extract text content from an XML tag. Handles CDATA.
 * Returns null if the tag is not found.
 */
function getTagContent(xml: string, tagName: string): string | null {
  // Try self-closing tags first
  const selfClosingRegex = new RegExp(`<${tagName}[^>]*/\\s*>`, 'i');
  const selfMatch = selfClosingRegex.exec(xml);

  // Try opening/closing tags
  const regex = new RegExp(
    `<${tagName}(?:\\s[^>]*)?>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))\\s*</${tagName}>`,
    'i'
  );
  const match = regex.exec(xml);
  if (!match) return null;
  // CDATA content or plain content
  const raw = match[1] ?? match[2] ?? '';
  return raw.trim() || null;
}

/**
 * Extract an attribute value from a tag.
 */
function getAttrValue(tag: string, attr: string): string | null {
  const regex = new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, 'i');
  const match = regex.exec(tag);
  return match?.[1]?.trim() ?? null;
}

/**
 * Split XML into blocks by a given tag name.
 */
function splitByTag(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}[\\s>][\\s\\S]*?</${tagName}>`, 'gi');
  const matches = xml.match(regex);
  return matches ?? [];
}

/**
 * Strip HTML tags to plain text (for summaries).
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Try to parse a date string into an ISO string.
 * Returns the original string if parsing fails.
 */
function normalizeDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toISOString();
  } catch {
    return dateStr;
  }
}

// ─── RSS 2.0 Parser ─────────────────────────────────────────────

function parseRSS(xml: string): ParsedFeed {
  const channelMatch = xml.match(/<channel[\s>][\s\S]*?<\/channel>/i);
  const channelXml = channelMatch?.[0] ?? xml;

  const title = getTagContent(channelXml, 'title') ?? 'Untitled Feed';
  const siteUrl = getTagContent(channelXml, 'link');

  const itemBlocks = splitByTag(channelXml, 'item');
  const articles: ParsedArticle[] = itemBlocks.map((itemXml) => {
    const itemTitle = getTagContent(itemXml, 'title') ?? 'Untitled';
    const link = getTagContent(itemXml, 'link') ?? '';
    const guid = getTagContent(itemXml, 'guid') ?? link;
    const author =
      getTagContent(itemXml, 'dc:creator') ??
      getTagContent(itemXml, 'author') ??
      null;
    const pubDate = normalizeDate(getTagContent(itemXml, 'pubDate'));
    const contentEncoded = getTagContent(itemXml, 'content:encoded');
    const description = getTagContent(itemXml, 'description');

    return {
      guid: guid || link || itemTitle,
      title: stripHtml(itemTitle),
      url: link,
      author: author ? stripHtml(author) : null,
      publishedAt: pubDate,
      content: contentEncoded ?? description ?? null,
      summary: description ? stripHtml(description).slice(0, 300) : null,
    };
  });

  return { title: stripHtml(title), siteUrl, articles };
}

// ─── Atom 1.0 Parser ────────────────────────────────────────────

function parseAtom(xml: string): ParsedFeed {
  const title = getTagContent(xml, 'title') ?? 'Untitled Feed';

  // Atom site link: <link rel="alternate" href="..."/>
  let siteUrl: string | null = null;
  const linkRegex = /<link[^>]*rel\s*=\s*["']alternate["'][^>]*>/gi;
  const linkMatch = linkRegex.exec(xml);
  if (linkMatch) {
    siteUrl = getAttrValue(linkMatch[0], 'href');
  }
  if (!siteUrl) {
    // Fallback: first <link> with href
    const fallbackMatch = /<link[^>]*href\s*=\s*["']([^"']*)["'][^>]*>/i.exec(xml);
    siteUrl = fallbackMatch?.[1] ?? null;
  }

  const entryBlocks = splitByTag(xml, 'entry');
  const articles: ParsedArticle[] = entryBlocks.map((entryXml) => {
    const entryTitle = getTagContent(entryXml, 'title') ?? 'Untitled';
    const id = getTagContent(entryXml, 'id') ?? '';

    // Entry link
    let entryUrl = '';
    const entryLinkMatch = /<link[^>]*href\s*=\s*["']([^"']*)["'][^>]*>/i.exec(entryXml);
    if (entryLinkMatch) {
      entryUrl = entryLinkMatch[1];
    }

    const author = getTagContent(entryXml, 'name'); // nested in <author><name>
    const published =
      normalizeDate(getTagContent(entryXml, 'published')) ??
      normalizeDate(getTagContent(entryXml, 'updated'));
    const content = getTagContent(entryXml, 'content');
    const summary = getTagContent(entryXml, 'summary');

    return {
      guid: id || entryUrl || entryTitle,
      title: stripHtml(entryTitle),
      url: entryUrl,
      author: author ? stripHtml(author) : null,
      publishedAt: published,
      content: content ?? summary ?? null,
      summary: summary
        ? stripHtml(summary).slice(0, 300)
        : content
          ? stripHtml(content).slice(0, 300)
          : null,
    };
  });

  return { title: stripHtml(title), siteUrl, articles };
}

/**
 * Parse OPML XML into a flat list of feed URLs with titles.
 */
export function parseOPML(xml: string): { title: string; url: string }[] {
  const results: { title: string; url: string }[] = [];
  const outlineRegex = /<outline[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = outlineRegex.exec(xml)) !== null) {
    const tag = match[0];
    const xmlUrl = getAttrValue(tag, 'xmlUrl');
    if (xmlUrl) {
      const title =
        getAttrValue(tag, 'title') ??
        getAttrValue(tag, 'text') ??
        'Untitled Feed';
      results.push({ title, url: xmlUrl });
    }
  }

  return results;
}

/**
 * Generate OPML XML from a list of feeds.
 */
export function generateOPML(
  feeds: { title: string; url: string; siteUrl?: string | null }[]
): string {
  const outlines = feeds
    .map(
      (f) =>
        `    <outline type="rss" text="${escapeXml(f.title)}" title="${escapeXml(f.title)}" xmlUrl="${escapeXml(f.url)}"${f.siteUrl ? ` htmlUrl="${escapeXml(f.siteUrl)}"` : ''} />`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Grove RSS Subscriptions</title>
  </head>
  <body>
${outlines}
  </body>
</opml>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
