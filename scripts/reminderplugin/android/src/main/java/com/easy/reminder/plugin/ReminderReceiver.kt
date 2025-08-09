package com.easy.reminder.plugin

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != "com.easy.reminder.ACTION_FIRE") return

        val id = intent.getStringExtra("reminderId") ?: return
        val intervalMs = intent.getLongExtra("intervalMs", 0L)
        val label = intent.getStringExtra("label")
        val vibrate = intent.getBooleanExtra("vibrate", false)

        val now = System.currentTimeMillis()
        Log.d("ReminderReceiver", "event=FIRED id=$id ts=$now rescheduleMs=${now + intervalMs}")

        // Trigger alert
        AlertUtils.triggerAlert(context, speakText = label, playSound = true, vibrate = vibrate)

        // Update store + reschedule
        val list = ReminderStore.loadAll(context)
        list.find { it.id == id }?.let {
            it.lastTriggered = now
            ReminderStore.saveAll(context, list)
            ReminderScheduler.scheduleNext(context, it, now)
        }
    }
}
