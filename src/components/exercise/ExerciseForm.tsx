import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { useTheme, type Theme } from '@/src/design/theme';
import { spacing } from '@/src/design/tokens';
import type { Exercise, ExerciseMode, Category } from '@/src/types/models';

interface ExerciseFormProps {
  initialExercise?: Partial<Exercise>;
  categories: Category[];
  onSubmit: (data: {
    name: string;
    mode: ExerciseMode;
    categoryId: string | null;
    targetDuration: number | null;
    targetReps: number | null;
    targetSets: number | null;
    restDuration: number | null;
    notes: string | null;
  }) => void;
  onDelete?: () => void;
  submitLabel: string;
}

export function ExerciseForm({
  initialExercise,
  categories,
  onSubmit,
  onDelete,
  submitLabel,
}: ExerciseFormProps) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const [name, setName] = useState(initialExercise?.name || '');
  const [mode, setMode] = useState<ExerciseMode>(initialExercise?.mode || 'count');
  const [categoryId, setCategoryId] = useState<string | null>(initialExercise?.categoryId || null);
  
  const [targetDuration, setTargetDuration] = useState(initialExercise?.targetDuration?.toString() || '');
  const [targetReps, setTargetReps] = useState(initialExercise?.targetReps?.toString() || '');
  const [targetSets, setTargetSets] = useState(initialExercise?.targetSets?.toString() || '');
  const [restDuration, setRestDuration] = useState(initialExercise?.restDuration?.toString() || '');
  const [notes, setNotes] = useState(initialExercise?.notes || '');

  const handleSave = () => {
    if (!name.trim()) return;

    const parseNum = (val: string) => {
      const num = parseInt(val, 10);
      return isNaN(num) ? null : num;
    };

    onSubmit({
      name: name.trim(),
      mode,
      categoryId,
      targetDuration: mode === 'timer' ? parseNum(targetDuration) : null,
      targetReps: mode === 'count' ? parseNum(targetReps) : null,
      targetSets: parseNum(targetSets),
      restDuration: parseNum(restDuration),
      notes: notes.trim() || null,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Exercise Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Push-ups"
          placeholderTextColor={theme.colors.textTertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Category (Optional)</Text>
        <View style={styles.categoryList}>
          <Pressable
            style={[
              styles.categoryChip,
              categoryId === null && { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentLight },
            ]}
            onPress={() => setCategoryId(null)}
          >
            <Text style={styles.categoryChipText}>None</Text>
          </Pressable>
          {categories.map((c) => (
            <Pressable
              key={c.id}
              style={[
                styles.categoryChip,
                categoryId === c.id && { borderColor: c.color, backgroundColor: c.color + '20' },
              ]}
              onPress={() => setCategoryId(c.id)}
            >
              <View style={[styles.colorDot, { backgroundColor: c.color }]} />
              <Text style={styles.categoryChipText}>{c.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Tracking Mode</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.toggleBtn, mode === 'count' && styles.toggleBtnActive]}
            onPress={() => setMode('count')}
          >
            <Text style={[styles.toggleText, mode === 'count' && styles.toggleTextActive]}>Reps & Sets</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, mode === 'timer' && styles.toggleBtnActive]}
            onPress={() => setMode('timer')}
          >
            <Text style={[styles.toggleText, mode === 'timer' && styles.toggleTextActive]}>Timer</Text>
          </Pressable>
        </View>
      </View>

      {mode === 'count' ? (
        <View style={styles.field}>
          <Text style={styles.label}>Target Reps (per set)</Text>
          <TextInput
            style={styles.input}
            value={targetReps}
            onChangeText={setTargetReps}
            keyboardType="number-pad"
            placeholder="e.g., 10"
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>
      ) : (
        <View style={styles.field}>
          <Text style={styles.label}>Target Duration (seconds per set)</Text>
          <TextInput
            style={styles.input}
            value={targetDuration}
            onChangeText={setTargetDuration}
            keyboardType="number-pad"
            placeholder="e.g., 60"
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>
      )}

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Target Sets</Text>
          <TextInput
            style={styles.input}
            value={targetSets}
            onChangeText={setTargetSets}
            keyboardType="number-pad"
            placeholder="e.g., 3"
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Rest (seconds)</Text>
          <TextInput
            style={styles.input}
            value={restDuration}
            onChangeText={setRestDuration}
            keyboardType="number-pad"
            placeholder="e.g., 90"
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Form tips, machine settings, etc."
          placeholderTextColor={theme.colors.textTertiary}
          multiline
        />
      </View>

      <Pressable style={styles.submitBtn} onPress={handleSave}>
        <Text style={styles.submitText}>{submitLabel}</Text>
      </Pressable>

      {onDelete && (
        <Pressable style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteText}>Delete Exercise</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { padding: spacing.lg },
    field: { marginBottom: spacing.xl },
    label: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: theme.colors.textPrimary, marginBottom: spacing.sm },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: spacing.md,
      fontFamily: 'Inter_400Regular',
      fontSize: 16,
      color: theme.colors.textPrimary,
    },
    categoryList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    colorDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.xs },
    categoryChipText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: theme.colors.textPrimary },
    row: { flexDirection: 'row', gap: spacing.md },
    toggleBtn: {
      flex: 1,
      padding: spacing.md,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    toggleBtnActive: {
      backgroundColor: theme.colors.accentLight,
      borderColor: theme.colors.accent,
    },
    toggleText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: theme.colors.textSecondary },
    toggleTextActive: { color: theme.colors.accent },
    submitBtn: {
      backgroundColor: theme.colors.accent,
      padding: spacing.md,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    submitText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' },
    deleteBtn: {
      marginTop: spacing.xl,
      padding: spacing.md,
      alignItems: 'center',
    },
    deleteText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: theme.colors.error },
  });
}
