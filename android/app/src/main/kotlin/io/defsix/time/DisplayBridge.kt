package io.defsix.time

import android.view.WindowManager
import android.webkit.JavascriptInterface

/**
 * JS-facing bridge (window.AndroidDisplayBridge) backing nightstand/bedside
 * mode's "keep the screen on" behavior. This is a native-level backup for
 * the standard Web Wake Lock API the web app uses first; some devices/WebView
 * versions may not honor that, so this guarantees it regardless.
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
}
