import { registerPlugin } from '@capacitor/core';

export type Reminder = {
  id: string;
  intervalMinutes: number;
  lastTriggered?: number;
  active?: boolean;
  label?: string;
  soundUri?: string;
  vibrate?: boolean;
};

export const Reminderplug = registerPlugin<{
  saveReminders(o: { reminders: Reminder[]; nowMs?: number }): Promise<{ savedCount: number }>;
}>('Reminderplug');
