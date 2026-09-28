import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { useTheme, type Theme } from '@/src/design/theme';
import { spacing } from '@/src/design/tokens';
import type { Exercise } from '@/src/types/models';
import { ChevronLeftIcon, TargetIcon, ClockIcon, TrashIcon } from '@/src/components/ui/Icon';

interface RoutineBuilderProps {
  availableExercises: Exercise[];
  initialName?: string;
  initialExerciseIds?: string[];
  onSave: (name: string, exerciseIds: string[]) => void;
  onCancel: () => void;
}

export function RoutineBuilder({
  availableExercises,
  initialName = '',
  initialExerciseIds = [],
  onSave,
  onCancel,
}: RoutineBuilderProps) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const [name, setName] = useState(initialName);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialExerciseIds);

  const toggleExercise = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(e => e !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newIds = [...selectedIds];
    [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
    setSelectedIds(newIds);
  };

  const moveDown = (index: number) => {
    if (index === selectedIds.length - 1) return;
    const newIds = [...selectedIds];
    [newIds[index + 1], newIds[index]] = [newIds[index], newIds[index + 1]];
    setSelectedIds(newIds);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onCancel} style={styles.iconBtn}>
          <ChevronLeftIcon size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Build Routine</Text>
        <Pressable onPress={() => onSave(name, selectedIds)} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Routine Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Leg Day"
          placeholderTextColor={theme.colors.textTertiary}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.sectionTitle}>Selected Exercises ({selectedIds.length})</Text>
        {selectedIds.length === 0 ? (
          <Text style={styles.emptyText}>Tap exercises below to add them to your routine.</Text>
        ) : (
          <View style={styles.selectedList}>
            {selectedIds.map((id, index) => {
              const ex = availableExercises.find(e => e.id === id);
              if (!ex) return null;
              return (
                <View key={`${id}-${index}`} style={styles.selectedItem}>
                  <View style={styles.selectedInfo}>
                    <Text style={styles.selectedName}>{index + 1}. {ex.name}</Text>
                    <Text style={styles.selectedDetails}>
                      {ex.targetSets} sets • {ex.mode === 'timer' ? `${ex.targetDuration}s` : `${ex.targetReps} reps`}
                    </Text>
                  </View>
                  <View style={styles.controls}>
                    <Pressable onPress={() => moveUp(index)} style={styles.controlBtn} disabled={index === 0}>
                      <Text style={[styles.controlText, index === 0 && { color: theme.colors.textTertiary }]}>↑</Text>
                    </Pressable>
                    <Pressable onPress={() => moveDown(index)} style={styles.controlBtn} disabled={index === selectedIds.length - 1}>
                      <Text style={[styles.controlText, index === selectedIds.length - 1 && { color: theme.colors.textTertiary }]}>↓</Text>
                    </Pressable>
                    <Pressable onPress={() => toggleExercise(id)} style={styles.controlBtn}>
                      <TrashIcon size={18} color={theme.colors.error} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.sectionTitle}>Available Exercises</Text>
        <View style={styles.list}>
          {availableExercises.filter(ex => !selectedIds.includes(ex.id)).map((ex) => (
            <Pressable
              key={ex.id}
              style={styles.exerciseCard}
              onPress={() => toggleExercise(ex.id)}
            >
              <View style={styles.cardIcon}>
                {ex.mode === 'timer' ? (
                  <ClockIcon size={20} color={theme.colors.accent} />
                ) : (
                  <TargetIcon size={20} color={theme.colors.accent} />
                )}
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{ex.name}</Text>
                <Text style={styles.cardSubtitle}>
                  {ex.mode === 'timer' ? 'Timer-based' : 'Count-based'}
                </Text>
              </View>
              <View style={styles.addButton}>
                <Text style={styles.addButtonText}>+</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
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
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    iconBtn: { padding: spacing.sm },
    saveBtn: { padding: spacing.sm },
    saveBtnText: { color: theme.colors.accent, fontFamily: 'Inter_600SemiBold', fontSize: 16 },
    title: { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: theme.colors.textPrimary },
    content: { padding: spacing.xl, paddingBottom: spacing['4xl'] },
    label: { fontFamily: 'Inter_500Medium', fontSize: 14, color: theme.colors.textSecondary, marginBottom: spacing.sm },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: spacing.md,
      fontSize: 16,
      color: theme.colors.textPrimary,
      fontFamily: 'Inter_400Regular',
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      color: theme.colors.textPrimary,
      marginBottom: spacing.md,
      marginTop: spacing.sm,
    },
    emptyText: {
      fontFamily: 'Inter_400Regular',
      color: theme.colors.textTertiary,
      marginBottom: spacing.xl,
    },
    selectedList: {
      marginBottom: spacing.xl,
      gap: spacing.sm,
    },
    selectedItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    selectedInfo: { flex: 1 },
    selectedName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: theme.colors.textPrimary },
    selectedDetails: { fontFamily: 'Inter_400Regular', fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
    controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    controlBtn: { padding: spacing.sm },
    controlText: { fontFamily: 'Inter_700Bold', fontSize: 18, color: theme.colors.textPrimary },
    list: { gap: spacing.sm },
    exerciseCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: spacing.md,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    cardContent: { flex: 1 },
    cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: theme.colors.textPrimary },
    cardSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
    addButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: theme.colors.accent },
  });
}
