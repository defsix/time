package io.defsix.time.alarm

import android.Manifest
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import io.defsix.time.WorldTimeApplication

/**
 * Fired by AlarmManager at the scheduled instant. City alarms are one-shot,
 * so this removes the alarm from the store, then posts a full-screen-intent
 * notification: the system auto-launches AlarmRingActivity over the lock
 * screen when eligible, or shows a heads-up notification otherwise (tapping
 * it opens the same activity) — see Android's full-screen intent docs for
 * why a direct startActivity() from here isn't reliable in the background.
 */
class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val alarmId = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) ?: return
        val cityLabel = intent.getStringExtra(AlarmScheduler.EXTRA_CITY_LABEL) ?: ""
        val label = intent.getStringExtra(AlarmScheduler.EXTRA_LABEL) ?: cityLabel

        AlarmStore(context).remove(alarmId)

        val ringIntent = Intent(context, AlarmRingActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            putExtra(AlarmScheduler.EXTRA_ALARM_ID, alarmId)
            putExtra(AlarmScheduler.EXTRA_CITY_LABEL, cityLabel)
            putExtra(AlarmScheduler.EXTRA_LABEL, label)
        }
        val fullScreenPendingIntent = PendingIntent.getActivity(
            context,
            alarmId.hashCode(),
            ringIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val notification = NotificationCompat.Builder(context, WorldTimeApplication.ALARM_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("Alarm: $label")
            .setContentText("It's alarm time in $label")
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setContentIntent(fullScreenPendingIntent)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .build()

        if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED
        ) {
            NotificationManagerCompat.from(context).notify(notificationIdFor(alarmId), notification)
        }
    }

    companion object {
        fun notificationIdFor(alarmId: String): Int = alarmId.hashCode()

        fun cancelNotification(context: Context, alarmId: String) {
            context.getSystemService(NotificationManager::class.java)
                .cancel(notificationIdFor(alarmId))
        }
    }
}
