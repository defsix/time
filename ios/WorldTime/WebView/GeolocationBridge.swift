import CoreLocation
import WebKit

/// Bridges `navigator.geolocation.getCurrentPosition()` calls made by the web
/// app (see geolocation-shim.js, injected as a WKUserScript) to native
/// CoreLocation. WKWebView has no built-in Geolocation Web API support, so
/// this replaces it end to end: JS posts a request tagged with an id, and
/// this resolves or rejects that id by calling back into JS once
/// CoreLocation responds.
final class GeolocationBridge: NSObject, WKScriptMessageHandler, CLLocationManagerDelegate {
    static let messageHandlerName = "geolocationBridge"

    private let locationManager = CLLocationManager()
    private var pendingRequestIDs: [Int] = []
    private weak var webView: WKWebView?

    override init() {
        super.init()
        locationManager.delegate = self
    }

    func attach(to webView: WKWebView) {
        self.webView = webView
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == Self.messageHandlerName,
              let body = message.body as? [String: Any],
              let requestID = (body["id"] as? NSNumber)?.intValue
        else { return }

        switch locationManager.authorizationStatus {
        case .denied, .restricted:
            reject(requestID, code: 1, message: "Location permission denied")
        case .notDetermined:
            pendingRequestIDs.append(requestID)
            locationManager.requestWhenInUseAuthorization()
        default:
            pendingRequestIDs.append(requestID)
            locationManager.requestLocation()
        }
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            if !pendingRequestIDs.isEmpty {
                manager.requestLocation()
            }
        case .denied, .restricted:
            rejectAllPending(code: 1, message: "Location permission denied")
        default:
            break
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        resolveAllPending(location: location)
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        rejectAllPending(code: 2, message: error.localizedDescription)
    }

    private func resolveAllPending(location: CLLocation) {
        let ids = pendingRequestIDs
        pendingRequestIDs.removeAll()
        for id in ids {
            let js = "window.__worldTimeResolveGeolocation(\(id), \(location.coordinate.latitude), \(location.coordinate.longitude), \(max(location.horizontalAccuracy, 0)))"
            webView?.evaluateJavaScript(js)
        }
    }

    private func rejectAllPending(code: Int, message: String) {
        let ids = pendingRequestIDs
        pendingRequestIDs.removeAll()
        for id in ids {
            reject(id, code: code, message: message)
        }
    }

    private func reject(_ requestID: Int, code: Int, message: String) {
        let escaped = message.replacingOccurrences(of: "\"", with: "\\\"")
        let js = "window.__worldTimeRejectGeolocation(\(requestID), \(code), \"\(escaped)\")"
        webView?.evaluateJavaScript(js)
    }
}
