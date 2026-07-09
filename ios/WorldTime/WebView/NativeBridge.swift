import Foundation
import UIKit
import UserNotifications
import WebKit

private struct StoredAlarm: Codable {
    let id: String
    let cityLabel: String
    let epochMillis: Double
    let label: String
}

/// Bridges the alarm + display features `nativeBridge.ts` expects
/// (window.webkit.messageHandlers.nativeBridge, wired up via
/// native-bridge-shim.js) to their native iOS equivalents:
///
/// - Local notifications stand in for Android's AlarmManager. There's no
///   "exact alarm" permission concept on iOS — a one-shot
///   UNTimeIntervalNotificationTrigger fires at an absolute instant
///   regardless of time zone, since the JS side already converts the
///   target city's wall-clock time to a UTC epoch before calling in.
/// - UIApplication.isIdleTimerDisabled backs Nightstand mode's keep-awake,
///   mirroring Android's FLAG_KEEP_SCREEN_ON.
/// - WebViewController.preferredStatusBarStyle backs the status-bar-
///   matches-page-theme behavior Android also has.
///
/// Scheduled alarms are persisted in UserDefaults (mirroring Android's
/// AlarmStore) purely so listAlarms() can enumerate what's pending —
/// UNUserNotificationCenter has its own OS-level persistence across
/// relaunches/reboots for the actual notification firing, so unlike
/// Android there's no BootReceiver-style rescheduling needed.
final class NativeBridge: NSObject, WKScriptMessageHandler, UNUserNotificationCenterDelegate {
    static let messageHandlerName = "nativeBridge"
    private static let alarmsDefaultsKey = "io.defsix.time.cityAlarms"

    private weak var webView: WKWebView?
    weak var statusBarDelegate: WebViewController?

