/**
 * Tests for the RSS/Atom feed parser engine.
 */

import { parseFeed, parseOPML, generateOPML, stripHtml } from '../src/engine/feed-parser';

// ─── RSS 2.0 Tests ──────────────────────────────────────────────

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Example Blog</title>
    <link>https://example.com</link>
    <description>An example blog feed</description>
    <item>
      <title>First Post</title>
      <link>https://example.com/first</link>
      <guid>https://example.com/first</guid>
      <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
      <description>This is the first post summary.</description>
      <content:encoded><![CDATA[<p>This is the <strong>full content</strong> of the first post.</p>]]></content:encoded>
      <dc:creator>Alice</dc:creator>
    </item>
    <item>
      <title>Second Post</title>
      <link>https://example.com/second</link>
      <pubDate>Tue, 02 Jan 2024 12:00:00 GMT</pubDate>
      <description>&lt;p&gt;HTML encoded summary&lt;/p&gt;</description>
    </item>
  </channel>
</rss>`;

const SAMPLE_ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Feed Example</title>
  <link href="https://example.org/" rel="alternate"/>
  <link href="https://example.org/feed" rel="self"/>
  <id>urn:uuid:example-feed</id>
  <updated>2024-01-15T12:00:00Z</updated>
  <entry>
    <title>Atom Entry 1</title>
    <link href="https://example.org/entry1"/>
    <id>urn:uuid:entry-1</id>
    <published>2024-01-15T12:00:00Z</published>
    <author><name>Bob</name></author>
    <summary>Summary of entry one.</summary>
    <content type="html"><![CDATA[<h1>Entry 1</h1><p>Full content here.</p>]]></content>
  </entry>
  <entry>
    <title>Atom Entry 2</title>
    <link href="https://example.org/entry2"/>
    <id>urn:uuid:entry-2</id>
    <updated>2024-01-14T08:00:00Z</updated>
    <summary>Just a summary, no content.</summary>
  </entry>
</feed>`;

const SAMPLE_OPML = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>Test Feeds</title></head>
  <body>
    <outline text="Tech" title="Tech">
      <outline type="rss" text="Hacker News" title="Hacker News" xmlUrl="https://hnrss.org/frontpage" htmlUrl="https://news.ycombinator.com"/>
      <outline type="rss" text="Lobsters" title="Lobsters" xmlUrl="https://lobste.rs/rss"/>
    </outline>
    <outline type="rss" text="xkcd" title="xkcd" xmlUrl="https://xkcd.com/rss.xml" htmlUrl="https://xkcd.com"/>
  </body>
</opml>`;

describe('parseFeed — RSS 2.0', () => {
  const result = parseFeed(SAMPLE_RSS);

  test('extracts feed title', () => {
    expect(result.title).toBe('Example Blog');
  });

  test('extracts site URL', () => {
    expect(result.siteUrl).toBe('https://example.com');
  });

  test('parses correct number of articles', () => {
    expect(result.articles).toHaveLength(2);
  });

  test('extracts article titles', () => {
    expect(result.articles[0].title).toBe('First Post');
    expect(result.articles[1].title).toBe('Second Post');
  });

  test('extracts article URLs', () => {
    expect(result.articles[0].url).toBe('https://example.com/first');
  });

  test('extracts guid', () => {
    expect(result.articles[0].guid).toBe('https://example.com/first');
  });

  test('extracts dc:creator as author', () => {
    expect(result.articles[0].author).toBe('Alice');
  });

  test('normalizes pubDate to ISO', () => {
    expect(result.articles[0].publishedAt).toMatch(/2024-01-01/);
  });

  test('prefers content:encoded over description for content', () => {
    expect(result.articles[0].content).toContain('<strong>full content</strong>');
  });

  test('uses description as summary', () => {
    expect(result.articles[0].summary).toBe('This is the first post summary.');
  });

  test('handles HTML-encoded description', () => {
    expect(result.articles[1].summary).toContain('HTML encoded summary');
  });

  test('falls back to link as guid when guid absent', () => {
    // Second item has no guid, should use link
    expect(result.articles[1].guid).toBe('https://example.com/second');
  });
});

describe('parseFeed — Atom 1.0', () => {
  const result = parseFeed(SAMPLE_ATOM);

  test('extracts feed title', () => {
    expect(result.title).toBe('Atom Feed Example');
  });

  test('extracts alternate link as siteUrl', () => {
    expect(result.siteUrl).toBe('https://example.org/');
  });

  test('parses correct number of entries', () => {
    expect(result.articles).toHaveLength(2);
  });

  test('extracts entry title', () => {
    expect(result.articles[0].title).toBe('Atom Entry 1');
  });

  test('extracts entry link', () => {
    expect(result.articles[0].url).toBe('https://example.org/entry1');
  });

  test('extracts entry id', () => {
    expect(result.articles[0].guid).toBe('urn:uuid:entry-1');
  });

  test('extracts nested author name', () => {
    expect(result.articles[0].author).toBe('Bob');
  });

  test('normalizes published date', () => {
    expect(result.articles[0].publishedAt).toMatch(/2024-01-15/);
  });

  test('extracts CDATA content', () => {
    expect(result.articles[0].content).toContain('Entry 1');
  });

  test('falls back to updated when published is absent', () => {
    expect(result.articles[1].publishedAt).toMatch(/2024-01-14/);
  });

  test('uses summary for article without content', () => {
    expect(result.articles[1].content).toContain('Just a summary');
  });
});

describe('parseOPML', () => {
  const result = parseOPML(SAMPLE_OPML);

  test('finds all feed outlines', () => {
    expect(result).toHaveLength(3);
  });

  test('extracts titles', () => {
    expect(result[0].title).toBe('Hacker News');
    expect(result[1].title).toBe('Lobsters');
    expect(result[2].title).toBe('xkcd');
  });

  test('extracts xmlUrl', () => {
    expect(result[0].url).toBe('https://hnrss.org/frontpage');
  });

  test('ignores non-feed outlines', () => {
    // The "Tech" parent outline has no xmlUrl, should not appear
    expect(result.every(f => f.url.startsWith('http'))).toBe(true);
  });
});

describe('generateOPML', () => {
  const feeds = [
    { title: 'Feed One', url: 'https://example.com/feed1.xml', siteUrl: 'https://example.com' },
    { title: 'Feed Two', url: 'https://example.com/feed2.xml' },
  ];

  const opml = generateOPML(feeds);

  test('generates valid OPML structure', () => {
    expect(opml).toContain('<?xml');
    expect(opml).toContain('<opml');
    expect(opml).toContain('</opml>');
  });

  test('includes feed entries', () => {
    expect(opml).toContain('Feed One');
    expect(opml).toContain('Feed Two');
  });

  test('includes xmlUrl', () => {
    expect(opml).toContain('xmlUrl="https://example.com/feed1.xml"');
  });

  test('includes htmlUrl when siteUrl present', () => {
    expect(opml).toContain('htmlUrl="https://example.com"');
  });

  test('round-trips through parseOPML', () => {
    const parsed = parseOPML(opml);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].title).toBe('Feed One');
    expect(parsed[0].url).toBe('https://example.com/feed1.xml');
  });
});

describe('stripHtml', () => {
  test('removes tags', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  test('decodes entities', () => {
    expect(stripHtml('&amp; &lt; &gt; &quot; &#39;')).toBe("& < > \" '");
  });

  test('collapses whitespace', () => {
    expect(stripHtml('  hello   world  ')).toBe('hello world');
  });

  test('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });
});
