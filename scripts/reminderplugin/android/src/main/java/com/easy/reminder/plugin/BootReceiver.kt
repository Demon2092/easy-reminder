package com.easy.reminder.plugin

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        val list = ReminderStore.loadAll(context).filter { it.active && it.intervalMinutes > 0 }
        list.forEach { ReminderScheduler.scheduleNext(context, it, System.currentTimeMillis()) }
        Log.d("BootReceiver", "event=RESYNC count=${list.size} action=$action")
    }
}
