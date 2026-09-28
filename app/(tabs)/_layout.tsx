/**
 * Tab layout — responsive navigation.
 *
 * Mobile: bottom tab bar
 * Desktop: persistent left sidebar
 */

import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRepositories } from '@/src/db/provider';

import { useTheme } from '@/src/design/theme';
import { useLayout } from '@/src/hooks/useLayout';
import {
  HomeIcon,
  GardenIcon,
  FitnessIcon,
  TasksIcon,
  BookIcon,
  RssIcon,
  MoreIcon,
} from '@/src/components/ui/Icon';
import { spacing, minTouchTarget } from '@/src/design/tokens';

const TAB_ITEMS = [
  { name: 'index', title: 'Today', Icon: HomeIcon },
  { name: 'garden', title: 'Garden', Icon: GardenIcon },
  { name: 'exercises', title: 'Exercise', Icon: FitnessIcon },
  { name: 'tasks', title: 'Tasks', Icon: TasksIcon },
  { name: 'library', title: 'Library', Icon: BookIcon },
  { name: 'feeds', title: 'Reader', Icon: RssIcon },
  { name: 'more', title: 'More', Icon: MoreIcon },
] as const;

export default function TabLayout() {
  const theme = useTheme();
  const layout = useLayout();
  const repositories = useRepositories();
  const router = useRouter();

  useEffect(() => {
    async function checkOnboarding() {
      const cats = await repositories.categories.getAll();
      if (cats.length === 0) {
        // Empty DB (no categories), redirect to onboarding
        router.replace('/onboarding' as any);
      }
    }
    checkOnboarding();
  }, [repositories, router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarStyle: layout.isDesktop
          ? { display: 'none' } // Hide bottom tabs on desktop (we use sidebar)
          : {
              backgroundColor: theme.colors.tabBar,
              borderTopColor: theme.colors.tabBarBorder,
              borderTopWidth: StyleSheet.hairlineWidth,
              height: Platform.OS === 'ios' ? 88 : 64,
              paddingTop: spacing.xs,
              paddingBottom: Platform.OS === 'ios' ? 28 : spacing.xs,
            },
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      {TAB_ITEMS.map(({ name, title, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color }) => <Icon size={22} color={color as string} />,
            tabBarAccessibilityLabel: title,
          }}
        />
      ))}
    </Tabs>
  );
}
