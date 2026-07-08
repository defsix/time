package io.defsix.time.alarm

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.core.app.NotificationManagerCompat
import io.defsix.time.MainActivity

/**
 * JS-facing bridge (window.AndroidAlarmBridge in the web app) for setting an
 * alarm tied to a specific city's local time. Runs on WebView's private
 * background thread (per addJavascriptInterface's contract), so anything
 * touching the Activity/UI is dispatched back to the main thread.
 */
class AlarmBridge(private val activity: MainActivity, private val webView: WebView) {
    private val store = AlarmStore(activity)

    @JavascriptInterface
    fun hasNotificationPermission(): Boolean =
        NotificationManagerCompat.from(activity).areNotificationsEnabled()

    @JavascriptInterface
    fun requestNotificationPermission() {
        activity.requestNotificationPermission { granted ->
            webView.post {
                webView.evaluateJavascript(
                    "window.__onNotificationPermissionResult && window.__onNotificationPermissionResult($granted)",
                    null,
                )
            }
        }
    }

    @JavascriptInterface
    fun hasExactAlarmPermission(): Boolean = AlarmScheduler.canScheduleExact(activity)

    @JavascriptInterface
    fun requestExactAlarmPermission() {
        activity.runOnUiThread {
            val intent = Intent(
                Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                Uri.parse("package:${activity.packageName}"),
            )
            activity.startActivity(intent)
        }
    }

    @JavascriptInterface
    fun scheduleAlarm(id: String, cityLabel: String, epochMillis: Double, label: String): String {
        if (!NotificationManagerCompat.from(activity).areNotificationsEnabled()) {
            return "needs_notification_permission"
        }
        val alarm = StoredAlarm(id = id, cityLabel = cityLabel, epochMillis = epochMillis.toLong(), label = label)
        store.add(alarm)
        val exact = AlarmScheduler.schedule(activity, alarm)
        return if (exact) "ok" else "ok_inexact"
    }

    @JavascriptInterface
    fun cancelAlarm(id: String) {
        AlarmScheduler.cancel(activity, id)
        store.remove(id)
    }

    @JavascriptInterface
    fun listAlarms(): String = store.toJson()
}
