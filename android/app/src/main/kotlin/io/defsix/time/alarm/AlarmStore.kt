package io.defsix.time.alarm

import android.content.Context
import android.content.SharedPreferences
import androidx.core.os.UserManagerCompat
import org.json.JSONArray
import org.json.JSONObject

data class StoredAlarm(
    val id: String,
    val cityLabel: String,
    val epochMillis: Long,
    val label: String,
)

/**
 * Persists scheduled city alarms as a JSON array in SharedPreferences —
 * AlarmManager itself doesn't let you enumerate what's currently scheduled,
 * and this list is also what BootReceiver reads to reschedule everything
 * after a reboot (raw AlarmManager alarms don't survive one).
 *
 * Kept in device-protected storage so it's readable before the user first
 * unlocks after a reboot (direct boot), when BootReceiver and AlarmReceiver
 * may need it. Alarm times and labels are all it holds.
 */
class AlarmStore(context: Context) {
    private val prefs: SharedPreferences = run {
        val app = context.applicationContext
        val deviceProtected = app.createDeviceProtectedStorageContext()
        // One-off migration from credential-encrypted storage, where earlier
        // versions kept the list; only readable once the user has unlocked.
        // A no-op when there's nothing left to move.
        if (UserManagerCompat.isUserUnlocked(app)) {
            deviceProtected.moveSharedPreferencesFrom(app, PREFS_NAME)
        }
        deviceProtected.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    private fun readAll(): MutableList<StoredAlarm> {
        val raw = prefs.getString(KEY_ALARMS, null) ?: return mutableListOf()
        val array = JSONArray(raw)
        return MutableList(array.length()) { i ->
            val obj = array.getJSONObject(i)
            StoredAlarm(
                id = obj.getString("id"),
                cityLabel = obj.getString("cityLabel"),
                epochMillis = obj.getLong("epochMillis"),
                label = obj.getString("label"),
            )
        }
    }

    private fun writeAll(alarms: List<StoredAlarm>) {
        val array = JSONArray()
        for (alarm in alarms) {
            array.put(
                JSONObject()
                    .put("id", alarm.id)
                    .put("cityLabel", alarm.cityLabel)
                    .put("epochMillis", alarm.epochMillis)
                    .put("label", alarm.label)
            )
        }
        prefs.edit().putString(KEY_ALARMS, array.toString()).apply()
    }

    // One lock for every instance: the bridge, receivers and ring screen each
    // create their own AlarmStore, and their read-modify-write updates of
    // the same file must not interleave (or one of them loses an alarm).
    fun getAll(): List<StoredAlarm> = synchronized(LOCK) { readAll() }

    fun add(alarm: StoredAlarm) = synchronized(LOCK) {
        val all = readAll()
        all.removeAll { it.id == alarm.id }
        all.add(alarm)
        writeAll(all)
    }

    fun remove(id: String) = synchronized(LOCK) {
        val all = readAll()
        all.removeAll { it.id == id }
        writeAll(all)
    }

    fun toJson(): String = synchronized(LOCK) {
        val array = JSONArray()
        for (alarm in readAll()) {
            array.put(
                JSONObject()
                    .put("id", alarm.id)
                    .put("cityLabel", alarm.cityLabel)
                    .put("epochMillis", alarm.epochMillis)
                    .put("label", alarm.label)
            )
        }
        array.toString()
    }

    companion object {
        private const val PREFS_NAME = "city_alarms"
        private const val KEY_ALARMS = "alarms"
        private val LOCK = Any()
    }
}
