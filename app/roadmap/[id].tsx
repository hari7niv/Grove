/**
 * Roadmap Detail Screen.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing } from '@/src/design/tokens';
import { useRepositories } from '@/src/db/provider';
import { ChevronLeftIcon, CheckIcon } from '@/src/components/ui/Icon';
import type { Roadmap, RoadmapItem } from '@/src/types/models';
import { useActivityLogger } from '@/src/hooks/useActivityLogger';
import { nowISO } from '@/src/utils/date';

export default function RoadmapScreen() {
  const { id } = useLocalSearchParams();
  const isNew = id === 'new';
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme);
  const repositories = useRepositories();
  const { logActivity } = useActivityLogger();

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // For creation
  const [topicInput, setTopicInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      if (isNew) {
        setIsLoading(false);
        return;
      }
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
  }, [id, repositories, isNew]);

  const toggleTopic = async (topic: RoadmapItem) => {
    if (!roadmap) return;
    
    const newStatus = !topic.completed;
    
    try {
      // Optimistic update
      setItems(prev => prev.map(i => i.id === topic.id ? { ...i, completed: newStatus } : i));
      
      await repositories.roadmaps.updateItem(topic.id, { completed: newStatus });
      
      // If marking as done, log activity
      if (newStatus && roadmap.categoryId) {
        await logActivity({
          categoryId: roadmap.categoryId,
          type: 'roadmap',
          value: 1, // 1 topic completed
          unit: 'count',
          metadata: JSON.stringify({ topic: topic.title, roadmapName: roadmap.name }),
          fallbackName: `Learning (${roadmap.name})`
        });
      }
    } catch (e) {
      // Revert on failure
      setItems(prev => prev.map(i => i.id === topic.id ? { ...i, completed: !newStatus } : i));
      console.error('Failed to update topic status', e);
    }
  };

  const handleGenerate = async () => {
    if (!topicInput.trim()) {
      alert("Please enter a topic or goal.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const rm = await repositories.roadmaps.create({
        name: topicInput.trim(),
        description: `Generated roadmap for ${topicInput.trim()}`,
        categoryId: null,
      });

      // Generate Phase 1
      const p1 = await repositories.roadmaps.createItem({
        roadmapId: rm.id,
        title: 'Phase 1: Basics',
        parentId: null,
        sortOrder: 0,
        completed: false,
        timeEstimate: null,
        notes: null,
        resourceLinks: []
      });
      const p1t1 = await repositories.roadmaps.createItem({
        roadmapId: rm.id,
        title: `Introduction to ${topicInput.trim()}`,
        parentId: p1.id,
        sortOrder: 0,
        completed: false,
        timeEstimate: 60,
        notes: 'Learn the core concepts',
        resourceLinks: []
      });
      await repositories.tasks.create({
        title: p1t1.title,
        description: `Task for Roadmap: ${rm.name}`,
        priority: 'medium',
        status: 'pending',
        categoryId: null,
        parentId: null,
        dueDate: null,
        dueTime: null,
        tags: [],
        recurrenceRule: null,
        completedAt: null
      });

      // Generate Phase 2
      const p2 = await repositories.roadmaps.createItem({
        roadmapId: rm.id,
        title: 'Phase 2: Advanced',
        parentId: null,
        sortOrder: 1,
        completed: false,
        timeEstimate: null,
        notes: null,
        resourceLinks: []
      });
      const p2t1 = await repositories.roadmaps.createItem({
        roadmapId: rm.id,
        title: `Deep dive into ${topicInput.trim()}`,
        parentId: p2.id,
        sortOrder: 0,
        completed: false,
        timeEstimate: 120,
        notes: 'Master the topic',
        resourceLinks: []
      });
      await repositories.tasks.create({
        title: p2t1.title,
        description: `Task for Roadmap: ${rm.name}`,
        priority: 'medium',
        status: 'pending',
        categoryId: null,
        parentId: null,
        dueDate: null,
        dueTime: null,
        tags: [],
        recurrenceRule: null,
        completedAt: null
      });

      router.replace(`/roadmap/${rm.id}`);
    } catch (e) {
      console.error(e);
      alert("Failed to generate roadmap.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!roadmap && !isLoading && !isNew) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, padding: spacing.xl }]}>
        <Text style={styles.title}>Roadmap not found</Text>
      </View>
    );
  }

  // Filter sections (items with no parent) and topics (items with a parent)
  const sections = items.filter(i => !i.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  const allTopics = items.filter(i => i.parentId);
  const completedTopics = allTopics.filter(t => t.completed).length;
  const progressPercent = allTopics.length > 0 ? (completedTopics / allTopics.length) * 100 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeftIcon size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{isNew ? 'New Roadmap' : roadmap?.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isNew ? (
          <View style={{ flex: 1, paddingVertical: spacing.xl }}>
            <Text style={styles.label}>What do you want to learn or achieve?</Text>
            <TextInput 
              style={styles.input}
              placeholder="e.g. Master React Native, Prepare for System Design Interview"
              placeholderTextColor={theme.colors.textTertiary}
              value={topicInput}
              onChangeText={setTopicInput}
              autoFocus
            />
            
            <Pressable 
              style={[styles.generateButton, isGenerating && { opacity: 0.7 }]}
              onPress={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.generateButtonText}>Generate Roadmap</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {completedTopics} of {allTopics.length} topics completed
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>

            {sections.map(section => {
              const sectionTopics = items.filter(i => i.parentId === section.id).sort((a, b) => a.sortOrder - b.sortOrder);
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
          </>
        )}
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
    
    label: { fontFamily: 'Inter_500Medium', fontSize: 15, color: theme.colors.textSecondary, marginBottom: spacing.md },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: spacing.md,
      fontFamily: 'Inter_400Regular',
      fontSize: 16,
      color: theme.colors.textPrimary,
      marginBottom: spacing['2xl'],
    },
    generateButton: {
      backgroundColor: theme.colors.accent,
      paddingVertical: spacing.lg,
      borderRadius: 16,
      alignItems: 'center',
    },
    generateButtonText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 17,
      color: '#FFF',
    },

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
