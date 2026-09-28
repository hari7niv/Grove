/**
 * Routine Builder screen.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing } from '@/src/design/tokens';
import { useRepositories } from '@/src/db/provider';
import { ChevronLeftIcon, CheckIcon, PlusIcon, TargetIcon, ClockIcon } from '@/src/components/ui/Icon';
import type { Exercise } from '@/src/types/models';

export default function NewRoutineScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme);
  const repositories = useRepositories();

  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const data = await repositories.exercises.getAll();
      setExercises(data);
    }
    load();
  }, [repositories]);

  const toggleExercise = (id: string) => {
    if (selectedExerciseIds.includes(id)) {
      setSelectedExerciseIds(selectedExerciseIds.filter(eId => eId !== id));
    } else {
      setSelectedExerciseIds([...selectedExerciseIds, id]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a routine name');
      return;
    }
    if (selectedExerciseIds.length === 0) {
      alert('Please select at least one exercise');
      return;
    }

    try {
      await repositories.routines.create({
        name: name.trim(),
        exerciseIds: selectedExerciseIds,
      });
      router.back();
    } catch (e) {
      console.error(e);
      alert('Failed to save routine');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeftIcon size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>New Routine</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Routine Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Morning Stretch"
          placeholderTextColor={theme.colors.textTertiary}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.sectionTitle}>Select Exercises</Text>
        <View style={styles.list}>
          {exercises.map((ex) => {
            const isSelected = selectedExerciseIds.includes(ex.id);
            return (
              <Pressable
                key={ex.id}
                style={[
                  styles.exerciseCard,
                  isSelected && styles.exerciseCardSelected
                ]}
                onPress={() => toggleExercise(ex.id)}
              >
                <View style={[styles.cardIcon, isSelected && styles.cardIconSelected]}>
                  {ex.mode === 'timer' ? (
                    <ClockIcon size={20} color={isSelected ? '#FFF' : theme.colors.accent} />
                  ) : (
                    <TargetIcon size={20} color={isSelected ? '#FFF' : theme.colors.accent} />
                  )}
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{ex.name}</Text>
                  <Text style={styles.cardSubtitle}>
                    {ex.mode === 'timer' ? 'Timer-based' : 'Count-based'}
                  </Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <CheckIcon size={14} color="#FFF" />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.xl }]}>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Routine</Text>
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
    title: { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: theme.colors.textPrimary },
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
    sectionTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 17,
      color: theme.colors.textPrimary,
      marginBottom: spacing.lg,
    },
    list: { gap: spacing.md },
    exerciseCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: spacing.lg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    exerciseCardSelected: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accentLight,
    },
    cardIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    cardIconSelected: {
      backgroundColor: theme.colors.accent,
    },
    cardContent: { flex: 1 },
    cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: theme.colors.textPrimary, marginBottom: 2 },
    cardSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, color: theme.colors.textSecondary },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxSelected: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
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
