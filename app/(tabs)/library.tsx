/**
 * Library screen — Reading tracker + Learning roadmaps.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, TextInput, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing, maxContentWidth } from '@/src/design/tokens';
import { BookIcon, PlusIcon, MapPinIcon } from '@/src/components/ui/Icon';
import { useRepositories } from '@/src/db/provider';
import type { Book, Roadmap } from '@/src/types/models';

type Tab = 'books' | 'roadmaps';
type BookStatusFilter = 'all' | 'want_to_read' | 'reading' | 'finished';

const { width } = Dimensions.get('window');

export default function LibraryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = makeStyles(theme);
  const repositories = useRepositories();

  const [activeTab, setActiveTab] = useState<Tab>('books');
  const [books, setBooks] = useState<Book[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookStatusFilter>('all');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedBooks, fetchedRoadmaps] = await Promise.all([
        repositories.books.getAll(),
        repositories.roadmaps.getAll(),
      ]);
      setBooks(fetchedBooks);
      setRoadmaps(fetchedRoadmaps);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [repositories, activeTab])
  );

  const renderTab = (tab: Tab, label: string) => {
    const isActive = activeTab === tab;
    return (
      <Pressable 
        style={[styles.tab, isActive && styles.tabActive]} 
        onPress={() => setActiveTab(tab)}
      >
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
      </Pressable>
    );
  };

  const renderBook = (book: Book) => (
    <Pressable 
      style={styles.bookCard}
      onPress={() => router.push(`/book/${book.id}` as any)}
    >
      <View style={[styles.bookCoverGrid, { backgroundColor: book.coverColor || theme.colors.surfaceRaised }]} />
      <View style={styles.bookCardContent}>
        <Text style={styles.bookCardTitle} numberOfLines={2}>{book.title}</Text>
        {book.author && <Text style={styles.bookCardSubtitle} numberOfLines={1}>{book.author}</Text>}
        <Text style={styles.statusText}>
          {book.status === 'reading' ? `Page ${book.currentPage}` : 
           book.status === 'finished' ? 'Finished' : 'Want to read'}
        </Text>
      </View>
    </Pressable>
  );

  const renderRoadmap = (rm: Roadmap) => (
    <Pressable 
      style={styles.roadmapCard}
      onPress={() => router.push(`/roadmap/${rm.id}` as any)}
    >
      <View style={styles.roadmapCardContent}>
        <Text style={styles.roadmapCardTitle}>{rm.name}</Text>
        {rm.description && <Text style={styles.roadmapCardSubtitle}>{rm.description}</Text>}
      </View>
    </Pressable>
  );

  const renderBooksEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <View style={styles.iconWrap}>
          <BookIcon size={48} color={theme.colors.textTertiary} />
        </View>
        <Text style={styles.emptyTitle}>Empty Shelf</Text>
        <Text style={styles.emptyBody}>
          No books found. Try adjusting your search or add a new book.
        </Text>
      </View>
    );
  };

  const renderRoadmapsEmpty = () => {
    if (roadmaps.length > 0 || isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <View style={styles.iconWrap}>
          <MapPinIcon size={48} color={theme.colors.textTertiary} />
        </View>
        <Text style={styles.emptyTitle}>No Roadmaps</Text>
        <Text style={styles.emptyBody}>
          You haven't set up any learning roadmaps yet.
        </Text>
      </View>
    );
  };

  const renderFilterChip = (label: string, value: BookStatusFilter) => {
    const isActive = statusFilter === value;
    return (
      <Pressable
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => setStatusFilter(value)}
      >
        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{label}</Text>
      </Pressable>
    );
  };

  const renderHeader = () => (
    <View style={{ marginBottom: spacing.lg }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Library</Text>
          <Text style={styles.subtitle}>Books & learning roadmaps.</Text>
        </View>
        <Pressable 
          style={styles.addButton}
          onPress={() => activeTab === 'books' ? router.push('/book/new' as any) : router.push('/roadmap/new' as any)}
        >
          <PlusIcon size={20} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.tabsContainer}>
        {renderTab('books', 'Books')}
        {renderTab('roadmaps', 'Roadmaps')}
      </View>

      {activeTab === 'books' && (
        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title or author..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {renderFilterChip('All', 'all')}
            {renderFilterChip('Reading', 'reading')}
            {renderFilterChip('Want to Read', 'want_to_read')}
            {renderFilterChip('Finished', 'finished')}
          </ScrollView>
        </View>
      )}
    </View>
  );

  // Filter Data
  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (b.author || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const data = activeTab === 'books' ? filteredBooks : roadmaps;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        key={activeTab} // Force re-render when switching tabs to allow changing numColumns
        data={data as any[]}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => activeTab === 'books' ? renderBook(item as Book) : renderRoadmap(item as Roadmap)}
        contentContainerStyle={styles.content}
        numColumns={activeTab === 'books' ? 2 : 1}
        columnWrapperStyle={activeTab === 'books' ? styles.columnWrapper : undefined}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={activeTab === 'books' ? renderBooksEmpty() : renderRoadmapsEmpty()}
        refreshControl={
          <RefreshControl refreshing={isLoading && data.length > 0} onRefresh={loadData} tintColor={theme.colors.accent} />
        }
      />
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: {
      maxWidth: maxContentWidth, alignSelf: 'center', width: '100%', padding: spacing.xl,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing['2xl'],
    },
    title: {
      fontFamily: 'Inter_700Bold', fontSize: 32, lineHeight: 40, color: theme.colors.textPrimary,
    },
    subtitle: {
      fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22,
      color: theme.colors.textSecondary, marginTop: spacing.xs,
    },
    addButton: {
      backgroundColor: theme.colors.accent,
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceRaised,
      padding: 4,
      borderRadius: 12,
      marginBottom: spacing['xl'],
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderRadius: 8,
    },
    tabActive: {
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    tabText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
    tabTextActive: {
      color: theme.colors.textPrimary,
      fontFamily: 'Inter_600SemiBold',
    },
    searchSection: {
      marginBottom: spacing.lg,
    },
    searchInput: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: spacing.md,
      fontFamily: 'Inter_400Regular',
      fontSize: 16,
      color: theme.colors.textPrimary,
      marginBottom: spacing.md,
    },
    filterScroll: {
      flexDirection: 'row',
    },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginRight: spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    filterChipActive: {
      backgroundColor: theme.colors.accentLight,
      borderColor: theme.colors.accent,
    },
    filterChipText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    filterChipTextActive: {
      color: theme.colors.accent,
      fontFamily: 'Inter_600SemiBold',
    },
    emptyState: { alignItems: 'center', paddingVertical: spacing['5xl'] },
    iconWrap: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: theme.colors.surfaceRaised,
      alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
    },
    emptyTitle: {
      fontFamily: 'Inter_600SemiBold', fontSize: 20,
      color: theme.colors.textPrimary, marginBottom: spacing.xs,
    },
    emptyBody: {
      fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22,
      color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 300,
    },
    columnWrapper: {
      justifyContent: 'space-between',
    },
    bookCard: {
      width: '48%',
      marginBottom: spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    bookCoverGrid: {
      width: '100%',
      aspectRatio: 2/3,
    },
    bookCardContent: {
      padding: spacing.md,
    },
    bookCardTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    bookCardSubtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    statusText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
      color: theme.colors.accent,
    },
    roadmapCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: spacing.lg,
    },
    roadmapCardContent: {
      flex: 1,
    },
    roadmapCardTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 17,
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    roadmapCardSubtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
  });
}
