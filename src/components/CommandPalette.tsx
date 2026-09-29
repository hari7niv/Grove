import React, { useEffect, useState } from 'react';
import { Modal, View, TextInput, StyleSheet, Pressable, Text, Platform, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, type Theme } from '@/src/design/theme';
import { spacing } from '@/src/design/tokens';
import { SearchIcon, XIcon } from '@/src/components/ui/Icon';

type Command = {
  id: string;
  title: string;
  route: string;
  icon?: string;
};

const COMMANDS: Command[] = [
  { id: '1', title: 'Home', route: '/' },
  { id: '2', title: 'Garden', route: '/garden' },
  { id: '3', title: 'Tasks', route: '/tasks' },
  { id: '4', title: 'Exercises', route: '/exercises' },
  { id: '5', title: 'Feeds', route: '/feeds' },
  { id: '6', title: 'Library', route: '/library' },
  { id: '7', title: 'Settings', route: '/settings' },
  { id: '8', title: 'Focus', route: '/focus' },
  { id: '9', title: 'Insights', route: '/insights' },
];

export function CommandPalette() {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const theme = useTheme();
  const styles = makeStyles(theme);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setVisible(v => !v);
      } else if (e.key === 'Escape' && visible) {
        setVisible(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  const filteredCommands = COMMANDS.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (route: string) => {
    setVisible(false);
    setQuery('');
    router.push(route as any);
  };

  if (!visible && Platform.OS === 'web') return null;
  // Mobile could potentially open this from a UI button, but the prompt emphasizes web shortcuts.
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
        <Pressable style={styles.modal} onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <SearchIcon size={20} color={theme.colors.textSecondary} />
            <TextInput
              autoFocus
              style={styles.input}
              placeholder="Where do you want to go?"
              placeholderTextColor={theme.colors.textTertiary}
              value={query}
              onChangeText={setQuery}
              accessibilityRole="search"
              accessibilityLabel="Command palette search"
            />
            <Pressable onPress={() => setVisible(false)} hitSlop={12} accessibilityLabel="Close command palette" accessibilityRole="button">
              <XIcon size={20} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
          <FlatList
            data={filteredCommands}
            keyExtractor={item => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <Pressable 
                style={({ hovered, pressed }: any) => [
                  styles.item,
                  (hovered || pressed) && styles.itemActive
                ]}
                onPress={() => handleSelect(item.route)}
                accessibilityRole="button"
                accessibilityLabel={`Go to ${item.title}`}
              >
                <Text style={styles.itemText}>{item.title}</Text>
              </Pressable>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingTop: '15%',
    },
    modal: {
      width: '90%',
      maxWidth: 600,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
      maxHeight: '60%',
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: spacing.md,
    },
    input: {
      flex: 1,
      fontFamily: 'Inter_400Regular',
      fontSize: 16,
      color: theme.colors.textPrimary,
      outlineStyle: 'none' as any,
    },
    list: {
      padding: spacing.sm,
    },
    item: {
      padding: spacing.md,
      borderRadius: 8,
    },
    itemActive: {
      backgroundColor: theme.colors.surfaceRaised,
    },
    itemText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 15,
      color: theme.colors.textPrimary,
    },
  });
}
