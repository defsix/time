# The web app calls into AlarmBridge/DisplayBridge (see MainActivity's
# addJavascriptInterface calls) through WebView's reflection-based JS
# interface — R8 must not rename or strip those classes/methods, or the web
# app's calls into window.AndroidAlarmBridge/AndroidDisplayBridge silently
# stop working with no compile-time error to catch it.
-keepattributes JavascriptInterface
-keepclassmembers class io.defsix.time.alarm.AlarmBridge {
    public *;
}
-keepclassmembers class io.defsix.time.DisplayBridge {
    public *;
}