    override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
    }

    func attach(to webView: WKWebView) {
        self.webView = webView
    }

    // MARK: - WKScriptMessageHandler

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == Self.messageHandlerName,
              let body = message.body as? [String: Any],
              let requestID = (body["id"] as? NSNumber)?.intValue,
              let method = body["method"] as? String
        else { return }
        let args = body["args"] as? [Any] ?? []

        switch method {
        case "hasNotificationPermission":
            UNUserNotificationCenter.current().getNotificationSettings { settings in
                self.resolve(requestID, settings.authorizationStatus == .authorized)
            }
        case "requestNotificationPermission":
            UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { granted, _ in
                self.resolve(requestID, granted)
            }
        case "hasExactAlarmPermission":
            resolve(requestID, true)
        case "requestExactAlarmPermission":
            resolve(requestID, NSNull())
        case "scheduleAlarm":
            scheduleAlarm(requestID: requestID, args: args)
        case "cancelAlarm":
            cancelAlarm(requestID: requestID, args: args)
        case "listAlarms":
            resolve(requestID, encodeAlarms(loadAlarms()))
        case "setKeepScreenOn":
            let on = (args.first as? Bool) ?? false
            DispatchQueue.main.async { UIApplication.shared.isIdleTimerDisabled = on }
            resolve(requestID, NSNull())
        case "setStatusBarAppearance":
            let isLightBackground = (args.first as? Bool) ?? true
            DispatchQueue.main.async { self.statusBarDelegate?.setStatusBarAppearance(isLightBackground: isLightBackground) }
            resolve(requestID, NSNull())
        default:
            reject(requestID, message: "Unknown method \(method)")
        }
    }

    // MARK: - Foreground presentation

    /// Without this, a notification whose trigger fires while the app is
    /// already in the foreground is silently dropped instead of shown.
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .list])
    }

    // MARK: - Alarm scheduling

    private func scheduleAlarm(requestID: Int, args: [Any]) {
        guard args.count >= 4,
              let alarmID = args[0] as? String,
              let cityLabel = args[1] as? String,
              let epochMillis = (args[2] as? NSNumber)?.doubleValue,
              let label = args[3] as? String
        else {
            reject(requestID, message: "Invalid scheduleAlarm arguments")
            return
        }

        UNUserNotificationCenter.current().getNotificationSettings { [weak self] settings in
            guard let self else { return }
            guard settings.authorizationStatus == .authorized else {
                self.resolve(requestID, "needs_notification_permission")
                return
            }

            let content = UNMutableNotificationContent()
            content.title = "Alarm — \(label)"
            content.body = "It's time (\(cityLabel))."
            content.sound = .default
            content.userInfo = ["alarmId": alarmID]

            let interval = max((epochMillis / 1000) - Date().timeIntervalSince1970, 1)
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false)
            let request = UNNotificationRequest(identifier: alarmID, content: content, trigger: trigger)

            UNUserNotificationCenter.current().add(request) { _ in }

            var alarms = self.loadAlarms()
            alarms.removeAll { $0.id == alarmID }
            alarms.append(StoredAlarm(id: alarmID, cityLabel: cityLabel, epochMillis: epochMillis, label: label))
            self.saveAlarms(alarms)

            self.resolve(requestID, "ok")
        }
    }

    private func cancelAlarm(requestID: Int, args: [Any]) {
        guard let alarmID = args.first as? String else {
            reject(requestID, message: "Invalid cancelAlarm arguments")
            return
        }
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [alarmID])
        var alarms = loadAlarms()
        alarms.removeAll { $0.id == alarmID }
        saveAlarms(alarms)
        resolve(requestID, NSNull())
    }

    // MARK: - Persistence

    private func loadAlarms() -> [StoredAlarm] {
        guard let data = UserDefaults.standard.data(forKey: Self.alarmsDefaultsKey),
              let alarms = try? JSONDecoder().decode([StoredAlarm].self, from: data)
        else { return [] }
        return alarms
    }

    private func saveAlarms(_ alarms: [StoredAlarm]) {
        guard let data = try? JSONEncoder().encode(alarms) else { return }
        UserDefaults.standard.set(data, forKey: Self.alarmsDefaultsKey)
    }

    private func encodeAlarms(_ alarms: [StoredAlarm]) -> [[String: Any]] {
        alarms.map {
            ["id": $0.id, "cityLabel": $0.cityLabel, "epochMillis": $0.epochMillis, "label": $0.label]
        }
    }

    // MARK: - JS callback plumbing

    private func resolve(_ requestID: Int, _ value: Any) {
        respond(requestID, resultJSON: jsonLiteral(for: value), errorMessage: nil)
    }

    private func reject(_ requestID: Int, message: String) {
        respond(requestID, resultJSON: nil, errorMessage: message)
    }

    private func respond(_ requestID: Int, resultJSON: String?, errorMessage: String?) {
        DispatchQueue.main.async {
            if let errorMessage {
                let escaped = errorMessage.replacingOccurrences(of: "\"", with: "\\\"")
                self.webView?.evaluateJavaScript("window.__worldTimeBridgeReject(\(requestID), \"\(escaped)\")")
            } else {
                self.webView?.evaluateJavaScript("window.__worldTimeBridgeResolve(\(requestID), \(resultJSON ?? "null"))")
            }
        }
    }

    /// JSONSerialization only accepts a top-level array or dictionary, so
    /// bools/strings (valid results for several bridge methods) are handled
    /// by hand rather than routed through it.
    private func jsonLiteral(for value: Any) -> String {
        switch value {
        case is NSNull:
            return "null"
        case let bool as Bool:
            return bool ? "true" : "false"
        case let string as String:
            guard let data = try? JSONSerialization.data(withJSONObject: [string]),
                  let arrayJSON = String(data: data, encoding: .utf8)
            else { return "null" }
            return String(arrayJSON.dropFirst().dropLast())
        default:
            guard JSONSerialization.isValidJSONObject(value),
                  let data = try? JSONSerialization.data(withJSONObject: value),
                  let json = String(data: data, encoding: .utf8)
            else { return "null" }
            return json
        }
    }
}
