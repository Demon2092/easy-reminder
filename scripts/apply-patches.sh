#!/usr/bin/env bash
set -euo pipefail

BRANCH="${BRANCH:-fix-reminder-pipeline}"

echo "==> Creating branch: $BRANCH"
git checkout -b "$BRANCH" || git checkout "$BRANCH"

# --- android/settings.gradle ---
mkdir -p android
cat > android/settings.gradle <<'PATCH'
include ':app'
include ':capacitor-cordova-android-plugins'
project(':capacitor-cordova-android-plugins').projectDir = new File('./capacitor-cordova-android-plugins/')
include ':reminderplugin'
project(':reminderplugin').projectDir = new File(rootDir, '../reminderplugin/android')

apply from: 'capacitor.settings.gradle'

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_PROJECT)
    repositories {
        google()
        mavenCentral()
    }
}
PATCH

# --- android/app/build.gradle (append dependency if missing) ---
APP_GRADLE="android/app/build.gradle"
if ! grep -q "implementation project(':reminderplugin')" "$APP_GRADLE"; then
  echo "==> Adding :reminderplugin dependency to $APP_GRADLE"
  awk '
    /dependencies *\{/ && !added {
      print;
      print "    implementation project(\\x27:reminderplugin\\x27)";
      added=1; next
    }1
  ' "$APP_GRADLE" > "$APP_GRADLE.tmp" && mv "$APP_GRADLE.tmp" "$APP_GRADLE"
fi

# --- reminderplugin module ---
mkdir -p reminderplugin/android/src/main/java/com/easy/reminder/plugin
mkdir -p reminderplugin/android/src/main/res/xml
mkdir -p reminderplugin/src
mkdir -p docs
mkdir -p examples

# reminderplugin/android/build.gradle
cat > reminderplugin/android/build.gradle <<'PATCH'
plugins {
    id 'com.android.library'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace "com.easy.reminder.plugin"
    compileSdkVersion rootProject.ext.compileSdkVersion

    defaultConfig {
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // Use the same Capacitor Android as the app
    implementation project(':capacitor-android')
    implementation 'com.google.code.gson:gson:2.10.1'
    implementation "androidx.core:core-ktx:1.12.0"
}
PATCH

# reminderplugin/android/src/main/AndroidManifest.xml
cat > reminderplugin/android/src/main/AndroidManifest.xml <<'PATCH'
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.easy.reminder.plugin">
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <application>
        <receiver android:name=".ReminderReceiver" android:exported="false">
            <intent-filter>
                <action android:name="com.easy.reminder.ACTION_FIRE" />
            </intent-filter>
        </receiver>
        <receiver android:name=".BootReceiver" android:exported="false">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.TIME_CHANGED" />
                <action android:name="android.intent.action.TIMEZONE_CHANGED" />
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
            </intent-filter>
        </receiver>
    </application>
</manifest>
PATCH

# ReminderDTO.kt
cat > reminderplugin/android/src/main/java/com/easy/reminder/plugin/ReminderDTO.kt <<'PATCH'
package com.easy.reminder.plugin

data class ReminderDTO(
    val id: String,
    val intervalMinutes: Long,
    var lastTriggered: Long? = null,
    var active: Boolean = true,
    var label: String? = null,
    var soundUri: String? = null,
    var vibrate: Boolean? = null
)
PATCH

# ReminderStore.kt
cat > reminderplugin/android/src/main/java/com/easy/reminder/plugin/ReminderStore.kt <<'PATCH'
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
PATCH

# ReminderScheduler.kt
cat > reminderplugin/android/src/main/java/com/easy/reminder/plugin/ReminderScheduler.kt <<'PATCH'
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
PATCH

# ReminderReceiver.kt
cat > reminderplugin/android/src/main/java/com/easy/reminder/plugin/ReminderReceiver.kt <<'PATCH'
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
PATCH

# BootReceiver.kt
cat > reminderplugin/android/src/main/java/com/easy/reminder/plugin/BootReceiver.kt <<'PATCH'
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
PATCH

# AlertUtils.kt
cat > reminderplugin/android/src/main/java/com/easy/reminder/plugin/AlertUtils.kt <<'PATCH'
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
PATCH

# ReminderplugPlugin.kt
cat > reminderplugin/android/src/main/java/com/easy/reminder/plugin/ReminderplugPlugin.kt <<'PATCH'
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
PATCH

# reminderplugin/src/index.ts (frontend bridge)
cat > reminderplugin/src/index.ts <<'PATCH'
import { registerPlugin } from '@capacitor/core';

export type Reminder = {
  id: string;
  intervalMinutes: number;
  lastTriggered?: number;
  active?: boolean;
  label?: string;
  soundUri?: string;
  vibrate?: boolean;
};

export const Reminderplug = registerPlugin<{
  saveReminders(o: { reminders: Reminder[]; nowMs?: number }): Promise<{ savedCount: number }>;
}>('Reminderplug');
PATCH

# examples/seedReminder.ts
cat > examples/seedReminder.ts <<'PATCH'
import { Reminderplug } from '../reminderplugin/src';

(async () => {
  await Reminderplug.saveReminders({
    reminders: [{ id: 'test1', intervalMinutes: 1, lastTriggered: Date.now(), active: true, label: 'Test 1', vibrate: true }],
    nowMs: Date.now(),
  });
  console.log('seeded test1');
})();
PATCH

# docs/runbook.md
cat > docs/runbook.md <<'PATCH'
# Runbook

## Build & install
```bash
./gradlew clean :reminderplugin:assembleDebug :app:installDebug
