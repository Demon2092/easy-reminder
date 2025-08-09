package com.easy.reminder.plugin

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat

object AlertUtils {
    private const val CHANNEL_ID = "ReminderAlerts"

    fun triggerAlert(
        context: Context,
        speakText: String? = null,
        playSound: Boolean = true,
        vibrate: Boolean = true
    ) {
        try {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            // Resolve sound
            var soundUri: Uri? = null
            val resId = context.resources.getIdentifier("reminder", "raw", context.packageName)
            soundUri = if (resId != 0) {
                Uri.parse("android.resource://${context.packageName}/$resId")
            } else {
                RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val ch = NotificationChannel(
                    CHANNEL_ID, "Reminder Alerts", NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    enableVibration(true)
                    setBypassDnd(true)
                    setSound(
                        soundUri,
                        AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build()
                    )
                }
                nm.createNotificationChannel(ch)
            }

            val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationCompat.Builder(context, CHANNEL_ID)
            } else {
                NotificationCompat.Builder(context)
            }

            builder.setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("Reminder")
                .setContentText(speakText ?: "It's time!")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)

            if (playSound && soundUri != null) builder.setSound(soundUri)
            if (vibrate) builder.setVibrate(longArrayOf(0, 300, 250, 300))

            val n: Notification = builder.build()
            nm.notify((System.currentTimeMillis() % Int.MAX_VALUE).toInt(), n)
            Log.d("AlertUtils", "event=NOTIFICATION_POSTED sound=$playSound vibrate=$vibrate")
        } catch (t: Throwable) {
            Log.e("AlertUtils", "event=ERROR message=\"${t.message}\"")
        }
    }
}
