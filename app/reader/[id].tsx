/**
 * Article reader view.
 * Renders article content in a clean, readable format.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing, maxContentWidth } from '@/src/design/tokens';
import {
  ChevronLeftIcon,
  BookmarkIcon,
  BookmarkFilledIcon,
  ExternalLinkIcon,
} from '@/src/components/ui/Icon';
import { useRepositories } from '@/src/db/provider';
import type { Article, FeedSource } from '@/src/types/models';
import { stripHtml } from '@/src/engine/feed-parser';

export default function ReaderScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme);
  const repositories = useRepositories();
  const { width } = useWindowDimensions();

  const [article, setArticle] = useState<Article | null>(null);
  const [feedName, setFeedName] = useState<string>('');

  useEffect(() => {
    async function load() {
      if (typeof id !== 'string') return;
      const a = await repositories.articles.getById(id);
      if (a) {
        setArticle(a);
        // Mark as read
        if (!a.isRead) {
          await repositories.articles.markRead(id);
        }
        // Get feed name
        const feed = await repositories.feedSources.getById(a.feedId);
        if (feed) setFeedName(feed.title);
      }
    }
    load();
  }, [id, repositories]);

  const handleToggleSaved = async () => {
    if (!article) return;
    await repositories.articles.toggleSaved(article.id);
    setArticle(prev => prev ? { ...prev, isSaved: !prev.isSaved } : null);
  };

  const handleOpenInBrowser = () => {
    if (!article?.url) return;
    Linking.openURL(article.url);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  /**
   * Render HTML content as styled text.
   * Simple approach: strip tags for clean reading, preserve paragraphs.
   */
  const renderContent = (html: string) => {
    // Split by paragraph-like breaks
    const paragraphs = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<li>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      // Decode entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    return paragraphs.map((paragraph, i) => (
      <Text key={i} style={styles.paragraph}>
        {paragraph}
      </Text>
    ));
  };

  if (!article) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeftIcon size={24} color={theme.colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading article...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeftIcon size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.actionButton}
            onPress={handleToggleSaved}
          >
            {article.isSaved ? (
              <BookmarkFilledIcon size={20} color={theme.colors.accent} />
            ) : (
              <BookmarkIcon size={20} color={theme.colors.textSecondary} />
            )}
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={handleOpenInBrowser}
          >
            <ExternalLinkIcon size={20} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Article header */}
        <View style={styles.articleHeader}>
          <Text style={styles.feedLabel}>{feedName}</Text>
          <Text style={styles.articleTitle}>{article.title}</Text>
          <View style={styles.metaRow}>
            {article.author && (
              <Text style={styles.author}>{article.author}</Text>
            )}
            {article.author && article.publishedAt && (
              <Text style={styles.metaSeparator}> · </Text>
            )}
            {article.publishedAt && (
              <Text style={styles.date}>{formatDate(article.publishedAt)}</Text>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Article content */}
        <View style={styles.articleBody}>
          {article.content ? (
            renderContent(article.content)
          ) : article.summary ? (
            <>
              <Text style={styles.paragraph}>{article.summary}</Text>
              <Pressable
                style={styles.readMoreButton}
                onPress={handleOpenInBrowser}
              >
                <Text style={styles.readMoreText}>Read full article →</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={styles.readMoreButton}
              onPress={handleOpenInBrowser}
            >
              <Text style={styles.readMoreText}>Open in browser →</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: spacing.sm,
      marginLeft: -spacing.sm,
    },
    headerActions: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    actionButton: {
      padding: spacing.sm,
    },
    scrollContent: {
      maxWidth: 680,
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing['4xl'],
    },
    // Article header
    articleHeader: {
      paddingTop: spacing['2xl'],
      paddingBottom: spacing.xl,
    },
    feedLabel: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 13,
      color: theme.colors.accent,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.md,
    },
    articleTitle: {
      fontFamily: 'Inter_700Bold',
      fontSize: 28,
      lineHeight: 36,
      color: theme.colors.textPrimary,
      marginBottom: spacing.md,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    author: {
      fontFamily: 'Inter_500Medium',
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
    metaSeparator: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: theme.colors.textTertiary,
    },
    date: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: theme.colors.textTertiary,
    },
    // Divider
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginBottom: spacing.xl,
    },
    // Body
    articleBody: {
      paddingBottom: spacing['4xl'],
    },
    paragraph: {
      fontFamily: 'Inter_400Regular',
      fontSize: 17,
      lineHeight: 28,
      color: theme.colors.textPrimary,
      marginBottom: spacing.lg,
    },
    readMoreButton: {
      backgroundColor: theme.colors.accentLight,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: spacing.xl,
    },
    readMoreText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      color: theme.colors.accent,
    },
    // Loading
    loadingState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
  });
}
