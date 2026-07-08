package io.defsix.time

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.webkit.GeolocationPermissions
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewAssetLoader.AssetsPathHandler
import io.defsix.time.alarm.AlarmBridge

/**
 * Hosts the existing World Time web app (Three.js globe, city search, time
 * sync, sun/moon panel) in a WebView. All product logic lives in the web app
 * under src/main/assets/www (synced from the repo root's dist-android build);
 * this activity is just the native shell: permissions, back navigation, and
 * serving the bundled assets over WebViewAssetLoader.DEFAULT_DOMAIN
 * (appassets.androidplatform.net) so fetch()/CORS behave the same as they do
 * on the deployed site.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader
    private var pendingGeolocationOrigin: String? = null
    private var pendingGeolocationCallback: GeolocationPermissions.Callback? = null
    private var pendingNotificationPermissionCallback: ((Boolean) -> Unit)? = null

    private val locationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            val origin = pendingGeolocationOrigin
            val callback = pendingGeolocationCallback
            if (origin != null && callback != null) {
                callback.invoke(origin, granted, false)
            }
            pendingGeolocationOrigin = null
            pendingGeolocationCallback = null
        }

    private val notificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            pendingNotificationPermissionCallback?.invoke(granted)
            pendingNotificationPermissionCallback = null
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", AssetsPathHandler(this))
            .build()

        webView = findViewById(R.id.webView)
        configureWebView(webView)

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            webView.loadUrl("https://${WebViewAssetLoader.DEFAULT_DOMAIN}/assets/www/index.html")
        }
    }

    private fun configureWebView(webView: WebView) {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.setGeolocationEnabled(true)
        settings.cacheMode = android.webkit.WebSettings.LOAD_DEFAULT

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)
        }

        webView.addJavascriptInterface(AlarmBridge(this, webView), "AndroidAlarmBridge")
        webView.addJavascriptInterface(DisplayBridge(this), "AndroidDisplayBridge")

        webView.webChromeClient = object : WebChromeClient() {
            override fun onGeolocationPermissionsShowPrompt(
                origin: String,
                callback: GeolocationPermissions.Callback
            ) {
                if (hasLocationPermission()) {
                    callback.invoke(origin, true, false)
                } else {
                    pendingGeolocationOrigin = origin
                    pendingGeolocationCallback = callback
                    locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
                }
            }

            override fun onConsoleMessage(message: android.webkit.ConsoleMessage): Boolean {
                Log.d("WorldTimeWebView", "${message.message()} (${message.sourceId()}:${message.lineNumber()})")
                return true
            }
        }
    }

    private fun hasLocationPermission(): Boolean =
        ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED

    /** Called from AlarmBridge, which runs on WebView's background thread. */
    fun requestNotificationPermission(callback: (Boolean) -> Unit) {
        runOnUiThread {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
                // No runtime permission pre-33 — reflects the user's app
                // notification settings toggle instead.
                callback(NotificationManagerCompat.from(this).areNotificationsEnabled())
                return@runOnUiThread
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) ==
                PackageManager.PERMISSION_GRANTED
            ) {
                callback(true)
                return@runOnUiThread
            }
            pendingNotificationPermissionCallback = callback
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
