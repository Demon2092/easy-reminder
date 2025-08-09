import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics } from '@capacitor/haptics';
import PageWrapper from '../components/PageWrapper';
import './Home.css';
import { Reminderplug } from 'reminderplugin';





interface Reminder {
  title: string;
  interval: string;
  type: string;
  alertDuration?: number;
  repeatCount?: number;
  lastTriggered?: number;
  createdAt: string;
}

interface CalendarReminder {
  title: string;
  time: string;
  triggeredDates?: string[];
}

export default function Home() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month'>('today');

  function parseInterval(interval: string): number {
    const minutes = { m: 1, h: 60, d: 1440 };
    const match = interval.match(/^(\d+)([mhd])$/i);
    if (!match) return 0;
    const [, num, unit] = match;
    return parseInt(num) * (minutes[unit.toLowerCase() as keyof typeof minutes] || 0);
  }

  function getNextDue(reminder: Reminder): string {
    const mins = parseInterval(reminder.interval);
    const baseTime = reminder.lastTriggered || Date.now();
    const nextTime = new Date(baseTime + mins * 60 * 1000);
    return nextTime.toLocaleString();
  }

  function filterRemindersByTab(reminders: Reminder[]) {
    const now = new Date();
    return reminders.filter((reminder) => {
      const mins = parseInterval(reminder.interval);
      const baseTime = reminder.lastTriggered || new Date(reminder.createdAt).getTime();
      const nextDue = new Date(baseTime + mins * 60 * 1000);

      if (activeTab === 'today') {
        return nextDue.toDateString() === now.toDateString();
      }

      if (activeTab === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return nextDue >= startOfWeek && nextDue <= endOfWeek;
      }

      if (activeTab === 'month') {
        return nextDue.getMonth() === now.getMonth() && nextDue.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }

const triggerAlert = async (reminder: Reminder) => {
  const { title, type } = reminder;

  // Use plugin only for these types
  if (['sound', 'vibration', 'tts'].includes(type)) {
    await Reminderplug.triggerReminder({
      message: title,
      playSound: type === 'sound' || type === 'tts',
      vibrate: type === 'vibration',
    });
    return;
  }

  // Fallback for basic notification type
  if (type === 'notification') {
    await LocalNotifications.schedule({
      notifications: [{
        title: 'Reminder',
        body: title,
        id: Date.now(),
        schedule: { at: new Date(Date.now() + 1000) },
        sound: 'default',
        channelId: 'high-priority',
      }],
    });
  }
};
  const deleteReminder = (indexToDelete: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this reminder?");
    if (!confirmed) return;
    const updated = reminders.filter((_, index) => index !== indexToDelete);
    setReminders(updated);
    localStorage.setItem('reminders', JSON.stringify(updated));
  };

  const checkCalendarReminders = () => {
    const stored = localStorage.getItem('calendarData');
    if (!stored) return;

    const parsed = JSON.parse(stored);
    const now = new Date();
    const todayKey = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    if (!parsed[todayKey]?.reminders) return;

    const reminders = parsed[todayKey].reminders;
    const updatedReminders = reminders.map((reminder: CalendarReminder) => {
      const hasTriggered = reminder.triggeredDates?.includes(todayKey);
      if (!hasTriggered && reminder.time <= currentTime) {
        alert(`?? Calendar Reminder: ${reminder.title}`);
        const updatedTriggerDates = [...(reminder.triggeredDates || []), todayKey];
        return { ...reminder, triggeredDates: updatedTriggerDates };
      }
      return reminder;
    });

    parsed[todayKey].reminders = updatedReminders;
    localStorage.setItem('calendarData', JSON.stringify(parsed));
  };

  useEffect(() => {
const checkReminders = async () => {
  const storedReminders = localStorage.getItem('reminders');
  if (!storedReminders) return;

  const now = Date.now();
  const parsed = JSON.parse(storedReminders);

  const updatedReminders = await Promise.all(parsed.map(async (reminder: Reminder) => {
    const intervalMinutes = parseInterval(reminder.interval);
    const lastTriggered = reminder.lastTriggered || 0;
    const shouldTrigger = intervalMinutes > 0 &&
      now - lastTriggered >= intervalMinutes * 60 * 1000;

    if (shouldTrigger) {
      try {
        await triggerAlert(reminder);
      } catch (err) {
        console.error('Failed to trigger alert:', err);
      }
      return { ...reminder, lastTriggered: now };
    }

    return { ...reminder };
  }));

  setReminders(updatedReminders);
  localStorage.setItem('reminders', JSON.stringify(updatedReminders));
};


    checkReminders();
    const interval = setInterval(() => {
      checkReminders();
      checkCalendarReminders();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <PageWrapper>
      <div className="w-full max-w-2xl px-4 sm:px-6 pb-24 sm:pb-10">
        <h1 className="text-3xl font-bold text-blue-500 mb-4">Reminders</h1>

        <nav className="mb-4 space-x-4">
  <Link to="/calendar" className="text-blue-300 hover:underline">Calendar</Link>
  <Link to="/add" className="text-blue-300 hover:underline">Add Reminder</Link>
  <Link to="/settings" className="text-blue-300 hover:underline">Settings</Link>
</nav>





        <div className="flex space-x-2 mb-6">
          {['today', 'week', 'month'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'today' | 'week' | 'month')}
              className={`px-4 py-3 text-sm sm:text-base rounded border font-semibold transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed opacity-70'
              }`}
            >
              {tab === 'today' ? 'Today' : tab === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        <ul className="space-y-2">
          {reminders.length === 0 ? (
            <p className="text-gray-400">No reminders yet.</p>
          ) : (
            filterRemindersByTab(reminders).map((reminder, index) => (
              <li key={index} className="border border-gray-600 p-4 sm:p-5 rounded-xl space-y-1">
                <strong className="text-lg">{reminder.title}</strong><br />
                <span className="text-sm text-gray-400">
                  Interval: {reminder.interval} | Type: {reminder.type}
                </span><br />
                <span className="text-sm text-gray-400">Next due: {getNextDue(reminder)}</span><br />
                <button
                  onClick={() => deleteReminder(index)}
                  className="mt-2 text-red-400 hover:underline"
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </PageWrapper>
  );
}
