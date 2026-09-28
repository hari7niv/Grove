/**
 * Library screen — Reading tracker + Learning roadmaps.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing, maxContentWidth } from '@/src/design/tokens';
import { BookIcon, PlusIcon, MapPinIcon } from '@/src/components/ui/Icon';
import { useRepositories } from '@/src/db/provider';
import type { Book, Roadmap } from '@/src/types/models';

type Tab = 'books' | 'roadmaps';

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
      key={book.id} 
      style={[styles.card, { marginBottom: spacing.lg }]}
      onPress={() => router.push(`/book/${book.id}` as any)}
    >
      <View style={[styles.bookCover, { backgroundColor: book.coverColor || theme.colors.surfaceRaised }]} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{book.title}</Text>
        {book.author && <Text style={styles.cardSubtitle}>{book.author}</Text>}
        <Text style={styles.statusText}>
          {book.status === 'reading' ? `Page ${book.currentPage}` : 
           book.status === 'finished' ? 'Finished' : 'Want to read'}
        </Text>
      </View>
    </Pressable>
  );

  const renderRoadmap = (rm: Roadmap) => (
    <Pressable 
      key={rm.id} 
      style={[styles.card, { marginBottom: spacing.lg }]}
      onPress={() => router.push(`/roadmap/${rm.id}` as any)}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{rm.name}</Text>
        {rm.description && <Text style={styles.cardSubtitle}>{rm.description}</Text>}
      </View>
    </Pressable>
  );

  const renderBooksEmpty = () => {
    if (books.length > 0 || isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <View style={styles.iconWrap}>
          <BookIcon size={48} color={theme.colors.textTertiary} />
        </View>
        <Text style={styles.emptyTitle}>Empty Shelf</Text>
        <Text style={styles.emptyBody}>
          Add books you're reading or want to read.
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

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Library</Text>
          <Text style={styles.subtitle}>Books & learning roadmaps.</Text>
        </View>
        {activeTab === 'books' && (
          <Pressable 
            style={styles.addButton}
            onPress={() => router.push('/book/new' as any)}
          >
            <PlusIcon size={20} color="#FFF" />
          </Pressable>
        )}
      </View>

      <View style={styles.tabsContainer}>
        {renderTab('books', 'Books')}
        {renderTab('roadmaps', 'Roadmaps')}
      </View>
      {activeTab === 'books' ? renderBooksEmpty() : renderRoadmapsEmpty()}
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={(activeTab === 'books' ? books : roadmaps) as any[]}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => activeTab === 'books' ? renderBook(item as Book) : renderRoadmap(item as Roadmap)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={isLoading && (books.length > 0 || roadmaps.length > 0)} onRefresh={loadData} tintColor={theme.colors.accent} />
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
      marginBottom: spacing['2xl'],
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
    list: {
      gap: spacing.lg,
    },
    card: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    bookCover: {
      width: 48,
      height: 64,
      borderRadius: 4,
      marginRight: spacing.md,
    },
    cardContent: {
      flex: 1,
      justifyContent: 'center',
    },
    cardTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 17,
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    cardSubtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    statusText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
      color: theme.colors.accent,
    }
  });
}
