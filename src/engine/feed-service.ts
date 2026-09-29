/**
 * Feed fetching service.
 *
 * Handles fetching RSS/Atom feeds with CORS proxy fallback for web.
 * On native, fetches directly. On web, uses a lightweight CORS proxy.
 */

import { Platform } from 'react-native';
import { parseFeed, type ParsedFeed, type ParsedArticle } from './feed-parser';
import type { Repositories } from '../db/repositories';
import { nowISO } from '../utils/date';

/**
 * Fetch a feed URL and return the parsed result.
 * Uses a CORS proxy on web platforms.
 */
export async function fetchFeed(feedUrl: string, proxyUrl: string): Promise<ParsedFeed> {
  const url = Platform.OS === 'web'
    ? `${proxyUrl}${encodeURIComponent(feedUrl)}`
    : feedUrl;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();

  if (!xml.includes('<') || (!xml.includes('<rss') && !xml.includes('<feed') && !xml.includes('<channel'))) {
    throw new Error('Response is not valid RSS or Atom XML');
  }

  return parseFeed(xml);
}

/**
 * Refresh a single feed: fetch, parse, and upsert new articles into the database.
 * Returns the count of new articles added.
 */
export async function refreshFeed(
  feedId: string,
  feedUrl: string,
  repositories: Repositories,
): Promise<number> {
  const settings = await repositories.settings.getAll();
  const parsed = await fetchFeed(feedUrl, settings.rssProxyUrl);
  let newCount = 0;

  for (const article of parsed.articles) {
    if (!article.url) continue;

    // Check if article already exists (by URL)
    const existing = await repositories.articles.getByGuid(article.url);
    if (existing) continue;

    await repositories.articles.create({
      feedId,
      title: article.title,
      url: article.url,
      author: article.author,
      publishedAt: article.publishedAt,
      content: article.content,
      summary: article.summary,
      isRead: false,
      isSaved: false,
      readMinutes: 0,
    });
    newCount++;
  }

  // Update lastFetched
  await repositories.feedSources.update(feedId, { lastFetched: nowISO() });

  return newCount;
}

/**
 * Refresh all feeds. Returns total new articles.
 */
export async function refreshAllFeeds(repositories: Repositories): Promise<number> {
  const feeds = await repositories.feedSources.getAll();
  let totalNew = 0;

  for (const feed of feeds) {
    try {
      const count = await refreshFeed(feed.id, feed.url, repositories);
      totalNew += count;
    } catch (e) {
      console.warn(`[Feed] Failed to refresh "${feed.title}":`, e);
    }
  }

  return totalNew;
}

/**
 * Add a new feed by URL. Auto-discovers the title from the feed itself.
 * Returns the created FeedSource and count of initial articles.
 */
export async function addFeedByUrl(
  feedUrl: string,
  repositories: Repositories,
): Promise<{ feedId: string; title: string; articleCount: number }> {
  // Check for duplicate
  const existing = await repositories.feedSources.getByUrl(feedUrl);
  if (existing) {
    throw new Error('This feed is already subscribed');
  }

  // Fetch and parse to get the title
  const settings = await repositories.settings.getAll();
  const parsed = await fetchFeed(feedUrl, settings.rssProxyUrl);

  const feed = await repositories.feedSources.create({
    title: parsed.title,
    url: feedUrl,
    siteUrl: parsed.siteUrl,
    lastFetched: nowISO(),
  });

  // Insert articles
  let count = 0;
  for (const article of parsed.articles) {
    if (!article.url) continue;
    await repositories.articles.create({
      feedId: feed.id,
      title: article.title,
      url: article.url,
      author: article.author,
      publishedAt: article.publishedAt,
      content: article.content,
      summary: article.summary,
      isRead: false,
      isSaved: false,
      readMinutes: 0,
    });
    count++;
  }

  return { feedId: feed.id, title: feed.title, articleCount: count };
}
