package io.defsix.time

import android.view.WindowManager
import android.webkit.JavascriptInterface
import androidx.core.view.WindowCompat

/**
 * JS-facing bridge (window.AndroidDisplayBridge) backing nightstand/bedside
 * mode's "keep the screen on" behavior, and keeping the native status bar's
 * icon color legible against whatever the page's background actually is —
 * the app is edge-to-edge (see MainActivity.enableEdgeToEdge), so the status
 * bar has no background of its own to guarantee contrast the way a device's
 * system dark/light mode alone otherwise would.
 */
class DisplayBridge(private val activity: MainActivity) {
    @JavascriptInterface
    fun setKeepScreenOn(on: Boolean) {
        activity.runOnUiThread {
            if (on) {
                activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            } else {
                activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
    }

    @JavascriptInterface
    fun setStatusBarAppearance(isLightBackground: Boolean) {
        activity.runOnUiThread {
            WindowCompat.getInsetsController(activity.window, activity.window.decorView)
                .isAppearanceLightStatusBars = isLightBackground
        }
    }
}
