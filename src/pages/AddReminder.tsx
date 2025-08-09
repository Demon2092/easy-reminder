import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics } from '@capacitor/haptics';
import PageWrapper from '../components/PageWrapper';
import { Capacitor } from '@capacitor/core';
import { Reminderplug } from 'reminderplugin';





export default function AddReminder() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [interval, setInterval] = useState('');
  const [type, setType] = useState('notification');
  const [alertDuration, setAlertDuration] = useState(3);
  const [repeatCount, setRepeatCount] = useState(1);
  
  useEffect(() => {
  if (Capacitor.getPlatform() === 'android') {
    const intent = 'android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS';
    window.open(`intent://${intent}#Intent;scheme=android-settings;end;`, '_system');
  }
}, []);

 const triggerAlert = async () => {
  if (type === 'notification') {
    await LocalNotifications.schedule({
      notifications: [{
        title: 'Reminder',
        body: title,
        id: Date.now(),
        schedule: { at: new Date(Date.now() + 1000) },
        sound: 'default',
        channelId: 'high-priority',
      }]
    });
  }

  if (type === 'vibration') {
    for (let i = 0; i < repeatCount; i++) {
      await Haptics.vibrate();
      if (i < repeatCount - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  if (type === 'tts') {
    for (let i = 0; i < repeatCount; i++) {
      const utter = new SpeechSynthesisUtterance(title);
      speechSynthesis.speak(utter);
      await new Promise(r => setTimeout(r, (alertDuration + 1) * 1000));
    }
  }

  if (type === 'sound') {
    for (let i = 0; i < repeatCount; i++) {
  const audio = new Audio('/sounds/reminder.m4a');
  audio.loop = true;
  audio.play();

  await new Promise(r => setTimeout(r, alertDuration * 1000));

  audio.pause();
  audio.currentTime = 0;

  if (i < repeatCount - 1) {
    await new Promise(r => setTimeout(r, 1000));
  }
}

  }
};

function parseInterval(interval: string): number {
  const match = interval.match(/^(\d+)\s*(m|h|d)?$/i);
  if (!match) return 0;
  const [, num, unit] = match;
  const multiplier = unit?.toLowerCase() === 'h' ? 60 : unit?.toLowerCase() === 'd' ? 1440 : 1;
  return parseInt(num) * multiplier;
}



const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const newReminder = {
    title,
    interval,
    type,
    alertDuration,
    repeatCount,
    createdAt: new Date().toISOString()
  };

  // Step 1: Save to localStorage (for UI display / fallback)
  const storedReminders = localStorage.getItem('reminders');
  const reminders = storedReminders ? JSON.parse(storedReminders) : [];
  reminders.push(newReminder);
  localStorage.setItem('reminders', JSON.stringify(reminders));

  // Step 2: Trigger alert immediately
 // await triggerAlert();

  // Step 3: Sync all reminders to native storage
  const nativeReminders = reminders.map((reminder: any) => ({
    title: reminder.title,
    intervalMinutes: parseInterval(reminder.interval),
    lastTriggered: reminder.lastTriggered || 0
  }));

  try {
    await Reminderplug.saveReminders({ reminders: nativeReminders });
    console.log("✅ Synced reminders to native");
  } catch (err) {
    console.error("❌ Failed to sync to native:", err);
  }

  navigate('/');
};
 return (
  

    <PageWrapper> 
	<div className="w-full max-w-2xl mx-auto bg-gray-800 space-y-6">     
        <Link to="/" className="text-blue-400 hover:underline block mb-4">← Back to Home</Link>
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center">Add Reminder</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Title:</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 rounded bg-gray-700 text-white" />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Interval (e.g. every 15 minutes):</label>
            <input type="text" value={interval} onChange={e => setInterval(e.target.value)} required className="w-full p-2 rounded bg-gray-700 text-white" />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Alert Type:</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full p-2 rounded bg-gray-700 text-white">
              <option value="notification">Notification</option>
              <option value="sound">Sound</option>
              <option value="vibration">Vibration</option>
{/* <option value="tts">Text-to-Speech</option> */}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold">Alert Duration (sec):</label>
            <input type="number" min="1" value={alertDuration} onChange={e => setAlertDuration(Number(e.target.value))} className="w-full p-2 rounded bg-gray-700 text-white" />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Repeat Count:</label>
            <input type="number" min="1" value={repeatCount} onChange={e => setRepeatCount(Number(e.target.value))} className="w-full p-2 rounded bg-gray-700 text-white" />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition">Save Reminder</button>
        </form>
      </div>
    </PageWrapper>
  );
}
