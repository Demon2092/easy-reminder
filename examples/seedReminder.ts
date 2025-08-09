import { Reminderplug } from '../reminderplugin/src';

(async () => {
  await Reminderplug.saveReminders({
    reminders: [{ id: 'test1', intervalMinutes: 1, lastTriggered: Date.now(), active: true, label: 'Test 1', vibrate: true }],
    nowMs: Date.now(),
  });
  console.log('seeded test1');
})();
