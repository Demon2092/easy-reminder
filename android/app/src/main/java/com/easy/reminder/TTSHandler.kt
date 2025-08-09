package com.easy.reminder

import android.content.Context
import android.speech.tts.TextToSpeech
import android.util.Log
import java.util.*

class TTSHandler(private val context: Context) : TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = null
    private var pendingText: String? = null
    private var isReady = false

    init {
        tts = TextToSpeech(context, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts?.language = Locale.US
            isReady = true
            Log.d("TTSHandler", "TTS initialized successfully")

            pendingText?.let {
                speak(it)
                pendingText = null
            }
        } else {
            Log.e("TTSHandler", "TTS initialization failed")
        }
    }

    fun speak(text: String) {
        if (!isReady) {
            Log.w("TTSHandler", "TTS not ready, buffering text: $text")
            pendingText = text
        } else {
            Log.d("TTSHandler", "Speaking: $text")
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "reminder_id")
        }
    }

    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
        Log.d("TTSHandler", "TTS shutdown")
    }
}

