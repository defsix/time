package io.defsix.time.alarm

import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.text.format.DateFormat
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import io.defsix.time.R
import java.util.Date

/**
 * Full-screen alarm-ringing UI, launched either automatically (full-screen
 * intent, when the device is locked) or by tapping the notification
 * AlarmReceiver posts. Shows over the lock screen and turns the screen on,
 * without requiring the device be unlocked first — the same behavior as the
 * built-in Clock app's alarms.
 */
class AlarmRingActivity : AppCompatActivity() {
    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private var alarmId: String = ""
    private var cityLabel: String = ""
    private var label: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setShowWhenLocked(true)
        setTurnScreenOn(true)

        setContentView(R.layout.activity_alarm_ring)

        alarmId = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) ?: ""
        cityLabel = intent.getStringExtra(AlarmScheduler.EXTRA_CITY_LABEL) ?: ""
        label = intent.getStringExtra(AlarmScheduler.EXTRA_LABEL) ?: cityLabel

        findViewById<TextView>(R.id.alarmLabel).text = "${getString(R.string.alarm_ringing)}: $label"
        findViewById<TextView>(R.id.alarmTime).text = DateFormat.getTimeFormat(this).format(Date())

        findViewById<Button>(R.id.dismissButton).setOnClickListener { dismiss() }
        findViewById<Button>(R.id.snoozeButton).setOnClickListener { snooze() }

        startRinging()
    }

    private fun startRinging() {
        try {
            val alarmUri = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            mediaPlayer = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                setDataSource(this@AlarmRingActivity, alarmUri)
                isLooping = true
                prepare()
                start()
            }
        } catch (e: Exception) {
            // No default alarm sound configured, or the media couldn't be
            // prepared — fall back to vibration only rather than crashing.
            mediaPlayer = null
        }

        vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (getSystemService(VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(VIBRATOR_SERVICE) as? Vibrator
        }
        vibrator?.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 800, 800), 0))
    }

    private fun stopRinging() {
        mediaPlayer?.let {
            it.stop()
            it.release()
        }
        mediaPlayer = null
        vibrator?.cancel()
        vibrator = null
    }

    private fun dismiss() {
        stopRinging()
        AlarmReceiver.cancelNotification(this, alarmId)
        finish()
    }

    private fun snooze() {
        stopRinging()
        AlarmReceiver.cancelNotification(this, alarmId)
        val snoozeAlarm = StoredAlarm(
            id = alarmId,
            cityLabel = cityLabel,
            epochMillis = System.currentTimeMillis() + 10 * 60_000L,
            label = label,
        )
        AlarmStore(this).add(snoozeAlarm)
        AlarmScheduler.schedule(this, snoozeAlarm)
        finish()
    }

    override fun onDestroy() {
        stopRinging()
        super.onDestroy()
    }
}
