/**
 * Task creation and editing screen.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing } from '@/src/design/tokens';
import { useRepositories } from '@/src/db/provider';
import { ChevronLeftIcon, CheckIcon } from '@/src/components/ui/Icon';
import type { Task, Category, TaskPriority } from '@/src/types/models';
import { getToday } from '@/src/utils/date';
import { scheduleTaskReminder, cancelReminder } from '@/src/engine/notifications';

export default function TaskScreen() {
  const { id } = useLocalSearchParams();
  const isNew = id === 'new';
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme);
  const repositories = useRepositories();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(getToday(4));
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function load() {
      const cats = await repositories.categories.getAll();
      setCategories(cats);

      if (!isNew && typeof id === 'string') {
        const task = await repositories.tasks.getById(id);
        if (task) {
          setTitle(task.title);
          setDescription(task.description || '');
          setDueDate(task.dueDate || '');
          setDueTime(task.dueTime || '');
          setPriority(task.priority);
          setCategoryId(task.categoryId);
        }
      }
    }
    load();
  }, [id, isNew, repositories]);

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }

    try {
      if (isNew) {
        const payload = {
          title: title.trim(),
          description: description.trim() || null,
          dueDate: dueDate.trim() || null,
          dueTime: dueTime.trim() || null,
          priority,
          status: 'pending' as const,
          categoryId,
          parentId: null,
          tags: [],
          recurrenceRule: null,
          completedAt: null,
        };
        const newTask = await repositories.tasks.create(payload);
        if (dueDate.trim() && dueTime.trim()) {
          const notificationId = await scheduleTaskReminder(
            newTask.id,
            `Task Reminder: ${newTask.title}`,
            newTask.description || 'Tap to view task',
            dueDate.trim(),
            dueTime.trim()
          );
          if (notificationId) {
            await repositories.reminders.create({
              targetType: 'task',
              targetId: newTask.id,
              title: `Task Reminder: ${newTask.title}`,
              time: `${dueDate.trim()}T${dueTime.trim()}:00`,
              recurrenceRule: null,
              notificationId,
              active: true,
            });
          }
        }
      } else if (typeof id === 'string') {
        const payload = {
          title: title.trim(),
          description: description.trim() || null,
          dueDate: dueDate.trim() || null,
          dueTime: dueTime.trim() || null,
          priority,
          categoryId,
        };
        const updatedTask = await repositories.tasks.update(id, payload);
        if (updatedTask) {
          const existingReminders = await repositories.reminders.getByTargetId(id);
          for (const rem of existingReminders) {
            if (rem.notificationId) {
              await cancelReminder(rem.notificationId);
            }
            await repositories.reminders.delete(rem.id);
          }

          if (dueDate.trim() && dueTime.trim()) {
            const notificationId = await scheduleTaskReminder(
              updatedTask.id,
              `Task Reminder: ${updatedTask.title}`,
              updatedTask.description || 'Tap to view task',
              dueDate.trim(),
              dueTime.trim()
            );
            if (notificationId) {
              await repositories.reminders.create({
                targetType: 'task',
                targetId: updatedTask.id,
                title: `Task Reminder: ${updatedTask.title}`,
                time: `${dueDate.trim()}T${dueTime.trim()}:00`,
                recurrenceRule: null,
                notificationId,
                active: true,
              });
            }
          }
        }
      }
      
      router.back();
    } catch (e) {
      console.error(e);
      alert('Failed to save task');
    }
  };

  const handleDelete = () => {
    if (typeof id !== 'string') return;
    repositories.tasks.delete(id).then(() => {
      router.back();
    }).catch(console.error);
  };

  const renderPriority = (p: TaskPriority, label: string) => (
    <Pressable
      style={[
        styles.chip,
        priority === p && styles.chipActive,
        priority === p && p === 'urgent' && { borderColor: theme.colors.dying, backgroundColor: theme.colors.dying + '20' },
        priority === p && p === 'high' && { borderColor: theme.colors.wilting, backgroundColor: theme.colors.wilting + '20' },
      ]}
      onPress={() => setPriority(p)}
    >
      <Text style={[
        styles.chipText,
        priority === p && styles.chipTextActive,
        priority === p && p === 'urgent' && { color: theme.colors.dying },
        priority === p && p === 'high' && { color: theme.colors.wilting },
      ]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeftIcon size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{isNew ? 'New Task' : 'Edit Task'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="What needs to be done?"
          placeholderTextColor={theme.colors.textTertiary}
          value={title}
          onChangeText={setTitle}
          autoFocus={isNew}
        />

        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Add details..."
          placeholderTextColor={theme.colors.textTertiary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: spacing.md }}>
            <Text style={styles.label}>Due Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textTertiary}
              value={dueDate}
              onChangeText={setDueDate}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Time</Text>
            <TextInput
              style={styles.input}
              placeholder="HH:MM"
              placeholderTextColor={theme.colors.textTertiary}
              value={dueTime}
              onChangeText={setDueTime}
            />
          </View>
        </View>

        <Text style={styles.label}>Priority</Text>
        <View style={styles.chipRow}>
          {renderPriority('low', 'Low')}
          {renderPriority('medium', 'Medium')}
          {renderPriority('high', 'High')}
          {renderPriority('urgent', 'Urgent')}
        </View>

        <Text style={styles.label}>Category (Optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <Pressable
            style={[styles.chip, !categoryId && styles.chipActive]}
            onPress={() => setCategoryId(null)}
          >
            <Text style={[styles.chipText, !categoryId && styles.chipTextActive]}>None</Text>
          </Pressable>
          {categories.map(cat => (
            <Pressable
              key={cat.id}
              style={[
                styles.chip,
                categoryId === cat.id && styles.chipActive,
                categoryId === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '20' }
              ]}
              onPress={() => setCategoryId(cat.id)}
            >
              <Text style={[
                styles.chipText,
                categoryId === cat.id && styles.chipTextActive,
                categoryId === cat.id && { color: cat.color }
              ]}>{cat.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.xl }]}>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{isNew ? 'Create Task' : 'Save Changes'}</Text>
        </Pressable>
        {!isNew && (
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Task</Text>
          </Pressable>
        )}
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
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    row: { flexDirection: 'row' },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginBottom: spacing['2xl'],
    },
    chipScroll: {
      flexDirection: 'row',
      marginBottom: spacing['2xl'],
      overflow: 'visible',
    },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginRight: spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    chipActive: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accentLight,
    },
    chipText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
    chipTextActive: {
      color: theme.colors.accent,
      fontFamily: 'Inter_600SemiBold',
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
    deleteButton: {
      marginTop: spacing.md,
      paddingVertical: spacing.lg,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.error,
    },
    deleteButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: theme.colors.error },
  });
}
