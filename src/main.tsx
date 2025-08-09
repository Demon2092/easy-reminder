// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import './tailwind.css';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

if (Capacitor.getPlatform() === 'android') {
  LocalNotifications.createChannel({
    id: 'reminder-channel',
    name: 'Reminders',
    description: 'Reminder alerts with sound',
    importance: 5,           // HIGH_PRIORITY
    visibility: 1,           // PUBLIC visibility
    sound: 'default',        // Use system default sound
    vibration: true,
  });
}


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
