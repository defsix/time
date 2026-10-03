import WebKit

/// Serves the bundled web app (WorldTime/Resources/www, synced from the repo
/// root's web app build) under a custom `app://` scheme rather than `file://`.
/// The time-sync APIs the web app calls are cross-origin fetches, and some
/// CORS configurations special-case and reject the `Origin: null` header
/// that `file://` pages send even when they otherwise allow `*`. A custom
/// scheme gives those fetches a stable, non-null origin instead — the same
/// reason the Android build serves its bundled assets over a synthetic
/// https origin (WebViewAssetLoader) rather than `file://`.
final class LocalSchemeHandler: NSObject, WKURLSchemeHandler {
    static let scheme = "app"
    static let host = "local"

    /// Whether a URL belongs to the bundled app (app://local/...).
    static func isAppURL(_ url: URL) -> Bool {
        url.scheme == scheme && url.host == host
    }

    /// Whether a script message came from the bundled app's own top-level
    /// page. WKScriptMessageHandlers are reachable from every frame of every
    /// page the web view shows, so the native bridges check this before
    /// acting on (or answering) any message.
    static func isAppFrame(_ frame: WKFrameInfo) -> Bool {
        guard frame.isMainFrame, let url = frame.request.url else { return false }
        return isAppURL(url)
    }

    /// Maps a request path to a file inside `root`, or nil if it would land
    /// outside it. `URL.path` percent-decodes, so a request for
    /// `app://local/..%2F..%2Fsomething` arrives here as `/../../something` —
    /// without this check it could read any file the app's sandbox can.
    /// `root` must already be standardized and symlink-resolved.
    static func resolveFile(requestPath: String, in root: URL) -> URL? {
        let relativePath = requestPath.isEmpty || requestPath == "/" ? "index.html" : String(requestPath.dropFirst())
        let candidate = root.appendingPathComponent(relativePath).standardizedFileURL.resolvingSymlinksInPath()
        guard candidate.path.hasPrefix(root.path + "/") else { return nil }
        return candidate
    }

    private let wwwDirectory: URL
    private let queue = DispatchQueue(label: "io.defsix.time.local-scheme-handler")
    /// Tasks WebKit has started and not yet stopped. Only touched on the main
    /// thread — where WebKit calls start/stop — and every WKURLSchemeTask
    /// call is made there too, after checking membership: calling one on a
    /// task WebKit has already stopped raises an exception (an app crash).
    private var activeTasks = Set<ObjectIdentifier>()

    override init() {
        guard let resourceURL = Bundle.main.resourceURL else {
            fatalError("Bundle has no resourceURL")
        }
        // Resolved once so containment checks compare like with like (on
        // device the bundle lives under /var, a symlink to /private/var).
        wwwDirectory = resourceURL.appendingPathComponent("www", isDirectory: true)
            .standardizedFileURL.resolvingSymlinksInPath()
        super.init()
    }

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let requestURL = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(URLError(.badURL))
            return
        }
        let taskID = ObjectIdentifier(urlSchemeTask)
        activeTasks.insert(taskID)

        queue.async { [self] in
            let fileURL = Self.resolveFile(requestPath: requestURL.path, in: wwwDirectory)
            let data = fileURL.flatMap { try? Data(contentsOf: $0) }

            DispatchQueue.main.async { [self] in
                guard activeTasks.remove(taskID) != nil else { return }
                guard let fileURL, let data else {
                    urlSchemeTask.didFailWithError(URLError(.fileDoesNotExist))
                    return
                }
                let response = URLResponse(
                    url: requestURL,
                    mimeType: mimeType(for: fileURL.pathExtension),
                    expectedContentLength: data.count,
                    textEncodingName: "utf-8"
                )
                urlSchemeTask.didReceive(response)
                urlSchemeTask.didReceive(data)
                urlSchemeTask.didFinish()
            }
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        activeTasks.remove(ObjectIdentifier(urlSchemeTask))
    }

    private func mimeType(for pathExtension: String) -> String {
        switch pathExtension.lowercased() {
        case "html": return "text/html"
        case "js", "mjs": return "application/javascript"
        case "css": return "text/css"
        case "json": return "application/json"
        case "svg": return "image/svg+xml"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "webp": return "image/webp"
        case "woff": return "font/woff"
        case "woff2": return "font/woff2"
        case "ico": return "image/x-icon"
        default: return "application/octet-stream"
        }
    }
}
