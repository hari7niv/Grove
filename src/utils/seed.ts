/**
 * Development utility to seed the database with mock data.
 */

import type { Repositories } from '../db/repositories';
import { addDays, getLogicalDate, nowISO } from './date';
import type { ActivityType } from '../types/models';

export async function seedDatabase(repositories: Repositories) {
  try {
    const existingCats = await repositories.categories.getAll();
    if (existingCats.length > 0) {
      console.log('Database already seeded. Skipping.');
      return;
    }

    // 1. Create categories
    const fitnessCat = await repositories.categories.create({
      name: 'Fitness',
      color: '#4CAF50',
      icon: 'fitness',
      plantType: 'generic',
      sortOrder: 0,
    });
    
    const mindCat = await repositories.categories.create({
      name: 'Mind',
      color: '#9C27B0',
      icon: 'brain',
      plantType: 'generic',
      sortOrder: 1,
    });
    
    const workCat = await repositories.categories.create({
      name: 'Work',
      color: '#2196F3',
      icon: 'tasks',
      plantType: 'generic',
      sortOrder: 2,
    });

    // 2. Create Habits
    // Habit 1: Workout (thriving, mature tree)
    const workoutHabit = await repositories.habits.create({
      categoryId: fitnessCat.id,
      name: 'Daily Workout',
      requirementType: 'any',
      requirementValue: 1,
      active: true,
    });

    // Habit 2: Reading (wilting, young tree)
    const readingHabit = await repositories.habits.create({
      categoryId: mindCat.id,
      name: 'Reading',
      requirementType: 'any',
      requirementValue: 1,
      active: true,
    });

    // Habit 3: Coding (ok, sprout)
    const codingHabit = await repositories.habits.create({
      categoryId: workCat.id,
      name: 'Deep Work',
      requirementType: 'count',
      requirementValue: 2, // e.g. 2 hours
      active: true,
    });

    // 3. Create Activity Logs
    const logicalToday = getLogicalDate(nowISO(), 4);

    // Seed workout: perfect streak for 100 days
    for (let i = 0; i < 100; i++) {
      const date = addDays(logicalToday, -i);
      await repositories.activityLogs.create({
        categoryId: fitnessCat.id,
        habitId: workoutHabit.id,
        type: 'exercise',
        value: 1,
        unit: 'session',
        metadata: null,
        timestamp: date + 'T12:00:00.000Z',
        logicalDate: date,
      });
    }

    // Seed reading: 40 days, but missed the last 2 days (wilting)
    for (let i = 2; i < 42; i++) {
      const date = addDays(logicalToday, -i);
      await repositories.activityLogs.create({
        categoryId: mindCat.id,
        habitId: readingHabit.id,
        type: 'reading',
        value: 1,
        unit: 'pages',
        metadata: null,
        timestamp: date + 'T18:00:00.000Z',
        logicalDate: date,
      });
    }

    // Seed coding: 4 days, missed yesterday but done today (ok)
    for (let i = 0; i < 6; i++) {
      if (i === 1) continue; // Skip yesterday
      const date = addDays(logicalToday, -i);
      await repositories.activityLogs.create({
        categoryId: workCat.id,
        habitId: codingHabit.id,
        type: 'focus',
        value: 2,
        unit: 'hours',
        metadata: null,
        timestamp: date + 'T09:00:00.000Z',
        logicalDate: date,
      });
    }

    // 4. Create Exercises
    await repositories.exercises.create({
      name: 'Pushups',
      mode: 'count',
      categoryId: fitnessCat.id,
      targetDuration: null,
      targetReps: 20,
      targetSets: 3,
      restDuration: 60,
      notes: 'Keep core tight',
    });

    await repositories.exercises.create({
      name: 'Plank',
      mode: 'timer',
      categoryId: fitnessCat.id,
      targetDuration: 60,
      targetReps: null,
      targetSets: 3,
      restDuration: 30,
      notes: null,
    });

    // 5. Seed Roadmaps
    const roadmapSeed = require('./roadmap-seed.json');
    for (const track of roadmapSeed.tracks) {
      const roadmap = await repositories.roadmaps.create({
        name: track.name,
        categoryId: mindCat.id, // Put them in Mind for now
        description: `Category: ${track.category}`,
      });

      let sortOrder = 0;
      for (const section of track.sections) {
        const sectionItem = await repositories.roadmaps.createItem({
          roadmapId: roadmap.id,
          parentId: null,
          title: section.title,
          notes: section.note || null,
          resourceLinks: [],
          timeEstimate: null,
          completed: false,
          sortOrder: sortOrder++,
        });

        if (section.topics) {
          let topicOrder = 0;
          for (const topic of section.topics) {
            await repositories.roadmaps.createItem({
              roadmapId: roadmap.id,
              parentId: sectionItem.id,
              title: topic.title,
              notes: topic.note || null,
              resourceLinks: [],
              timeEstimate: null,
              completed: topic.status === 'done',
              sortOrder: topicOrder++,
            });
          }
        }
      }
    }

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Failed to seed DB', err);
  }
}
