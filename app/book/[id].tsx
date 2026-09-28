/**
 * Book Detail Screen.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing } from '@/src/design/tokens';
import { useRepositories } from '@/src/db/provider';
import { ChevronLeftIcon, CheckIcon, PlusIcon } from '@/src/components/ui/Icon';
import type { Book, BookQuote } from '@/src/types/models';
import { getToday, nowISO } from '@/src/utils/date';

export default function BookScreen() {
  const { id } = useLocalSearchParams();
  const isNew = id === 'new';
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme);
  const repositories = useRepositories();

  const [book, setBook] = useState<Book | null>(null);
  const [quotes, setQuotes] = useState<BookQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [currentPage, setCurrentPage] = useState('');
  
  // New Quote fields
  const [isAddingQuote, setIsAddingQuote] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [quotePage, setQuotePage] = useState('');

  useEffect(() => {
    async function load() {
      if (!isNew && typeof id === 'string') {
        const b = await repositories.books.getById(id);
        if (b) {
          setBook(b);
          setTitle(b.title);
          setAuthor(b.author || '');
          setTotalPages(b.totalPages ? String(b.totalPages) : '');
          setCurrentPage(String(b.currentPage));
          
          const qs = await repositories.books.getQuotes(id);
          setQuotes(qs);
        }
      }
      setIsLoading(false);
    }
    load();
  }, [id, isNew, repositories]);

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    try {
      const parsedTotal = parseInt(totalPages, 10);
      const parsedCurrent = parseInt(currentPage, 10);
      
      const isFinished = parsedTotal > 0 && parsedCurrent >= parsedTotal;
      
      const payload = {
        title: title.trim(),
        author: author.trim() || null,
        totalPages: isNaN(parsedTotal) ? null : parsedTotal,
        currentPage: isNaN(parsedCurrent) ? 0 : parsedCurrent,
        status: isFinished ? 'finished' : (isNaN(parsedCurrent) || parsedCurrent === 0 ? 'want_to_read' : 'reading') as any,
        notes: null,
        rating: null,
        startDate: null,
        finishDate: isFinished ? nowISO() : null,
        coverColor: null,
      };

      if (isNew) {
        await repositories.books.create(payload);
        router.back();
      } else if (book && typeof id === 'string') {
        const oldPage = book.currentPage;
        const newPage = payload.currentPage;
        const pagesRead = newPage - oldPage;
        
        await repositories.books.update(id, payload);
        
        // Water reading plant if pages were read
        if (pagesRead > 0) {
          const mindHabits = await repositories.habits.getActive();
          const readingHabit = mindHabits.find(h => h.name.toLowerCase().includes('read'));
          
          if (readingHabit) {
            await repositories.activityLogs.create({
              categoryId: readingHabit.categoryId,
              habitId: readingHabit.id,
              type: 'reading',
              value: pagesRead,
              unit: 'pages',
              metadata: JSON.stringify({ bookTitle: payload.title }),
              timestamp: nowISO(),
              logicalDate: getToday(4),
            });
          }
        }
        router.back();
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save book');
    }
  };

  const handleAddQuote = async () => {
    if (!quoteText.trim() || !book) return;
    
    try {
      const newQuote = await repositories.books.addQuote({
        bookId: book.id,
        text: quoteText.trim(),
        page: parseInt(quotePage, 10) || null,
      });
      
      setQuotes([...quotes, newQuote]);
      setIsAddingQuote(false);
      setQuoteText('');
      setQuotePage('');
    } catch (e) {
      console.error(e);
      alert('Failed to add quote');
    }
  };

  if (isLoading) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeftIcon size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{isNew ? 'Add Book' : 'Edit Book'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Book Title"
          placeholderTextColor={theme.colors.textTertiary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Author</Text>
        <TextInput
          style={styles.input}
          placeholder="Author Name"
          placeholderTextColor={theme.colors.textTertiary}
          value={author}
          onChangeText={setAuthor}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: spacing.md }}>
            <Text style={styles.label}>Current Page</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={theme.colors.textTertiary}
              value={currentPage}
              onChangeText={setCurrentPage}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Total Pages</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={theme.colors.textTertiary}
              value={totalPages}
              onChangeText={setTotalPages}
              keyboardType="numeric"
            />
          </View>
        </View>

        {!isNew && (
          <View style={styles.quotesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quotes & Notes</Text>
              {!isAddingQuote && (
                <Pressable onPress={() => setIsAddingQuote(true)}>
                  <PlusIcon size={24} color={theme.colors.accent} />
                </Pressable>
              )}
            </View>

            {isAddingQuote && (
              <View style={styles.addQuoteContainer}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Type quote or note here..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={quoteText}
                  onChangeText={setQuoteText}
                  multiline
                />
                <TextInput
                  style={styles.input}
                  placeholder="Page number (optional)"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={quotePage}
                  onChangeText={setQuotePage}
                  keyboardType="numeric"
                />
                <View style={styles.row}>
                  <Pressable style={[styles.btn, styles.btnSecondary, { flex: 1, marginRight: spacing.sm }]} onPress={() => setIsAddingQuote(false)}>
                    <Text style={styles.btnText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={[styles.btn, styles.btnPrimary, { flex: 1 }]} onPress={handleAddQuote}>
                    <Text style={styles.btnTextPrimary}>Save</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {quotes.map(q => (
              <View key={q.id} style={styles.quoteCard}>
                <Text style={styles.quoteText}>"{q.text}"</Text>
                {q.page && <Text style={styles.quotePage}>p. {q.page}</Text>}
              </View>
            ))}
            
            {quotes.length === 0 && !isAddingQuote && (
              <Text style={styles.emptyQuotes}>No quotes saved yet.</Text>
            )}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.xl }]}>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Book</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: { padding: spacing.sm, marginLeft: -spacing.sm },
    headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: theme.colors.textPrimary },
    content: { padding: spacing.xl },
    label: { fontFamily: 'Inter_500Medium', fontSize: 14, color: theme.colors.textSecondary, marginBottom: spacing.sm },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: spacing.lg,
      fontFamily: 'Inter_500Medium',
      fontSize: 17,
      color: theme.colors.textPrimary,
      marginBottom: spacing['2xl'],
    },
    row: { flexDirection: 'row' },
    
    quotesSection: {
      marginTop: spacing['2xl'],
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: spacing['2xl'],
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontFamily: 'Inter_700Bold',
      fontSize: 20,
      color: theme.colors.textPrimary,
    },
    addQuoteContainer: {
      backgroundColor: theme.colors.surfaceRaised,
      padding: spacing.xl,
      borderRadius: 16,
      marginBottom: spacing.xl,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    btn: {
      paddingVertical: spacing.md,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnSecondary: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    btnPrimary: {
      backgroundColor: theme.colors.accent,
    },
    btnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: theme.colors.textPrimary },
    btnTextPrimary: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#FFF' },
    
    quoteCard: {
      backgroundColor: theme.colors.surface,
      padding: spacing.lg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: spacing.md,
    },
    quoteText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: theme.colors.textPrimary,
      lineHeight: 22,
      fontStyle: 'italic',
    },
    quotePage: {
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: spacing.sm,
      textAlign: 'right',
    },
    emptyQuotes: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: spacing.xl,
    },
    
    footer: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    saveButton: {
      backgroundColor: theme.colors.accent,
      paddingVertical: spacing.lg,
      borderRadius: 16,
      alignItems: 'center',
    },
    saveButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: '#FFF' },
  });
}
