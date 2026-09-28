import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, type Theme } from '@/src/design/theme';
import { spacing, maxContentWidth } from '@/src/design/tokens';
import { useRepositories } from '@/src/db/provider';
import { ExerciseForm } from '@/src/components/exercise/ExerciseForm';
import type { Category, Exercise } from '@/src/types/models';

export default function EditExerciseScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const repositories = useRepositories();
  const styles = makeStyles(theme);

  const [categories, setCategories] = useState<Category[]>([]);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id || typeof id !== 'string') return;
      const [cats, ex] = await Promise.all([
        repositories.categories.getAll(),
        repositories.exercises.getById(id),
      ]);
      setCategories(cats);
      setExercise(ex);
      setIsLoading(false);
    }
    load();
  }, [id, repositories]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Exercise",
      "Are you sure? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            if (typeof id === 'string') {
              await repositories.exercises.delete(id);
              // Go back to the exercises list, we might need to pop twice if we came from tracker
              router.navigate('/exercises' as any);
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>Exercise not found.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: theme.colors.accent }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Edit Exercise</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.content}>
        <ExerciseForm
          initialExercise={exercise}
          categories={categories}
          submitLabel="Save Changes"
          onSubmit={async (data) => {
            if (typeof id === 'string') {
              await repositories.exercises.update(id, data);
              router.back();
            }
          }}
          onDelete={handleDelete}
        />
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
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    backButton: { padding: spacing.xs, minWidth: 60 },
    backButtonText: { color: theme.colors.accent, fontFamily: 'Inter_500Medium', fontSize: 16 },
    headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: theme.colors.textPrimary },
    content: { flex: 1, maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' },
    errorText: { color: theme.colors.textSecondary, fontSize: 16, fontFamily: 'Inter_400Regular' }
  });
}
