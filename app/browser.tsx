import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  BackHandler,
  Alert,
  Animated,
} from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getBlockedDomains, isDomainBlocked } from "../services/domainService";

// ─── Injected JS: detect & kill incognito tabs inside WebView ─────────────────
const INJECTED_JS = `
(function() {
  // Intercept navigator.connection / userAgentData for incognito hints
  var title = document.title || "";
  var url = window.location.href || "";
  var incognitoHints = ["incognito", "private", "privatebrowsing", "inprivate"];
  var found = incognitoHints.some(function(h) {
    return title.toLowerCase().includes(h) || url.toLowerCase().includes(h);
  });
  if (found) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: "INCOGNITO_DETECTED", url: url }));
  }
  true;
})();
`;

export default function BrowserScreen() {
  const { url: initialUrl } = useLocalSearchParams<{ url: string }>();
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);

  const [currentUrl, setCurrentUrl] = useState(initialUrl ?? "https://www.google.com");
  const [urlBar, setUrlBar] = useState(initialUrl ?? "https://www.google.com");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState("");
  const [blockedList, setBlockedList] = useState<string[]>([]);
  const [editingUrl, setEditingUrl] = useState(false);

  const blockAnim = useRef(new Animated.Value(0)).current;

  // Load blocked domains once
  useEffect(() => {
    getBlockedDomains().then(setBlockedList);
  }, []);

  // Hardware back button
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (blocked) { setBlocked(false); return true; }
      if (canGoBack) { webRef.current?.goBack(); return true; }
      router.back();
      return true;
    });
    return () => sub.remove();
  }, [canGoBack, blocked]);

  function showBlockScreen(reason: string) {
    setBlocked(true);
    setBlockedReason(reason);
    blockAnim.setValue(0);
    Animated.spring(blockAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  }

  /** Called before every navigation — blocks or allows */
  function onShouldStartLoad(req: WebViewNavigation): boolean {
    const url = req.url;

    // Block incognito/private pages
    if (
      url.toLowerCase().includes("incognito") ||
      url.toLowerCase().includes("private") ||
      url.toLowerCase().includes("inprivate")
    ) {
      showBlockScreen("Incognito / Private mode is not allowed.");
      return false;
    }

    // Block adult content
    if (isDomainBlocked(url, blockedList)) {
      showBlockScreen(`This website is blocked by Guardian.\n\n"${url.split("/")[2] ?? url}"`);
      return false;
    }

    return true;
  }

  function onNavigationStateChange(nav: WebViewNavigation) {
    setCanGoBack(nav.canGoBack);
    setCanGoForward(nav.canGoForward);
    setCurrentUrl(nav.url);
    if (!editingUrl) setUrlBar(nav.url);
  }

  function onMessage(event: { nativeEvent: { data: string } }) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "INCOGNITO_DETECTED") {
        showBlockScreen("Incognito / Private mode is not allowed.");
        webRef.current?.stopLoading();
      }
    } catch {}
  }

  function navigate(url: string) {
    const finalUrl =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;

    // Pre-check before even loading
    if (isDomainBlocked(finalUrl, blockedList)) {
      showBlockScreen(`This website is blocked by Guardian.\n\n"${finalUrl.split("/")[2] ?? finalUrl}"`);
      return;
    }

    setBlocked(false);
    setCurrentUrl(finalUrl);
    setUrlBar(finalUrl);
    setEditingUrl(false);
  }

  const progressWidth = `${Math.round(progress * 100)}%` as any;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <View style={s.topBar}>
        <TouchableOpacity
          style={s.navBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={s.navIcon}>🏠</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.navBtn}
          onPress={() => canGoBack && webRef.current?.goBack()}
          activeOpacity={canGoBack ? 0.7 : 0.3}
        >
          <Text style={[s.navIcon, !canGoBack && s.navDisabled]}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.urlBar, editingUrl && s.urlBarFocused]}
          onPress={() => setEditingUrl(true)}
          activeOpacity={0.8}
        >
          <Text style={s.lockIcon}>🔒</Text>
          {editingUrl ? (
            <TextInput
              style={s.urlInput}
              value={urlBar}
              onChangeText={setUrlBar}
              onSubmitEditing={() => navigate(urlBar)}
              onBlur={() => {
                setEditingUrl(false);
                setUrlBar(currentUrl);
              }}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              selectionColor="#6366f1"
            />
          ) : (
            <Text style={s.urlText} numberOfLines={1}>
              {currentUrl.replace(/^https?:\/\//, "").replace(/^www\./, "")}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={s.navBtn}
          onPress={() => webRef.current?.reload()}
          activeOpacity={0.7}
        >
          <Text style={s.navIcon}>↻</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.navBtn}
          onPress={() => canGoForward && webRef.current?.goForward()}
          activeOpacity={canGoForward ? 0.7 : 0.3}
        >
          <Text style={[s.navIcon, !canGoForward && s.navDisabled]}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      {loading && (
        <View style={s.progressTrack}>
          <View style={[s.progressBar, { width: progressWidth }]} />
        </View>
      )}

      {/* ── WebView ─────────────────────────────────────────── */}
      {!blocked && (
        <WebView
          ref={webRef}
          source={{ uri: currentUrl }}
          style={s.webview}
          onShouldStartLoadWithRequest={onShouldStartLoad}
          onNavigationStateChange={onNavigationStateChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
          onMessage={onMessage}
          injectedJavaScript={INJECTED_JS}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsBackForwardNavigationGestures={false}
          incognito={false}               // Force non-incognito mode
          thirdPartyCookiesEnabled={false}
          renderLoading={() => (
            <View style={s.loadingWrap}>
              <ActivityIndicator color="#6366f1" size="large" />
            </View>
          )}
          startInLoadingState={true}
        />
      )}

      {/* ── BLOCK SCREEN ────────────────────────────────────── */}
      {blocked && (
        <Animated.View
          style={[
            s.blockScreen,
            {
              opacity: blockAnim,
              transform: [
                {
                  scale: blockAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={s.blockIconWrap}>
            <Text style={s.blockIcon}>🚫</Text>
          </View>
          <Text style={s.blockTitle}>Access Blocked</Text>
          <Text style={s.blockMsg}>{blockedReason}</Text>
          <Text style={s.blockSub}>
            This content is restricted by Guardian Parental Controls.
          </Text>

          <TouchableOpacity
            style={s.blockBtn}
            onPress={() => {
              setBlocked(false);
              router.back();
            }}
            activeOpacity={0.8}
          >
            <Text style={s.blockBtnText}>← Go Back Home</Text>
          </TouchableOpacity>

          <View style={s.blockBadge}>
            <Text style={s.blockBadgeText}>🛡️ Guardian Protection Active</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    backgroundColor: "#13131f",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  navIcon: { fontSize: 18, color: "#fff" },
  navDisabled: { opacity: 0.3 },

  urlBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  urlBarFocused: {
    borderColor: "#6366f1",
    backgroundColor: "rgba(99,102,241,0.1)",
  },
  lockIcon: { fontSize: 12 },
  urlText: { flex: 1, color: "rgba(255,255,255,0.7)", fontSize: 13 },
  urlInput: { flex: 1, color: "#fff", fontSize: 13, padding: 0 },

  progressTrack: {
    height: 2,
    backgroundColor: "rgba(99,102,241,0.2)",
  },
  progressBar: {
    height: 2,
    backgroundColor: "#6366f1",
  },

  webview: { flex: 1 },
  loadingWrap: {
    flex: 1,
    backgroundColor: "#0f0f1a",
    alignItems: "center",
    justifyContent: "center",
  },

  // Block screen
  blockScreen: {
    flex: 1,
    backgroundColor: "#0f0f1a",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  blockIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(239,68,68,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(239,68,68,0.3)",
  },
  blockIcon: { fontSize: 48 },
  blockTitle: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  blockMsg: {
    fontSize: 14,
    color: "rgba(239,68,68,0.9)",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 22,
  },
  blockSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    marginBottom: 36,
    lineHeight: 20,
  },
  blockBtn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 24,
  },
  blockBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  blockBadge: {
    backgroundColor: "rgba(99,102,241,0.12)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.25)",
  },
  blockBadgeText: { color: "rgba(99,102,241,0.9)", fontSize: 12, fontWeight: "600" },
});
