package com.easy.reminder.plugin

import android.util.Log
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.PluginMethod
import org.json.JSONArray

@CapacitorPlugin(name = "Reminderplug")
class ReminderplugPlugin : Plugin() {

    @PluginMethod
    fun saveReminders(call: PluginCall) {
        try {
            val nowMs = call.getDouble("nowMs")?.toLong() ?: System.currentTimeMillis()
            val arr: JSONArray = call.getArray("reminders") ?: run {
                call.reject("Missing reminders")
                return
            }
            val list = mutableListOf<ReminderDTO>()
            for (i in 0 until arr.length()) {
                val o = arr.getJSONObject(i)
                val id = o.optString("id")
                if (id.isNullOrBlank()) continue
                val dto = ReminderDTO(
                    id = id,
                    intervalMinutes = o.optLong("intervalMinutes", 0L),
                    lastTriggered = if (o.has("lastTriggered")) o.optLong("lastTriggered") else null,
                    active = if (o.has("active")) o.optBoolean("active") else true,
                    label = if (o.has("label")) o.optString("label") else null,
                    soundUri = if (o.has("soundUri")) o.optString("soundUri") else null,
                    vibrate = if (o.has("vibrate")) o.optBoolean("vibrate") else null
                )
                list.add(dto)
            }

            ReminderStore.saveAll(context, list)
            list.filter { it.active && it.intervalMinutes > 0 }
                .forEach { ReminderScheduler.scheduleNext(context, it, nowMs) }

            Log.d("ReminderplugPlugin", "event=SAVE_REMINDERS count=${list.size} nowMs=$nowMs")
            val ret = com.getcapacitor.JSObject().put("savedCount", list.size)
            call.resolve(ret)
        } catch (t: Throwable) {
            Log.e("ReminderplugPlugin", "event=ERROR message=\"${t.message}\"")
            call.reject("Failed to save reminders", Exception(t))
        }
    }
}
