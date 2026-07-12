package io.defsix.time

import android.os.Handler
import android.os.Looper
import android.service.dreams.DreamService
import android.util.Log
import android.view.GestureDetector
import android.view.MotionEvent
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewAssetLoader.AssetsPathHandler

/**
 * System Daydream (Settings > Display > Screen saver) hosting the same
 * globe as MainActivity, for use on a nightstand/dock. Registered in the
 * manifest with the android.service.dreams.DreamService intent-filter; the
 * OS decides when to start/stop it (idle while charging/docked, or "Start
 * now" in Settings), not the app itself.
 *
 * isInteractive = true, so single taps/drags reach the WebView normally
 * (rotating the globe doesn't exit the dream) — only a double tap calls
 * finish() to exit, since a single accidental touch shouldn't kick the user
 * back to the lock screen.
 *
 * Deliberately does not wire up AlarmBridge or geolocation prompts: this is
 * a passive display surface, not a place to schedule alarms or show a
 * permission dialog from.
 */
class WorldTimeDreamService : DreamService() {

    private lateinit var webView: WebView
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()

        isInteractive = true
        isFullscreen = true

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", AssetsPathHandler(this))
            .build()

        webView = WebView(this)
        configureWebView(webView, assetLoader)

        val gestureDetector = GestureDetector(
            this,
            object : GestureDetector.SimpleOnGestureListener() {
                override fun onDoubleTap(e: MotionEvent): Boolean {
                    finish()
                    return true
                }
            },
        )

        // Peeks at every touch to detect the double-tap-to-exit gesture,
        // then always forwards the event on to the WebView underneath via
        // the super call — this must never consume/short-circuit dispatch,
        // or single taps and drags on the globe would stop working.
        val root = object : FrameLayout(this) {
            override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
                gestureDetector.onTouchEvent(ev)
                return super.dispatchTouchEvent(ev)
            }
        }
        root.addView(
            webView,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
            ),
        )

        setContentView(root)
        webView.loadUrl("https://${WebViewAssetLoader.DEFAULT_DOMAIN}/assets/www/index.html")
    }

    private fun configureWebView(webView: WebView, assetLoader: WebViewAssetLoader) {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest,
            ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)
        }

        webView.addJavascriptInterface(
            DisplayBridge(window, mainHandler::post),
            "AndroidDisplayBridge",
        )

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(message: ConsoleMessage): Boolean {
                Log.d(
                    "WorldTimeDream",
                    "${message.message()} (${message.sourceId()}:${message.lineNumber()})",
                )
                return true
            }
        }
    }

    override fun onDetachedFromWindow() {
        webView.destroy()
        super.onDetachedFromWindow()
    }
}
