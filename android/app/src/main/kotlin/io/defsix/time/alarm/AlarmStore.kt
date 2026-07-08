package io.defsix.time.alarm

import android.content.Context
import android.content.SharedPreferences
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
 */
class AlarmStore(context: Context) {
    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences("city_alarms", Context.MODE_PRIVATE)

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

    @Synchronized
    fun getAll(): List<StoredAlarm> = readAll()

    @Synchronized
    fun add(alarm: StoredAlarm) {
        val all = readAll()
        all.removeAll { it.id == alarm.id }
        all.add(alarm)
        writeAll(all)
    }

    @Synchronized
    fun remove(id: String) {
        val all = readAll()
        all.removeAll { it.id == id }
        writeAll(all)
    }

    @Synchronized
    fun toJson(): String {
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
        return array.toString()
    }

    companion object {
        private const val KEY_ALARMS = "alarms"
    }
}
