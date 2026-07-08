package io.defsix.time.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import io.defsix.time.MainActivity

/**
 * Wraps AlarmManager scheduling for city alarms. Prefers an exact,
 * user-visible alarm-clock-style trigger (setAlarmClock, which is how the
 * built-in Clock app schedules alarms), but degrades gracefully to an
 * inexact ~10-minute window when the SCHEDULE_EXACT_ALARM special access
 * hasn't been granted — per Android 14's exact-alarm guidance, apps should
 * offer this fallback rather than failing outright.
 */
object AlarmScheduler {
    const val EXTRA_ALARM_ID = "alarm_id"
    const val EXTRA_CITY_LABEL = "city_label"
    const val EXTRA_LABEL = "label"
    private const val ACTION_PREFIX = "io.defsix.time.ALARM_"
    private const val INEXACT_WINDOW_MILLIS = 10 * 60_000L

    fun canScheduleExact(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
        val alarmManager = context.getSystemService(AlarmManager::class.java)
        return alarmManager.canScheduleExactAlarms()
    }

    /** Returns true if scheduled exactly, false if it fell back to an inexact window. */
    fun schedule(context: Context, alarm: StoredAlarm): Boolean {
        val alarmManager = context.getSystemService(AlarmManager::class.java)
        val operation = pendingIntentFor(context, alarm.id, alarm.cityLabel, alarm.label)

        return if (canScheduleExact(context)) {
            val showIntent = PendingIntent.getActivity(
                context,
                alarm.id.hashCode(),
                Intent(context, MainActivity::class.java),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            alarmManager.setAlarmClock(AlarmManager.AlarmClockInfo(alarm.epochMillis, showIntent), operation)
            true
        } else {
            val windowStart = (alarm.epochMillis - INEXACT_WINDOW_MILLIS).coerceAtLeast(System.currentTimeMillis())
            alarmManager.setWindow(AlarmManager.RTC_WAKEUP, windowStart, INEXACT_WINDOW_MILLIS, operation)
            false
        }
    }

    fun cancel(context: Context, alarmId: String) {
        val alarmManager = context.getSystemService(AlarmManager::class.java)
        alarmManager.cancel(pendingIntentFor(context, alarmId))
    }

    private fun pendingIntentFor(
        context: Context,
        id: String,
        cityLabel: String? = null,
        label: String? = null,
    ): PendingIntent {
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = ACTION_PREFIX + id
            putExtra(EXTRA_ALARM_ID, id)
            cityLabel?.let { putExtra(EXTRA_CITY_LABEL, it) }
            label?.let { putExtra(EXTRA_LABEL, it) }
        }
        return PendingIntent.getBroadcast(
            context,
            id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }
}
