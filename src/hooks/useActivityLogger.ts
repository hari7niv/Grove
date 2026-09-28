import { Alert } from 'react-native';
import { useRepositories } from '@/src/db/provider';
import { getLogicalDate, nowISO } from '@/src/utils/date';
import { useGardenStore } from '@/src/stores/garden';
import type { ActivityType } from '@/src/types/models';

interface LogActivityParams {
  categoryId?: string;
  type: ActivityType;
  value: number;
  unit: string;
  metadata?: string;
  timestamp?: string;
  fallbackName?: string;
}

export function useActivityLogger() {
  const repositories = useRepositories();
  const syncGarden = useGardenStore(s => s.sync);

  const logActivity = async (params: LogActivityParams) => {
    // 1. Read dayStartHour from settings
    const settings = await repositories.settings.getAll();
    const dayStartHour = settings.dayStartHour;

    const ts = params.timestamp || nowISO();
    const logicalDate = getLogicalDate(ts, dayStartHour);
    const logicalToday = getLogicalDate(nowISO(), dayStartHour);

    let resolvedCategoryId = params.categoryId;
    
    // Fallback: resolve or create category if missing
    if (!resolvedCategoryId) {
      const allCats = await repositories.categories.getAll();
      let fallbackCat = allCats.find(c => c.name.toLowerCase().includes(params.type.toLowerCase()) || c.name.toLowerCase().includes('mind') || c.name.toLowerCase().includes('reading'));
      if (!fallbackCat) {
        fallbackCat = await repositories.categories.create({
          name: params.type.charAt(0).toUpperCase() + params.type.slice(1),
          color: '#2D7A4F',
          icon: '📚',
          plantType: 'plant_1',
          sortOrder: 10,
        });
      }
      resolvedCategoryId = fallbackCat.id;
    }

    // 2. Resolve the plant from the category
    const activeHabits = await repositories.habits.getActive();
    let habitForCategory = activeHabits.find(h => h.categoryId === resolvedCategoryId);

    if (!habitForCategory) {
      // 3. Prompt to create one if it doesn't exist
      const shouldCreate = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Create Plant',
          'No plant exists for this activity category in your garden. Create one now to track your streak?',
          [
            { text: 'Skip', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Create', onPress: () => resolve(true) },
          ]
        );
      });

      if (shouldCreate) {
        habitForCategory = await repositories.habits.create({
          name: params.fallbackName || 'New Habit',
          categoryId: resolvedCategoryId,
          requirementType: 'count', // added requirementType
          requirementValue: 1, // added requirementValue
          active: true, // added active
        });
      } else {
        // Log it without a habitId (just an activity log, won't water a plant)
        await repositories.activityLogs.create({
          categoryId: resolvedCategoryId,
          habitId: null,
          type: params.type,
          value: params.value,
          unit: params.unit,
          metadata: params.metadata || '{}',
          timestamp: ts,
          logicalDate,
        });
        return;
      }
    }

    // 4. Log the activity with the resolved plant
    await repositories.activityLogs.create({
      categoryId: resolvedCategoryId,
      habitId: habitForCategory.id,
      type: params.type,
      value: params.value,
      unit: params.unit,
      metadata: params.metadata || '{}',
      timestamp: ts,
      logicalDate,
    });

    // 5. Refresh the garden store
    await syncGarden(repositories, logicalToday);
  };

  return { logActivity };
}
