/**
 * Roadmap Detail Screen.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing } from '@/src/design/tokens';
import { useRepositories } from '@/src/db/provider';
import { ChevronLeftIcon, CheckIcon } from '@/src/components/ui/Icon';
import type { Roadmap, RoadmapItem } from '@/src/types/models';
import { getToday, nowISO } from '@/src/utils/date';

export default function RoadmapScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme);
  const repositories = useRepositories();

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id || typeof id !== 'string') return;
      const r = await repositories.roadmaps.getById(id);
      if (r) {
        setRoadmap(r);
        const rmItems = await repositories.roadmaps.getItems(id);
        setItems(rmItems);
      }
      setIsLoading(false);
    }
    load();
  }, [id, repositories]);

  const toggleTopic = async (topic: RoadmapItem) => {
    if (!roadmap) return;
    
    const newStatus = !topic.completed;
    
    try {
      // Optimistic update
      setItems(prev => prev.map(i => i.id === topic.id ? { ...i, completed: newStatus } : i));
      
      await repositories.roadmaps.updateItem(topic.id, { completed: newStatus });
      
      // If marking as done, log activity
      if (newStatus && roadmap.categoryId) {
        const habits = await repositories.habits.getByCategoryId(roadmap.categoryId);
        const learningHabit = habits.find(h => h.active);
        
        await repositories.activityLogs.create({
          categoryId: roadmap.categoryId,
          habitId: learningHabit?.id || null,
          type: 'roadmap',
          value: 1, // 1 topic completed
          unit: 'topic',
          metadata: JSON.stringify({ topic: topic.title, roadmapName: roadmap.name }),
          timestamp: nowISO(),
          logicalDate: getToday(4),
        });
      }
    } catch (e) {
      console.error(e);
      // Revert optimistic update
      setItems(prev => prev.map(i => i.id === topic.id ? { ...i, completed: topic.completed } : i));
    }
  };

  if (!roadmap && !isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.title}>Roadmap not found</Text>
        <Pressable style={{ marginTop: 20 }} onPress={() => router.back()}>
          <Text style={{ color: theme.colors.accent }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // Organize items by parent
  const sections = items.filter(i => !i.parentId);
  
  // Calculate progress
  const allTopics = items.filter(i => i.parentId);
  const completedTopics = allTopics.filter(i => i.completed).length;
  const progressPercent = allTopics.length > 0 ? (completedTopics / allTopics.length) * 100 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeftIcon size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{roadmap?.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {completedTopics} of {allTopics.length} topics completed
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {sections.map(section => {
          const sectionTopics = items.filter(i => i.parentId === section.id);
          const sectionCompleted = sectionTopics.filter(t => t.completed).length;
          
          return (
            <View key={section.id} style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionStats}>
                  {sectionCompleted} / {sectionTopics.length}
                </Text>
              </View>
              
              {sectionTopics.map(topic => (
                <Pressable 
                  key={topic.id} 
                  style={styles.topicRow}
                  onPress={() => toggleTopic(topic)}
                >
                  <View style={[styles.checkbox, topic.completed && styles.checkboxActive]}>
                    {topic.completed && <CheckIcon size={14} color="#FFF" />}
                  </View>
                  <View style={styles.topicContent}>
                    <Text style={[styles.topicTitle, topic.completed && styles.topicTitleCompleted]}>
                      {topic.title}
                    </Text>
                    {topic.notes && (
                      <Text style={styles.topicNotes} numberOfLines={1}>{topic.notes}</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          );
        })}
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
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: { padding: spacing.sm, marginLeft: -spacing.sm },
    title: { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: theme.colors.textPrimary },
    content: { padding: spacing.xl },
    
    progressContainer: {
      marginBottom: spacing['3xl'],
    },
    progressText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 15,
      color: theme.colors.textSecondary,
      marginBottom: spacing.sm,
    },
    progressTrack: {
      height: 8,
      backgroundColor: theme.colors.surfaceRaised,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.accent,
      borderRadius: 4,
    },
    
    sectionContainer: {
      marginBottom: spacing['3xl'],
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: spacing.lg,
      paddingBottom: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
      fontFamily: 'Inter_700Bold',
      fontSize: 20,
      color: theme.colors.textPrimary,
      flex: 1,
    },
    sectionStats: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      color: theme.colors.textTertiary,
      marginLeft: spacing.md,
    },
    
    topicRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: spacing.md,
      borderRadius: 12,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.textTertiary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    checkboxActive: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    topicContent: {
      flex: 1,
    },
    topicTitle: {
      fontFamily: 'Inter_500Medium',
      fontSize: 16,
      color: theme.colors.textPrimary,
    },
    topicTitleCompleted: {
      color: theme.colors.textTertiary,
      textDecorationLine: 'line-through',
    },
    topicNotes: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
  });
}
