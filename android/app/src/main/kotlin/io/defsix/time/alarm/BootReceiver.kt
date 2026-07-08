package io.defsix.time.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * AlarmManager alarms don't survive a reboot, so re-schedule everything
 * still pending from the persisted store. Stale one-shot alarms whose time
 * already passed while the device was off are dropped rather than fired
 * late.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

        val store = AlarmStore(context)
        val now = System.currentTimeMillis()
        for (alarm in store.getAll()) {
            if (alarm.epochMillis <= now) {
                store.remove(alarm.id)
            } else {
                AlarmScheduler.schedule(context, alarm)
            }
        }
    }
}
