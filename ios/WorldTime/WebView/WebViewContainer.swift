import SwiftUI
import WebKit

/// Hosts the World Time web app (Three.js globe, city search, time sync,
/// Sun & Moon panel) in a full-screen WKWebView. All product logic lives in
/// the web app under WorldTime/Resources/www (synced from the repo root's
/// `npm run build:ios`); this is just the native shell around it.
struct WebViewContainer: UIViewRepresentable {
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.setURLSchemeHandler(context.coordinator.schemeHandler, forURLScheme: LocalSchemeHandler.scheme)
        configuration.allowsInlineMediaPlayback = true

        let userContentController = WKUserContentController()
        userContentController.add(context.coordinator.geolocationBridge, name: GeolocationBridge.messageHandlerName)
        if let shimURL = Bundle.main.url(forResource: "geolocation-shim", withExtension: "js"),
           let shimSource = try? String(contentsOf: shimURL, encoding: .utf8) {
            let script = WKUserScript(source: shimSource, injectionTime: .atDocumentStart, forMainFrameOnly: true)
            userContentController.addUserScript(script)
        }
        configuration.userContentController = userContentController

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.isOpaque = true
        webView.backgroundColor = UIColor(named: "LaunchBackground")
        webView.scrollView.bounces = false
        webView.allowsBackForwardNavigationGestures = true
        context.coordinator.geolocationBridge.attach(to: webView)

        let url = URL(string: "\(LocalSchemeHandler.scheme)://\(LocalSchemeHandler.host)/index.html")!
        webView.load(URLRequest(url: url))

        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator {
        let schemeHandler = LocalSchemeHandler()
        let geolocationBridge = GeolocationBridge()
    }
}
