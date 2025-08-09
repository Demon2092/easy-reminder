import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Link } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';

interface CalendarData {
  [date: string]: {
    notes?: string;
    reminders?: { title: string; time: string }[];
  };
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [note, setNote] = useState('');
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  const handleAddReminder = () => {
    if (!reminderTitle || !reminderTime) return;

    const isoDate = selectedDate.toISOString().split('T')[0];
    const existingReminders = calendarData[isoDate]?.reminders || [];

    const updated = {
      ...calendarData,
      [isoDate]: {
        ...calendarData[isoDate],
        reminders: [
          ...existingReminders,
          { title: reminderTitle, time: reminderTime }
        ],
      },
    };

    setCalendarData(updated);
    localStorage.setItem('calendarData', JSON.stringify(updated));
    setReminderTitle('');
    setReminderTime('');
  };

  const handleDeleteReminder = (reminderIndex: number) => {
    const isoDate = selectedDate.toISOString().split('T')[0];
    const existing = calendarData[isoDate]?.reminders || [];

    const updatedReminders = existing.filter((_, i) => i !== reminderIndex);

    const updated = {
      ...calendarData,
      [isoDate]: {
        ...calendarData[isoDate],
        reminders: updatedReminders,
      },
    };

    setCalendarData(updated);
    localStorage.setItem('calendarData', JSON.stringify(updated));
  };

  useEffect(() => {
    const stored = localStorage.getItem('calendarData');
    if (stored) setCalendarData(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const isoDate = selectedDate.toISOString().split('T')[0];
    setNote(calendarData[isoDate]?.notes || '');
  }, [selectedDate, calendarData]);

  const handleSaveNote = () => {
    const isoDate = selectedDate.toISOString().split('T')[0];
    const updated = {
      ...calendarData,
      [isoDate]: {
        ...calendarData[isoDate],
        notes: note,
      },
    };
    setCalendarData(updated);
    localStorage.setItem('calendarData', JSON.stringify(updated));
  };

  return (
  <PageWrapper>
  <div className="w-full max-w-2xl bg-gray-800 space-y-6">
    <h1 className="text-2xl font-bold mb-2">Calendar</h1>
    <Link to="/" className="text-blue-400 hover:underline block mb-4">← Back to Home</Link>

    <div className="w-full overflow-hidden rounded shadow bg-white text-black p-4">
      <Calendar
        className="w-full"
        onChange={(date) => {
          if (date instanceof Date) {
            setSelectedDate(date);
          } else if (Array.isArray(date) && date[0] instanceof Date) {
            setSelectedDate(date[0]);
          }
        }}
        value={selectedDate}
      />
    </div>


        <div>
          <h2 className="text-lg font-semibold mb-1">
            Notes for {selectedDate.toDateString()}
          </h2>
          <textarea
            className="w-full p-2 text-white rounded bg-gray-700"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            onClick={handleSaveNote}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Save Note
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-1">
            Add Reminder for {selectedDate.toDateString()}
          </h2>
          <input
            type="text"
            placeholder="Reminder Title"
            value={reminderTitle}
            onChange={(e) => setReminderTitle(e.target.value)}
            className="w-full mb-2 p-2 rounded bg-gray-700 text-white"
          />
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="w-full mb-2 p-2 rounded bg-gray-700 text-white"
          />
          <button
            onClick={handleAddReminder}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Add Reminder
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold">Reminders:</h3>
          {calendarData[selectedDate.toISOString().split('T')[0]]?.reminders?.length ? (
            <ul className="space-y-2 mt-2">
              {calendarData[selectedDate.toISOString().split('T')[0]].reminders!.map((r, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center bg-gray-700 p-3 rounded"
                >
<span>⏰ {r.time} — <span className="font-medium">{r.title}</span></span>
                  <button
                    onClick={() => handleDeleteReminder(i)}
                    className="text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 mt-2">No reminders for this date.</p>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
