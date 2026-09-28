import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { useTheme, type Theme } from '@/src/design/theme';
import { spacing } from '@/src/design/tokens';
import type { Habit, Category, HabitRequirementType } from '@/src/types/models';

interface PlantFormProps {
  initialHabit?: Partial<Habit>;
  initialCategoryId?: string;
  categories: Category[];
  onSubmit: (data: {
    name: string;
    categoryId: string;
    requirementType: HabitRequirementType;
    requirementValue: number;
    active: boolean;
  }) => void;
  onDelete?: () => void;
  submitLabel: string;
}

export function PlantForm({
  initialHabit,
  initialCategoryId,
  categories,
  onSubmit,
  onDelete,
  submitLabel,
}: PlantFormProps) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const [name, setName] = useState(initialHabit?.name || '');
  const [categoryId, setCategoryId] = useState(initialCategoryId || (categories[0]?.id ?? ''));
  const [reqType, setReqType] = useState<HabitRequirementType>(initialHabit?.requirementType || 'any');
  const [reqValue, setReqValue] = useState(initialHabit?.requirementValue?.toString() || '1');
  const [active, setActive] = useState(initialHabit?.active ?? true);

  const handleSave = () => {
    if (!name.trim() || !categoryId) return;
    const val = parseInt(reqValue, 10);
    if (isNaN(val) || val < 1) return;

    onSubmit({
      name: name.trim(),
      categoryId,
      requirementType: reqType,
      requirementValue: val,
      active,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Plant (Habit) Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Daily Workout"
          placeholderTextColor={theme.colors.textTertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryList}>
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
        <Text style={styles.hint}>Go to Categories to create or edit colors.</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Requirement Type</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.toggleBtn, reqType === 'any' && styles.toggleBtnActive]}
            onPress={() => setReqType('any')}
          >
            <Text style={[styles.toggleText, reqType === 'any' && styles.toggleTextActive]}>Any activity</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, reqType === 'count' && styles.toggleBtnActive]}
            onPress={() => setReqType('count')}
          >
            <Text style={[styles.toggleText, reqType === 'count' && styles.toggleTextActive]}>Specific count</Text>
          </Pressable>
        </View>
      </View>

      {reqType === 'count' && (
        <View style={styles.field}>
          <Text style={styles.label}>Target Count (per day)</Text>
          <TextInput
            style={styles.input}
            value={reqValue}
            onChangeText={setReqValue}
            keyboardType="number-pad"
          />
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Status</Text>
        <Pressable
          style={[styles.toggleBtn, active && styles.toggleBtnActive, { alignSelf: 'flex-start' }]}
          onPress={() => setActive(!active)}
        >
          <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
            {active ? 'Active (Growing)' : 'Paused (Archived)'}
          </Text>
        </Pressable>
      </View>

      <Pressable style={styles.submitBtn} onPress={handleSave}>
        <Text style={styles.submitText}>{submitLabel}</Text>
      </Pressable>

      {onDelete && (
        <Pressable style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteText}>Delete Plant</Text>
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
    hint: { fontFamily: 'Inter_400Regular', fontSize: 12, color: theme.colors.textTertiary, marginTop: spacing.xs },
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
