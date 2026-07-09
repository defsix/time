// WKWebView has no synchronous JS<->native call mechanism (unlike Android's
// WebView.addJavascriptInterface, whose methods can return a value
// directly) — see src/lib/nativeBridge.ts, which treats both platforms
// through one Promise-based API. This shim turns every call into a
// postMessage tagged with a request id, later resolved/rejected by
// NativeBridge.swift via window.__worldTimeBridgeResolve/Reject. Injected
// as a WKUserScript at document start, before the web app's own code runs.
(function () {
  if (!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.nativeBridge)) {
    return;
  }

  var pending = {};
  var nextId = 1;

  window.__worldTimeBridgeResolve = function (id, value) {
    var entry = pending[id];
    if (!entry) return;
    delete pending[id];
    entry.resolve(value);
  };

  window.__worldTimeBridgeReject = function (id, message) {
    var entry = pending[id];
    if (!entry) return;
    delete pending[id];
    entry.reject(new Error(message));
  };

  window.__worldTimeIOSBridge = function (method, args) {
    return new Promise(function (resolve, reject) {
      var id = nextId++;
      pending[id] = { resolve: resolve, reject: reject };
      window.webkit.messageHandlers.nativeBridge.postMessage({ id: id, method: method, args: args || [] });
    });
  };
})();
