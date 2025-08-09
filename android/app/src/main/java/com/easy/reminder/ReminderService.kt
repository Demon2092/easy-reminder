package com.easy.reminder

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import com.easy.reminder.AlertUtils
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

private const val FOREGROUND_TYPE_MEDIA_PLAYBACK = 0x00000002

data class Reminder(
    val title: String,
    val intervalMinutes: Int,
    var lastTriggered: Long
)

fun loadReminders(context: Context): List<Reminder> {
    val prefs = context.getSharedPreferences("reminders", Context.MODE_PRIVATE)
    val json = prefs.getString("reminderList", "[]")
    val type = object : TypeToken<List<Reminder>>() {}.type
    return Gson().fromJson(json, type)
}

fun saveReminders(context: Context, reminders: List<Reminder>) {
    val prefs = context.getSharedPreferences("reminders", Context.MODE_PRIVATE)
    prefs.edit().putString("reminderList", Gson().toJson(reminders)).apply()
}

class ReminderService : Service() {

    companion object {
        const val CHANNEL_ID = "ReminderServiceChannel"
        const val NOTIFICATION_ID = 1
    }

    override fun onCreate() {
        super.onCreate()
        Log.d("ReminderService", "Service created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d("ReminderService", "startForeground called")
        createNotificationChannel()

        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0, notificationIntent, PendingIntent.FLAG_IMMUTABLE
        )

        val notification: Notification = Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("Easy Reminder")
            .setContentText("Reminder service running")
            .setSmallIcon(R.drawable.ic_reminder_icon)
            .setContentIntent(pendingIntent)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIFICATION_ID, notification, FOREGROUND_TYPE_MEDIA_PLAYBACK)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        val message = intent?.getStringExtra("alertMessage")
        val playSound = intent?.getBooleanExtra("playSound", false) ?: false
        val vibrate = intent?.getBooleanExtra("vibrate", false) ?: false

        Log.d("ReminderService", "Intent received: message=$message, sound=$playSound, vibrate=$vibrate")

        AlertUtils.triggerAlert(
            context = this,
            speakText = message,
            playSound = playSound,
            vibrate = vibrate
        )

        // 🔁 Native reminder check loop
        val handler = Handler(Looper.getMainLooper())
        val checkTask = object : Runnable {
            override fun run() {
                val reminders = loadReminders(applicationContext)
                val now = System.currentTimeMillis()
                val updated = reminders.map {
                    val due = now - it.lastTriggered >= it.intervalMinutes * 60_000
                    if (due) {
                        AlertUtils.triggerAlert(
                            context = applicationContext,
                            speakText = it.title,
                            playSound = true,
                            vibrate = true
                        )
                        it.lastTriggered = now
                    }
                    it
                }
                saveReminders(applicationContext, updated)
                handler.postDelayed(this, 30_000)
            }
        }
        handler.post(checkTask)

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Reminder Service Channel",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                setBypassDnd(true)
                enableVibration(true)
                description = "Used to trigger alerts for reminders"
            }

            val manager = applicationContext.getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(serviceChannel)
        }
    }
}

