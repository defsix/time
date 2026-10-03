import UIKit
import WebKit

/// Hosts the WKWebView inside a plain UIViewController rather than handing
/// it directly to SwiftUI, so the status bar's icon color can be driven by
/// the web app's own theme (see NativeBridge.setStatusBarAppearance) via
/// `preferredStatusBarStyle`, the same problem the Android app solves with
/// its edge-to-edge + WindowInsetsController bridge.
final class WebViewController: UIViewController, WKNavigationDelegate {
    let webView: WKWebView
    private var preferLightContent = true

    override var preferredStatusBarStyle: UIStatusBarStyle {
        preferLightContent ? .darkContent : .lightContent
    }

    init(webView: WKWebView) {
        self.webView = webView
        super.init(nibName: nil, bundle: nil)
        webView.navigationDelegate = self
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        webView.frame = view.bounds
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(webView)
    }

    /// - Parameter isLightBackground: true when the page's current
    ///   background is light (so the status bar needs dark icons).
    func setStatusBarAppearance(isLightBackground: Bool) {
        preferLightContent = isLightBackground
        setNeedsStatusBarAppearanceUpdate()
    }

    // MARK: - WKNavigationDelegate

    /// The native bridges and injected shims are available to whatever page
    /// this web view shows, so it must only ever show the bundled app: any
    /// other navigation (in any frame) is cancelled, and an http(s) link the
    /// user actually tapped opens in Safari instead.
    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }
        if LocalSchemeHandler.isAppURL(url) {
            decisionHandler(.allow)
            return
        }
        if navigationAction.navigationType == .linkActivated,
           navigationAction.targetFrame?.isMainFrame ?? true,
           url.scheme == "https" || url.scheme == "http" {
            UIApplication.shared.open(url)
        }
        decisionHandler(.cancel)
    }
}
