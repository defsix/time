package io.defsix.time.alarm

import android.app.AlarmManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * AlarmManager alarms don't survive a reboot, so re-schedule everything
 * still pending from the persisted store. Stale one-shot alarms whose time
 * already passed while the device was off are dropped rather than fired
 * late.
 *
 * Direct-boot aware: LOCKED_BOOT_COMPLETED arrives before the user first
 * unlocks, so alarms are re-armed (and can ring — see AlarmReceiver and
 * AlarmRingActivity) even if the phone rebooted overnight, e.g. for an OS
 * update. Also handles exact-alarm access being granted, which re-arms
 * alarms that had fallen back to an inexact window as exact ones.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_LOCKED_BOOT_COMPLETED,
            Intent.ACTION_BOOT_COMPLETED,
            AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED,
            -> AlarmScheduler.rescheduleAll(context)
        }
    }
}
