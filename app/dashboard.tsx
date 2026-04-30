import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const QUICK_LINKS = [
  { label: "Google", url: "https://www.google.com", icon: "🔍" },
  { label: "YouTube", url: "https://www.youtube.com", icon: "▶️" },
  { label: "Wikipedia", url: "https://www.wikipedia.org", icon: "📖" },
  { label: "Khan Academy", url: "https://www.khanacademy.org", icon: "🎓" },
  { label: "BBC News", url: "https://www.bbc.com/news", icon: "📰" },
  { label: "GitHub", url: "https://www.github.com", icon: "💻" },
];

export default function Dashboard() {
  const [urlInput, setUrlInput] = useState("");
  const insets = useSafeAreaInsets();

  function navigateTo(url: string) {
    const finalUrl =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
    router.push({ pathname: "/browser", params: { url: finalUrl } });
  }

  function handleGo() {
    if (!urlInput.trim()) return;
    navigateTo(urlInput.trim());
    setUrlInput("");
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Decorative blobs */}
      <View style={s.blob1} />
      <View style={s.blob2} />

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.logo}>🛡️</Text>
          <View>
            <Text style={s.appName}>Guardian</Text>
            <Text style={s.appSub}>Safe Browser</Text>
          </View>
        </View>
        <TouchableOpacity
          style={s.settingsBtn}
          onPress={() => router.push("/settings")}
          activeOpacity={0.7}
        >
          <Text style={s.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* URL Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.searchWrap}
      >
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🌐</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Enter website address..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={urlInput}
            onChangeText={setUrlInput}
            onSubmitEditing={handleGo}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            selectionColor="#6366f1"
          />
          {urlInput.length > 0 && (
            <TouchableOpacity onPress={handleGo} style={s.goBtn} activeOpacity={0.8}>
              <Text style={s.goBtnText}>Go</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Quick Links */}
      <Text style={s.sectionTitle}>Quick Links</Text>
      <ScrollView
        contentContainerStyle={s.grid}
        showsVerticalScrollIndicator={false}
      >
        {QUICK_LINKS.map((item) => (
          <TouchableOpacity
            key={item.url}
            style={s.card}
            onPress={() => navigateTo(item.url)}
            activeOpacity={0.75}
          >
            <Text style={s.cardIcon}>{item.icon}</Text>
            <Text style={s.cardLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}

        {/* Status card */}
        <View style={[s.card, s.statusCard]}>
          <Text style={s.cardIcon}>🔒</Text>
          <Text style={s.cardLabel}>Protected</Text>
          <Text style={s.statusSub}>All filters active</Text>
        </View>
      </ScrollView>

      {/* Bottom status strip */}
      <View style={[s.statusStrip, { paddingBottom: insets.bottom + 8 }]}>
        <View style={s.statusDot} />
        <Text style={s.statusText}>Guardian is active — adult content blocked</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },

  blob1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(99,102,241,0.07)",
    top: -80,
    right: -80,
  },
  blob2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(139,92,246,0.05)",
    bottom: 100,
    left: -60,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { fontSize: 36 },
  appName: { color: "#fff", fontSize: 20, fontWeight: "700", letterSpacing: 0.5 },
  appSub: { color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 1 },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  settingsIcon: { fontSize: 20 },

  searchWrap: { paddingHorizontal: 20, marginBottom: 24 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    paddingVertical: 12,
  },
  goBtn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  goBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  sectionTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginLeft: 20,
    marginBottom: 14,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 12,
    paddingBottom: 80,
  },
  card: {
    width: "46%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 18,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  statusCard: {
    borderColor: "rgba(34,197,94,0.3)",
    backgroundColor: "rgba(34,197,94,0.07)",
  },
  cardIcon: { fontSize: 28, marginBottom: 10 },
  cardLabel: { color: "#fff", fontSize: 14, fontWeight: "600" },
  statusSub: { color: "rgba(34,197,94,0.8)", fontSize: 11, marginTop: 3 },

  statusStrip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(34,197,94,0.1)",
    borderTopWidth: 1,
    borderTopColor: "rgba(34,197,94,0.2)",
    paddingTop: 10,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },
  statusText: { color: "rgba(34,197,94,0.9)", fontSize: 12, fontWeight: "500" },
});
