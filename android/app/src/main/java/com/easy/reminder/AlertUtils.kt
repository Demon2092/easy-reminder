package com.easy.reminder

import android.content.Context
import android.media.MediaPlayer
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log


object AlertUtils {
    fun triggerAlert(
        context: Context,
        speakText: String? = null,
        playSound: Boolean = false,
        vibrate: Boolean = false
    ) {
        val mainHandler = Handler(Looper.getMainLooper())

        if (playSound) {
            mainHandler.post {
                try {
                    val mp = MediaPlayer.create(context, R.raw.alert)
                    mp?.start()
                } catch (e: Exception) {
                    Log.e("AlertUtils", "Failed to play sound: ${e.message}")
                }
            }
        }

        if (vibrate) {
            val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val pattern = longArrayOf(0, 300, 250, 300)
                val effect = VibrationEffect.createWaveform(pattern, -1)
                vibrator?.vibrate(effect)
            } else {
                vibrator?.vibrate(longArrayOf(0, 300, 250, 300), -1)
            }
        }

        if (!speakText.isNullOrBlank()) {
            mainHandler.post {
                val ttsHandler = TTSHandler(context)
                ttsHandler.speak(speakText)
            }
        }
    }
}
