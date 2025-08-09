package com.easy.reminder.plugin

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.util.Log
import kotlin.math.max

object ReminderScheduler {
    private const val ACTION = "com.easy.reminder.ACTION_FIRE"

    fun scheduleNext(context: Context, dto: ReminderDTO, nowMs: Long) {
        try {
            val am = context.getSystemService(AlarmManager::class.java) ?: run {
                Log.e("ReminderScheduler", "event=ERROR id=${dto.id} message=\"AlarmManager null\"")
                return
            }
            val intervalMs = dto.intervalMinutes * 60_000L
            val last = dto.lastTriggered ?: (nowMs - intervalMs)
            val next = max(last + intervalMs, nowMs + 1_000L)

            val intent = Intent(context, ReminderReceiver::class.java).apply {
                action = ACTION
                putExtra("reminderId", dto.id)
                putExtra("intervalMs", intervalMs)
                putExtra("label", dto.label)
                putExtra("vibrate", dto.vibrate ?: false)
                putExtra("soundUri", dto.soundUri)
            }
            val pi = PendingIntent.getBroadcast(
                context,
                dto.id.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pi)
            Log.d("ReminderScheduler", "event=SCHEDULED id=${dto.id} nowMs=$nowMs nextMs=$next intervalMs=$intervalMs")
        } catch (t: Throwable) {
            Log.e("ReminderScheduler", "event=ERROR id=${dto.id} message=\"${t.message}\"")
        }
    }
}
