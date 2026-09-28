/**
 * More screen — settings, insights, search links.
 * Phase 1: Placeholder. Phase 8: Full implementation.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing, maxContentWidth, minTouchTarget } from '@/src/design/tokens';
import {
  SettingsIcon,
  SearchIcon,
  BarChartIcon,
  RssIcon,
  ChevronRightIcon,
} from '@/src/components/ui/Icon';

interface MenuItem {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  route?: string;
}

const MENU_ITEMS: MenuItem[] = [
  { title: 'Insights', subtitle: 'Weekly review and stats', icon: BarChartIcon, route: '/insights' },
  { title: 'Search', subtitle: 'Find anything', icon: SearchIcon, route: '/search' },
  { title: 'Settings', subtitle: 'Preferences and data', icon: SettingsIcon, route: '/settings' },
];

export default function MoreScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = makeStyles(theme);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>More</Text>

      <View style={styles.menuList}>
        {MENU_ITEMS.map((item, i) => (
          <Pressable
            key={item.title}
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
              i < MENU_ITEMS.length - 1 && styles.menuItemBorder,
            ]}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            onPress={() => item.route && router.push(item.route as any)}
          >
            <View style={styles.menuIcon}>
              <item.icon size={20} color={theme.colors.textSecondary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <ChevronRightIcon size={16} color={theme.colors.textTertiary} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: {
      maxWidth: maxContentWidth, alignSelf: 'center', width: '100%', padding: spacing.xl,
    },
    title: {
      fontFamily: 'Inter_700Bold', fontSize: 32, lineHeight: 40,
      color: theme.colors.textPrimary, marginBottom: spacing['2xl'],
    },
    menuList: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      minHeight: minTouchTarget,
    },
    menuItemPressed: {
      backgroundColor: theme.colors.surfaceRaised,
    },
    menuItemBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.borderLight,
    },
    menuIcon: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: theme.colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    menuText: {
      flex: 1,
    },
    menuTitle: {
      fontFamily: 'Inter_500Medium',
      fontSize: 15,
      color: theme.colors.textPrimary,
    },
    menuSubtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 1,
    },
  });
}
