package com.easy.reminder.plugin

import android.content.Context
import android.util.Log
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

object ReminderStore {
    private const val PREF = "reminders"
    private const val KEY = "reminderList"
    private val gson = Gson()

    fun saveAll(context: Context, list: List<ReminderDTO>) {
        try {
            val prefs = context.getSharedPreferences(PREF, Context.MODE_PRIVATE)
            prefs.edit().putString(KEY, gson.toJson(list)).apply()
            Log.d("ReminderStore", "event=SAVED count=${list.size}")
        } catch (t: Throwable) {
            Log.e("ReminderStore", "event=ERROR message=\"${t.message}\"")
        }
    }

    fun loadAll(context: Context): MutableList<ReminderDTO> {
        return try {
            val prefs = context.getSharedPreferences(PREF, Context.MODE_PRIVATE)
            val json = prefs.getString(KEY, "[]") ?: "[]"
            val type = object : TypeToken<List<ReminderDTO>>() {}.type
            val list: List<ReminderDTO> = gson.fromJson(json, type) ?: emptyList()
            Log.d("ReminderStore", "event=LOADED count=${list.size}")
            list.toMutableList()
        } catch (t: Throwable) {
            Log.e("ReminderStore", "event=ERROR message=\"${t.message}\"")
            mutableListOf()
        }
    }
}
