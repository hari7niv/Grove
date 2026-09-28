/**
 * Routine Builder screen.
 */

import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/src/design/theme';
import { useRepositories } from '@/src/db/provider';
import type { Exercise } from '@/src/types/models';
import { RoutineBuilder } from '@/src/components/fitness/RoutineBuilder';

export default function NewRoutineScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const repositories = useRepositories();

  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    async function load() {
      const data = await repositories.exercises.getAll();
      setExercises(data);
    }
    load();
  }, [repositories]);

  const handleSave = async (name: string, selectedIds: string[]) => {
    if (!name.trim()) {
      alert('Please enter a routine name');
      return;
    }
    if (selectedIds.length === 0) {
      alert('Please select at least one exercise');
      return;
    }

    try {
      await repositories.routines.create({
        name: name.trim(),
        exerciseIds: selectedIds,
      });
      router.back();
    } catch (e) {
      console.error(e);
      alert('Failed to save routine');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      <RoutineBuilder
        availableExercises={exercises}
        onSave={handleSave}
        onCancel={() => router.back()}
      />
    </View>
  );
}
