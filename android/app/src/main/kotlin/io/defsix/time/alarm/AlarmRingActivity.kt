package io.defsix.time.alarm

import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.text.format.DateFormat
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import io.defsix.time.R
import java.util.Date

/**
 * Full-screen alarm-ringing UI, launched either automatically (full-screen
 * intent, when the device is locked) or by tapping the notification
 * AlarmReceiver posts. Shows over the lock screen and turns the screen on,
 * without requiring the device be unlocked first — the same behavior as the
 * built-in Clock app's alarms.
 *
 * It's `singleInstance`, so an alarm that fires while another is still
 * ringing arrives via onNewIntent and joins the same screen; Snooze and
 * Dismiss then act on every alarm it's ringing for.
 */
class AlarmRingActivity : AppCompatActivity() {
    private data class RingingAlarm(val id: String, val cityLabel: String, val label: String)

    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private val ringing = mutableListOf<RingingAlarm>()
    private val handler = Handler(Looper.getMainLooper())
    private val silenceAfterTimeout = Runnable { silence() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // setShowWhenLocked/setTurnScreenOn only exist from API 27 — calling
        // them on Android 8.0 (minSdk 26) crashed this screen the moment an
        // alarm rang — so fall back to the older window flags there.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }

        setContentView(R.layout.activity_alarm_ring)

        findViewById<TextView>(R.id.alarmTime).text = DateFormat.getTimeFormat(this).format(Date())
        findViewById<Button>(R.id.dismissButton).setOnClickListener { dismiss() }
        findViewById<Button>(R.id.snoozeButton).setOnClickListener { snooze() }

        // Back used to finish the activity: the ringing stopped but the
        // alarm's ongoing notification stayed stuck. As in the built-in Clock
        // app, the only ways out are Snooze and Dismiss.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() = Unit
        })

        addAlarm(intent)
        startRinging()
        handler.postDelayed(silenceAfterTimeout, RING_TIMEOUT_MILLIS)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        addAlarm(intent)
        handler.removeCallbacks(silenceAfterTimeout)
        handler.postDelayed(silenceAfterTimeout, RING_TIMEOUT_MILLIS)
    }

    private fun addAlarm(intent: Intent) {
        val id = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) ?: return
        if (ringing.none { it.id == id }) {
            val cityLabel = intent.getStringExtra(AlarmScheduler.EXTRA_CITY_LABEL) ?: ""
            val label = intent.getStringExtra(AlarmScheduler.EXTRA_LABEL) ?: cityLabel
            ringing += RingingAlarm(id, cityLabel, label)
        }
        findViewById<TextView>(R.id.alarmLabel).text =
            getString(R.string.alarm_ringing_for, ringing.joinToString(" · ") { it.label })
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
        handler.removeCallbacks(silenceAfterTimeout)
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
        for (alarm in ringing) AlarmReceiver.cancelNotification(this, alarm.id)
        finish()
    }

    private fun snooze() {
        stopRinging()
        val store = AlarmStore(this)
        val snoozeUntil = System.currentTimeMillis() + SNOOZE_MILLIS
        for (alarm in ringing) {
            AlarmReceiver.cancelNotification(this, alarm.id)
            val snoozed = StoredAlarm(id = alarm.id, cityLabel = alarm.cityLabel, epochMillis = snoozeUntil, label = alarm.label)
            store.add(snoozed)
            AlarmScheduler.schedule(this, snoozed)
        }
        finish()
    }

    /** Nobody answered: stop ringing and leave a swipeable "missed" notice instead of the stuck ongoing one. */
    private fun silence() {
        stopRinging()
        for (alarm in ringing) AlarmReceiver.postMissedNotification(this, alarm.id, alarm.label)
        finish()
    }

    override fun onDestroy() {
        stopRinging()
        super.onDestroy()
    }

    private companion object {
        const val SNOOZE_MILLIS = 10 * 60_000L
        // Same default as the built-in Clock app's "Silence after".
        const val RING_TIMEOUT_MILLIS = 10 * 60_000L
    }
}
