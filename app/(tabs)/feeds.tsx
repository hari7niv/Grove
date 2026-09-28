/**
 * Feeds screen — RSS reader with feed management and article list.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing, maxContentWidth } from '@/src/design/tokens';
import {
  RssIcon,
  PlusIcon,
  RefreshIcon,
  BookmarkIcon,
  BookmarkFilledIcon,
  TrashIcon,
  ChevronRightIcon,
  SearchIcon,
  XIcon,
} from '@/src/components/ui/Icon';
import { useRepositories } from '@/src/db/provider';
import type { FeedSource, Article } from '@/src/types/models';
import { addFeedByUrl, refreshAllFeeds } from '@/src/engine/feed-service';

type ViewMode = 'all' | 'unread' | 'saved' | 'feeds';

export default function FeedsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = makeStyles(theme);
  const repositories = useRepositories();

  const [viewMode, setViewMode] = useState<ViewMode>('unread');
  const [articles, setArticles] = useState<Article[]>([]);
  const [feeds, setFeeds] = useState<FeedSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add feed modal state
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [feedUrl, setFeedUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedFeeds] = await Promise.all([
        repositories.feedSources.getAll(),
      ]);
      setFeeds(fetchedFeeds);

      let fetchedArticles: Article[];
      if (searchQuery.trim()) {
        fetchedArticles = await repositories.articles.search(searchQuery.trim());
      } else {
        switch (viewMode) {
          case 'unread':
            fetchedArticles = await repositories.articles.getUnread();
            break;
          case 'saved':
            fetchedArticles = await repositories.articles.getSaved();
            break;
          default:
            fetchedArticles = await repositories.articles.getAll();
        }
      }
      setArticles(fetchedArticles);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [repositories, viewMode, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const newCount = await refreshAllFeeds(repositories);
      if (newCount > 0) {
        showAlert('Feeds Refreshed', `${newCount} new article${newCount === 1 ? '' : 's'} found.`);
      } else {
        showAlert('All Caught Up', 'No new articles found.');
      }
      await loadData();
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Failed to refresh feeds.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddFeed = async () => {
    const url = feedUrl.trim();
    if (!url) return;

    setIsAdding(true);
    try {
      const result = await addFeedByUrl(url, repositories);
      showAlert(
        'Feed Added',
        `"${result.title}" added with ${result.articleCount} article${result.articleCount === 1 ? '' : 's'}.`
      );
      setFeedUrl('');
      setShowAddFeed(false);
      await loadData();
    } catch (e: any) {
      showAlert('Error', e.message || 'Failed to add feed.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteFeed = async (feed: FeedSource) => {
    if (Platform.OS === 'web') {
      if (confirm(`Unsubscribe from "${feed.title}"? All articles from this feed will be deleted.`)) {
        await repositories.feedSources.delete(feed.id);
        await loadData();
      }
    } else {
      Alert.alert(
        'Unsubscribe',
        `Remove "${feed.title}" and all its articles?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await repositories.feedSources.delete(feed.id);
              await loadData();
            },
          },
        ]
      );
    }
  };

  const handleToggleSaved = async (article: Article) => {
    await repositories.articles.toggleSaved(article.id);
    setArticles(prev =>
      prev.map(a =>
        a.id === article.id ? { ...a, isSaved: !a.isSaved } : a
      )
    );
  };

  const handleArticlePress = async (article: Article) => {
    if (!article.isRead) {
      await repositories.articles.markRead(article.id);
      setArticles(prev =>
        prev.map(a => (a.id === article.id ? { ...a, isRead: true } : a))
      );
    }
    router.push(`/reader/${article.id}` as any);
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const feedNameMap = React.useMemo(() => {
    const m = new Map<string, string>();
    feeds.forEach(f => m.set(f.id, f.title));
    return m;
  }, [feeds]);

  const renderViewToggle = (mode: ViewMode, label: string) => {
    const isActive = viewMode === mode;
    return (
      <Pressable
        style={[styles.viewToggle, isActive && styles.viewToggleActive]}
        onPress={() => {
          setViewMode(mode);
          setSearchQuery('');
        }}
      >
        <Text style={[styles.viewToggleText, isActive && styles.viewToggleTextActive]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  const renderArticle = ({ item }: { item: Article }) => (
    <Pressable
      style={[styles.articleCard, item.isRead && styles.articleCardRead]}
      onPress={() => handleArticlePress(item)}
    >
      <View style={styles.articleContent}>
        <Text
          style={[styles.articleTitle, item.isRead && styles.articleTitleRead]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {item.summary && (
          <Text style={styles.articleSummary} numberOfLines={2}>
            {item.summary}
          </Text>
        )}
        <View style={styles.articleMeta}>
          <Text style={styles.articleFeed} numberOfLines={1}>
            {feedNameMap.get(item.feedId) ?? 'Unknown'}
          </Text>
          {item.publishedAt && (
            <Text style={styles.articleDate}>
              {' · '}{formatDate(item.publishedAt)}
            </Text>
          )}
        </View>
      </View>
      <Pressable
        style={styles.saveButton}
        onPress={() => handleToggleSaved(item)}
        hitSlop={8}
      >
        {item.isSaved ? (
          <BookmarkFilledIcon size={18} color={theme.colors.accent} />
        ) : (
          <BookmarkIcon size={18} color={theme.colors.textTertiary} />
        )}
      </Pressable>
    </Pressable>
  );

  const renderFeedItem = ({ item }: { item: FeedSource }) => (
    <View style={styles.feedCard}>
      <View style={styles.feedInfo}>
        <RssIcon size={16} color={theme.colors.accent} />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={styles.feedTitle}>{item.title}</Text>
          <Text style={styles.feedUrl} numberOfLines={1}>{item.url}</Text>
        </View>
      </View>
      <Pressable
        style={styles.deleteFeedButton}
        onPress={() => handleDeleteFeed(item)}
        hitSlop={8}
      >
        <TrashIcon size={16} color={theme.colors.dying} />
      </Pressable>
    </View>
  );

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Reader</Text>
          <Text style={styles.subtitle}>
            {feeds.length === 0
              ? 'Add RSS feeds to start reading.'
              : `${feeds.length} feed${feeds.length === 1 ? '' : 's'} subscribed`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerButton}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={theme.colors.accent} />
            ) : (
              <RefreshIcon size={20} color={theme.colors.textSecondary} />
            )}
          </Pressable>
          <Pressable
            style={styles.addButton}
            onPress={() => setShowAddFeed(true)}
          >
            <PlusIcon size={20} color="#FFF" />
          </Pressable>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <SearchIcon size={16} color={theme.colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search articles..."
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={loadData}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => { setSearchQuery(''); }}>
            <XIcon size={16} color={theme.colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* View mode toggles */}
      <View style={styles.viewToggles}>
        {renderViewToggle('unread', 'Unread')}
        {renderViewToggle('all', 'All')}
        {renderViewToggle('saved', 'Saved')}
        {renderViewToggle('feeds', 'Feeds')}
      </View>

      {/* Add Feed inline form */}
      {showAddFeed && (
        <View style={styles.addFeedForm}>
          <Text style={styles.addFeedLabel}>Add Feed URL</Text>
          <View style={styles.addFeedRow}>
            <TextInput
              style={styles.addFeedInput}
              placeholder="https://example.com/feed.xml"
              placeholderTextColor={theme.colors.textTertiary}
              value={feedUrl}
              onChangeText={setFeedUrl}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onSubmitEditing={handleAddFeed}
            />
            <Pressable
              style={[styles.addFeedButton, isAdding && { opacity: 0.5 }]}
              onPress={handleAddFeed}
              disabled={isAdding || !feedUrl.trim()}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.addFeedButtonText}>Add</Text>
              )}
            </Pressable>
          </View>
          <Pressable onPress={() => { setShowAddFeed(false); setFeedUrl(''); }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      )}
    </>
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    if (viewMode === 'feeds') {
      return feeds.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.iconWrap}>
            <RssIcon size={48} color={theme.colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No Feeds</Text>
          <Text style={styles.emptyBody}>
            Tap the + button to subscribe to an RSS feed.
          </Text>
        </View>
      ) : null;
    }
    return (
      <View style={styles.emptyState}>
        <View style={styles.iconWrap}>
          <RssIcon size={48} color={theme.colors.textTertiary} />
        </View>
        <Text style={styles.emptyTitle}>
          {viewMode === 'saved' ? 'No Saved Articles' :
           viewMode === 'unread' ? 'All Caught Up' : 'No Articles'}
        </Text>
        <Text style={styles.emptyBody}>
          {feeds.length === 0
            ? 'Add an RSS feed to get started.'
            : viewMode === 'unread'
              ? "You've read everything! Refresh to check for new articles."
              : 'No articles match this filter.'}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={viewMode === 'feeds' ? feeds as any[] : articles}
        keyExtractor={(item) => item.id}
        renderItem={viewMode === 'feeds' ? renderFeedItem as any : renderArticle}
        contentContainerStyle={styles.content}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.accent}
          />
        }
      />
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: {
      maxWidth: maxContentWidth,
      alignSelf: 'center',
      width: '100%',
      padding: spacing.xl,
      paddingBottom: spacing['4xl'],
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.xl,
    },
    title: {
      fontFamily: 'Inter_700Bold',
      fontSize: 32,
      lineHeight: 40,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textSecondary,
      marginTop: spacing.xs,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButton: {
      backgroundColor: theme.colors.accent,
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Search
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.lg,
      height: 44,
    },
    searchInput: {
      flex: 1,
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: theme.colors.textPrimary,
      marginLeft: spacing.sm,
      paddingVertical: 0,
    },
    // View toggles
    viewToggles: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceRaised,
      padding: 4,
      borderRadius: 12,
      marginBottom: spacing.xl,
    },
    viewToggle: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderRadius: 8,
    },
    viewToggleActive: {
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    viewToggleText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    viewToggleTextActive: {
      color: theme.colors.textPrimary,
      fontFamily: 'Inter_600SemiBold',
    },
    // Add feed form
    addFeedForm: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.lg,
      marginBottom: spacing.xl,
    },
    addFeedLabel: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 15,
      color: theme.colors.textPrimary,
      marginBottom: spacing.md,
    },
    addFeedRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    addFeedInput: {
      flex: 1,
      backgroundColor: theme.colors.surfaceRaised,
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: theme.colors.textPrimary,
    },
    addFeedButton: {
      backgroundColor: theme.colors.accent,
      borderRadius: 10,
      paddingHorizontal: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addFeedButtonText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 15,
      color: '#FFF',
    },
    cancelText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    // Article card
    articleCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: spacing.md,
    },
    articleCardRead: {
      opacity: 0.7,
    },
    articleContent: {
      flex: 1,
    },
    articleTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      lineHeight: 22,
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    articleTitleRead: {
      color: theme.colors.textSecondary,
      fontFamily: 'Inter_500Medium',
    },
    articleSummary: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textSecondary,
      marginBottom: spacing.sm,
    },
    articleMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    articleFeed: {
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
      color: theme.colors.accent,
      maxWidth: 140,
    },
    articleDate: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      color: theme.colors.textTertiary,
    },
    saveButton: {
      paddingLeft: spacing.md,
      justifyContent: 'center',
    },
    // Feed card
    feedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: spacing.md,
    },
    feedInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    feedTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      color: theme.colors.textPrimary,
    },
    feedUrl: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: theme.colors.textTertiary,
      marginTop: 2,
    },
    deleteFeedButton: {
      padding: spacing.sm,
    },
    // Empty state
    emptyState: { alignItems: 'center', paddingVertical: spacing['5xl'] },
    iconWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 20,
      color: theme.colors.textPrimary,
      marginBottom: spacing.xs,
    },
    emptyBody: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      maxWidth: 300,
    },
  });
}
