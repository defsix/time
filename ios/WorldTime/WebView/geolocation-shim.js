// WKWebView has no built-in Geolocation Web API (unlike Android's WebView),
// so this replaces `navigator.geolocation` with a shim that forwards
// getCurrentPosition() calls to the native GeolocationBridge over
// window.webkit.messageHandlers, and exposes two callbacks the native side
// invokes once CoreLocation responds. Injected as a WKUserScript at
// document start, before the web app's own code runs.
(function () {
  if (!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.geolocationBridge)) {
    return;
  }

  var pending = {};
  var nextId = 1;

  window.__worldTimeResolveGeolocation = function (id, latitude, longitude, accuracy) {
    var entry = pending[id];
    if (!entry) return;
    delete pending[id];
    entry.success({
      coords: {
        latitude: latitude,
        longitude: longitude,
        accuracy: accuracy,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    });
  };

  window.__worldTimeRejectGeolocation = function (id, code, message) {
    var entry = pending[id];
    if (!entry) return;
    delete pending[id];
    if (entry.error) {
      entry.error({ code: code, message: message });
    }
  };

  var geolocation = {
    getCurrentPosition: function (success, error, options) {
      var id = nextId++;
      pending[id] = { success: success, error: error };
      window.webkit.messageHandlers.geolocationBridge.postMessage({
        id: id,
        timeout: (options && options.timeout) || 8000,
      });
    },
    watchPosition: function (success, error) {
      if (error) error({ code: 2, message: 'watchPosition is not supported' });
      return -1;
    },
    clearWatch: function () {},
  };

  Object.defineProperty(navigator, 'geolocation', {
    value: geolocation,
    configurable: true,
  });
})();
