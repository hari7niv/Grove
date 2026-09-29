import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, Platform, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, type Theme } from '@/src/design/theme';
import { spacing, maxContentWidth } from '@/src/design/tokens';
import { useRepositories } from '@/src/db/provider';
import { ChevronLeftIcon } from '@/src/components/ui/Icon';
import type { AppSettings } from '@/src/types/models';
import { getDatabase } from '@/src/db/connection';
import { exportDatabase, importDatabase, downloadJson, pickJsonFile } from '@/src/engine/export-import';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme);
  const repositories = useRepositories();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await repositories.settings.getAll();
      setSettings(data);
      setLoading(false);
    }
    load();
  }, [repositories]);

  const updateSetting = async (key: keyof AppSettings, value: string) => {
    setSettings(prev => {
      if (!prev) return null;
      let parsedValue: any = value;
      if (key === 'dayStartHour' || key === 'restTokensPerMonth') parsedValue = parseInt(value, 10);
      if (key === 'notificationsEnabled' || key === 'reduceMotion') parsedValue = value === 'true';
      return { ...prev, [key]: parsedValue };
    });
    await repositories.settings.set(key, value);
    // In a real app we'd dispatch an event or use a global store to apply some settings instantly
  };

  const handleReset = () => {
    // Reset database logic would go here
    alert('Reset functionality coming soon');
  };

  const handleExport = async () => {
    try {
      const db = await getDatabase();
      const exportData = await exportDatabase(db);
      await downloadJson(`grove_backup_${new Date().toISOString().split('T')[0]}.json`, JSON.stringify(exportData, null, 2));
    } catch (e) {
      console.error(e);
      alert('Failed to export data');
    }
  };

  const handleImport = async () => {
    try {
      const jsonStr = await pickJsonFile();
      if (!jsonStr) return; // User cancelled

      // Parse JSON safely
      let data;
      try {
        data = JSON.parse(jsonStr);
      } catch (e) {
        alert('Invalid JSON file.');
        return;
      }

      Alert.alert(
        'Import Data',
        'This will replace all your current data. This action cannot be undone. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              try {
                const db = await getDatabase();
                await importDatabase(db, data);
                alert('Import successful. Please restart the app.');
              } catch (e) {
                console.error(e);
                alert('Failed to import data: ' + (e as Error).message);
              }
            }
          }
        ]
      );
    } catch (e) {
      console.error(e);
      alert('Failed to process file');
    }
  };

  if (loading || !settings) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeftIcon size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Theme Preference</Text>
            <View style={styles.segmentedControl}>
              {['system', 'light', 'dark'].map(t => (
                <Pressable
                  key={t}
                  style={[styles.segmentBtn, settings.themePreference === t && styles.segmentBtnActive]}
                  onPress={() => updateSetting('themePreference', t)}
                >
                  <Text style={[styles.segmentText, settings.themePreference === t && styles.segmentTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Day Start Hour</Text>
            <View style={styles.segmentedControl}>
              {[0, 4, 6].map(h => (
                <Pressable
                  key={h}
                  style={[styles.segmentBtn, settings.dayStartHour === h && styles.segmentBtnActive]}
                  onPress={() => updateSetting('dayStartHour', String(h))}
                >
                  <Text style={[styles.segmentText, settings.dayStartHour === h && styles.segmentTextActive]}>
                    {h}:00
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Rest Tokens per Month</Text>
            <View style={styles.segmentedControl}>
              {[1, 2, 3].map(n => (
                <Pressable
                  key={n}
                  style={[styles.segmentBtn, settings.restTokensPerMonth === n && styles.segmentBtnActive]}
                  onPress={() => updateSetting('restTokensPerMonth', String(n))}
                >
                  <Text style={[styles.segmentText, settings.restTokensPerMonth === n && styles.segmentTextActive]}>{n}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Notifications</Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={v => updateSetting('notificationsEnabled', v ? 'true' : 'false')}
              trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
            />
          </View>
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Target Role</Text>
            <View style={styles.segmentedControl}>
              {['swe', 'ml_infra'].map(r => (
                <Pressable
                  key={r}
                  style={[styles.segmentBtn, settings.targetRole === r && styles.segmentBtnActive]}
                  onPress={() => updateSetting('targetRole', r)}
                >
                  <Text style={[styles.segmentText, settings.targetRole === r && styles.segmentTextActive]}>
                    {r === 'swe' ? 'SWE' : 'ML'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          
          <View style={styles.rowVertical}>
            <Text style={styles.rowLabel}>RSS Proxy URL</Text>
            <TextInput
              style={styles.textInput}
              value={settings.rssProxyUrl}
              onChangeText={v => updateSetting('rssProxyUrl', v)}
              placeholder="e.g. https://api.allorigins.win/raw?url="
              placeholderTextColor={theme.colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          <Pressable style={styles.actionBtn} onPress={handleExport}>
            <Text style={styles.actionBtnText}>Export Data (Backup)</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={handleImport}>
            <Text style={styles.actionBtnText}>Import Data</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.dangerBtn]} onPress={handleReset}>
            <Text style={styles.dangerBtnText}>Reset All Data</Text>
          </Pressable>
        </View>

        {/* Dev Options */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Developer Options</Text>
            <Pressable style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>Load Demo Data</Text>
            </Pressable>
          </View>
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
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    backButton: { padding: spacing.xs, minWidth: 48 },
    title: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: theme.colors.textPrimary },
    content: {
      maxWidth: maxContentWidth,
      alignSelf: 'center',
      width: '100%',
      padding: spacing.xl,
      paddingBottom: spacing['4xl'],
    },
    section: {
      marginBottom: spacing['2xl'],
    },
    sectionTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: spacing.lg,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: spacing.lg,
      borderRadius: 12,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    rowLabel: {
      fontFamily: 'Inter_500Medium',
      fontSize: 16,
      color: theme.colors.textPrimary,
    },
    rowVertical: {
      backgroundColor: theme.colors.surface,
      padding: spacing.lg,
      borderRadius: 12,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    textInput: {
      marginTop: spacing.sm,
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: theme.colors.textSecondary,
      backgroundColor: theme.colors.background,
      padding: spacing.sm,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 2,
    },
    segmentBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 6,
    },
    segmentBtnActive: {
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 1,
    },
    segmentText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    segmentTextActive: {
      color: theme.colors.textPrimary,
      fontFamily: 'Inter_600SemiBold',
    },
    actionBtn: {
      backgroundColor: theme.colors.surface,
      padding: spacing.lg,
      borderRadius: 12,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    actionBtnText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 16,
      color: theme.colors.textPrimary,
    },
    dangerBtn: {
      borderColor: theme.colors.error,
    },
    dangerBtnText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 16,
      color: theme.colors.error,
    }
  });
}
