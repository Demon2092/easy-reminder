import React, { useState } from 'react';

import PageWrapper from '../components/PageWrapper';import { Link } from 'react-router-dom';

import PageWrapper from '../components/PageWrapper';import { useNavigate } from 'react-router-dom';

import PageWrapper from '../components/PageWrapper';import { LocalNotifications } from '@capacitor/local-notifications';

import PageWrapper from '../components/PageWrapper';import { Haptics } from '@capacitor/haptics';


import PageWrapper from '../components/PageWrapper';export default function AddReminder() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [interval, setInterval] = useState('');
  const [type, setType] = useState('notification');
  const [alertDuration, setAlertDuration] = useState(3);
  const [repeatCount, setRepeatCount] = useState(1);

  const triggerAlert = async () => {
    if (type === 'notification') {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Reminder',
            body: title,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
          },
        ],
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
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
    audio.loop = true;
    audio.play();

    await new Promise(r => setTimeout(r, alertDuration * 1000));

    audio.pause();
    audio.currentTime = 0;

    if (i < repeatCount - 1) {
      await new Promise(r => setTimeout(r, 1000)); // pause between repeats
    }
  }
}

  };

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

    const storedReminders = localStorage.getItem('reminders');
    const reminders = storedReminders ? JSON.parse(storedReminders) : [];
    reminders.push(newReminder);
    localStorage.setItem('reminders', JSON.stringify(reminders));

    await triggerAlert();

    navigate('/');
  };

  return (\n    <PageWrapper>\n      <div className="min-h-screen bg-gray-900 text-white px-4 sm:px-6 py-10 flex justify-center">
  <div className="w-full max-w-[600px] bg-gray-800 rounded-2xl p-6 shadow-lg space-y-6">
	<Link
  to="/"
  className="text-blue-400 hover:underline block mb-4"
>
  ← Back to Home
</Link>

<h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center">Add Reminder</h1>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block mb-1 font-semibold">Title:</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Interval (e.g. every 15 minutes):</label>
          <input
            type="text"
            value={interval}
            onChange={e => setInterval(e.target.value)}
            required
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Alert Type:</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white"
          >
            <option value="notification">Notification</option>
            <option value="sound">Sound</option>
            <option value="vibration">Vibration</option>
            <option value="tts">Text-to-Speech</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-semibold">Alert Duration (sec):</label>
          <input
            type="number"
            min="1"
            value={alertDuration}
            onChange={e => setAlertDuration(Number(e.target.value))}
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Repeat Count:</label>
          <input
            type="number"
            min="1"
            value={repeatCount}
            onChange={e => setRepeatCount(Number(e.target.value))}
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition"
        >
          Save Reminder
        </button>
      </form>
    </div>
  </div>
);

}

