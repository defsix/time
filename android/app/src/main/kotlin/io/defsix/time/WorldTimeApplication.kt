package io.defsix.time

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.media.AudioAttributes

class WorldTimeApplication : Application() {

    companion object {
        const val ALARM_CHANNEL_ID = "city_alarms"
    }

    override fun onCreate() {
        super.onCreate()

        val channel = NotificationChannel(
            ALARM_CHANNEL_ID,
            getString(R.string.alarm_channel_name),
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = getString(R.string.alarm_channel_description)
            setSound(
                null, // AlarmRingActivity plays the ringtone itself, looped
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )
            enableVibration(false) // AlarmRingActivity handles vibration itself
            setBypassDnd(true)
        }

        getSystemService(Context.NOTIFICATION_SERVICE, NotificationManager::class.java)
            .createNotificationChannel(channel)
    }
}
