import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing } from '@/src/design/tokens';
import { useRepositories } from '@/src/db/provider';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Grow Your Garden',
    description: 'Every activity you log waters a living garden. Build consistent habits to turn seeds into a beautiful forest.',
    icon: '🌳',
  },
  {
    title: 'Track Everything',
    description: 'Log your workouts, reading sessions, focused work, and daily tasks—all in one place.',
    icon: '📊',
  },
  {
    title: 'Stay Focused',
    description: 'Use the built-in timer to stay in the zone. See your progress over time with detailed history and heatmaps.',
    icon: '🎯',
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = makeStyles(theme);
  const repositories = useRepositories();

  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    setActiveIndex(index);
  };

  const handleFinish = async () => {
    try {
      const now = new Date().toISOString();

      // Seed Categories
      const fitness = await repositories.categories.create({
        name: 'Fitness', color: '#C45B3E', icon: 'fitness', plantType: 'oak', sortOrder: 0
      });
      const reading = await repositories.categories.create({
        name: 'Reading', color: '#5B8FB0', icon: 'book', plantType: 'willow', sortOrder: 1
      });
      const learning = await repositories.categories.create({
        name: 'Learning', color: '#8B6DB0', icon: 'brain', plantType: 'pine', sortOrder: 2
      });
      const focus = await repositories.categories.create({
        name: 'Focus', color: '#D4A843', icon: 'target', plantType: 'maple', sortOrder: 3
      });
      const tasks = await repositories.categories.create({
        name: 'Tasks', color: '#2D7A4F', icon: 'check', plantType: 'birch', sortOrder: 4
      });

      // Seed Habits
      await repositories.habits.create({ categoryId: fitness.id, name: 'Daily Exercise', requirementType: 'any', requirementValue: 1, active: true });
      await repositories.habits.create({ categoryId: reading.id, name: 'Daily Reading', requirementType: 'any', requirementValue: 1, active: true });
      await repositories.habits.create({ categoryId: learning.id, name: 'Daily Learning', requirementType: 'any', requirementValue: 1, active: true });
      await repositories.habits.create({ categoryId: focus.id, name: 'Daily Focus', requirementType: 'any', requirementValue: 1, active: true });
      await repositories.habits.create({ categoryId: tasks.id, name: 'Complete Tasks', requirementType: 'any', requirementValue: 1, active: true });

      router.replace('/(tabs)/garden');
    } catch (e) {
      console.error(e);
      alert('Failed to set up initial data');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom || spacing.xl }]}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scroll}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={styles.slide}>
            <Text style={styles.slideIcon}>{slide.icon}</Text>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideDesc}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>

        {activeIndex === SLIDES.length - 1 ? (
          <Pressable style={styles.btnPrimary} onPress={handleFinish}>
            <Text style={styles.btnTextPrimary}>Get Started</Text>
          </Pressable>
        ) : (
          <View style={styles.btnPlaceholder} />
        )}
      </View>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1 },
    slide: {
      width,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing['2xl'],
    },
    slideIcon: { fontSize: 80, marginBottom: spacing['2xl'] },
    slideTitle: {
      fontFamily: 'Inter_700Bold',
      fontSize: 28,
      color: theme.colors.textPrimary,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    slideDesc: {
      fontFamily: 'Inter_400Regular',
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    footer: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: spacing['2xl'],
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.border,
      marginHorizontal: 4,
    },
    dotActive: {
      backgroundColor: theme.colors.accent,
      width: 24,
    },
    btnPrimary: {
      backgroundColor: theme.colors.accent,
      paddingVertical: spacing.lg,
      borderRadius: 16,
      alignItems: 'center',
    },
    btnTextPrimary: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 17,
      color: '#FFF',
    },
    btnPlaceholder: {
      height: 56, // Match height of btnPrimary to keep layout stable
    }
  });
}
