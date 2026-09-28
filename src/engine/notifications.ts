/**
 * Notifications Engine.
 *
 * Wraps expo-notifications for scheduling local reminders.
 * Gracefully handles the web platform by falling back to console.log or in-app toasts.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const isPushSupported = Platform.OS === 'ios' || Platform.OS === 'android';

export async function requestPermissions(): Promise<boolean> {
  if (!isPushSupported) return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

export async function scheduleTaskReminder(
  taskId: string, 
  title: string, 
  body: string, 
  dateStr: string, 
  timeStr: string
): Promise<string | null> {
  if (!isPushSupported) {
    console.log(`[Web Mock] Scheduled notification for task ${taskId}: ${title} at ${dateStr} ${timeStr}`);
    return `mock-${taskId}`;
  }

  const hasPermission = await requestPermissions();
  if (!hasPermission) return null;

  // Combine date and time strings into a Date object
  // dateStr format: YYYY-MM-DD
  // timeStr format: HH:MM
  const targetDate = new Date(`${dateStr}T${timeStr}:00`);

  if (targetDate.getTime() < Date.now()) {
    console.warn('Cannot schedule notification in the past');
    return null;
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { taskId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: targetDate,
    },
  });

  return id;
}

export async function cancelReminder(notificationId: string) {
  if (!isPushSupported) {
    console.log(`[Web Mock] Canceled notification ${notificationId}`);
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllReminders() {
  if (!isPushSupported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
