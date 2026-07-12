package io.defsix.time

import android.view.Window
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
 *
 * Takes a Window + a "run this on the UI thread" callback rather than an
 * Activity directly so it can be shared between MainActivity and
 * WorldTimeDreamService (a Service, not an Activity, but still has a Window).
 */
class DisplayBridge(
    private val window: Window,
    private val runOnUi: (() -> Unit) -> Unit,
) {
    @JavascriptInterface
    fun setKeepScreenOn(on: Boolean) {
        runOnUi {
            if (on) {
                window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            } else {
                window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
    }

    @JavascriptInterface
    fun setStatusBarAppearance(isLightBackground: Boolean) {
        runOnUi {
            WindowCompat.getInsetsController(window, window.decorView)
                .isAppearanceLightStatusBars = isLightBackground
        }
    }
}
