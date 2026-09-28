/**
 * Global Search Screen
 * Searches across all entities: tasks, books, roadmaps, exercises, articles.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing, maxContentWidth } from '@/src/design/tokens';
import {
  ChevronLeftIcon,
  SearchIcon,
  XIcon,
  CheckIcon, // Task
  BookIcon,  // Book
  TargetIcon, // Roadmap
  FitnessIcon, // Exercise/Routine
  RssIcon,     // Article
} from '@/src/components/ui/Icon';
import { useRepositories } from '@/src/db/provider';
import { performGlobalSearch, type SearchResult, type SearchResultType } from '@/src/engine/search';
import { useDebounce } from '@/src/hooks/useDebounce';

const TYPE_ICONS: Record<SearchResultType, React.ComponentType<any>> = {
  task: CheckIcon,
  book: BookIcon,
  roadmap: TargetIcon,
  exercise: FitnessIcon,
  routine: FitnessIcon,
  article: RssIcon,
};

const TYPE_COLORS: Record<SearchResultType, string> = {
  task: '#2D7A4F',
  book: '#5B8FB0',
  roadmap: '#8B6DB0',
  exercise: '#C45B3E',
  routine: '#C45B3E',
  article: '#D4A843',
};

export default function SearchScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = makeStyles(theme);
  const repositories = useRepositories();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    async function search() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await performGlobalSearch(repositories.db, debouncedQuery);
        setResults(res);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }

    search();
  }, [debouncedQuery, repositories.db]);

  const renderItem = ({ item }: { item: SearchResult }) => {
    const Icon = TYPE_ICONS[item.type];
    const iconColor = TYPE_COLORS[item.type];

    return (
      <Pressable
        style={({ pressed }) => [styles.resultItem, pressed && styles.resultItemPressed]}
        onPress={() => router.push(item.route as any)}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor}20` }]}>
          <Icon size={20} color={iconColor} />
        </View>
        <View style={styles.resultContent}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.resultSubtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header & Search Bar */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeftIcon size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <View style={styles.searchBar}>
          <SearchIcon size={16} color={theme.colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Grove..."
            placeholderTextColor={theme.colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <XIcon size={16} color={theme.colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          query.trim().length > 0 ? (
            <View style={styles.emptyState}>
              {isSearching ? (
                <ActivityIndicator size="large" color={theme.colors.accent} />
              ) : (
                <>
                  <Text style={styles.emptyTitle}>No results found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try different keywords to find what you're looking for.
                  </Text>
                </>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <SearchIcon size={48} color={theme.colors.textTertiary} />
              <Text style={styles.emptyTitle}>Global Search</Text>
              <Text style={styles.emptySubtitle}>
                Search across tasks, reading notes, learning roadmaps, articles, and more.
              </Text>
            </View>
          )
        }
      />
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
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    backButton: {
      padding: spacing.sm,
      marginRight: spacing.sm,
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceRaised,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      height: 44,
    },
    searchInput: {
      flex: 1,
      fontFamily: 'Inter_400Regular',
      fontSize: 16,
      color: theme.colors.textPrimary,
      marginLeft: spacing.sm,
      paddingVertical: 0,
    },
    listContent: {
      maxWidth: maxContentWidth,
      alignSelf: 'center',
      width: '100%',
      padding: spacing.md,
    },
    // Result Item
    resultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    resultItemPressed: {
      backgroundColor: theme.colors.surfaceRaised,
      borderRadius: 8,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    resultContent: {
      flex: 1,
      justifyContent: 'center',
    },
    resultTitle: {
      fontFamily: 'Inter_500Medium',
      fontSize: 16,
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    resultSubtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    // Empty State
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: spacing['5xl'],
    },
    emptyTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 18,
      color: theme.colors.textPrimary,
      marginTop: spacing.lg,
      marginBottom: spacing.xs,
    },
    emptySubtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      maxWidth: 300,
    },
  });
}
