import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Vibration,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { verifyPin, setPin } from "../services/pinService";
import {
  getBlockedDomains,
  addDomain,
  removeDomain,
  resetToDefaults,
} from "../services/domainService";

type Tab = "domains" | "pin";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [pinInput, setPinInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [shake] = useState(new Animated.Value(0));

  // After unlock
  const [tab, setTab] = useState<Tab>("domains");
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");

  // PIN change
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  useEffect(() => {
    if (unlocked) getBlockedDomains().then(setDomains);
  }, [unlocked]);

  function triggerShake() {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

  async function handlePinKey(key: string) {
    if (pinInput.length >= 4) return;
    const next = pinInput + key;
    setPinInput(next);
    if (next.length === 4) {
      const ok = await verifyPin(next);
      if (ok) {
        setUnlocked(true);
      } else {
        Vibration.vibrate(400);
        triggerShake();
        setTimeout(() => setPinInput(""), 500);
        Alert.alert("Wrong PIN", "Incorrect PIN. Try again.");
      }
    }
  }

  function handlePinDel() {
    setPinInput((p) => p.slice(0, -1));
  }

  async function handleAddDomain() {
    if (!newDomain.trim()) return;
    const updated = await addDomain(newDomain.trim());
    setDomains(updated);
    setNewDomain("");
  }

  async function handleRemoveDomain(domain: string) {
    Alert.alert("Remove Domain", `Unblock "${domain}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const updated = await removeDomain(domain);
          setDomains(updated);
        },
      },
    ]);
  }

  async function handleReset() {
    Alert.alert("Reset Blocklist", "Restore all default blocked domains?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          const updated = await resetToDefaults();
          setDomains(updated);
          Alert.alert("Done", "Blocklist restored to defaults.");
        },
      },
    ]);
  }

  async function handleChangePin() {
    if (!oldPin || !newPin || !confirmPin) {
      Alert.alert("Error", "Fill in all PIN fields.");
      return;
    }
    if (newPin.length < 4) {
      Alert.alert("Error", "PIN must be at least 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert("Error", "New PINs do not match.");
      return;
    }
    const ok = await verifyPin(oldPin);
    if (!ok) {
      Alert.alert("Error", "Current PIN is incorrect.");
      return;
    }
    await setPin(newPin);
    setOldPin("");
    setNewPin("");
    setConfirmPin("");
    Alert.alert("✅ Success", "PIN has been changed successfully.");
  }

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  // ── PIN GATE ──────────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.blob1} />

        {/* Header */}
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backIcon}>←</Text>
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>

        <View style={s.gateWrap}>
          <View style={s.gateIconWrap}>
            <Text style={s.gateIcon}>⚙️</Text>
          </View>
          <Text style={s.gateTitle}>Settings</Text>
          <Text style={s.gateSub}>Enter your PIN to unlock settings</Text>

          <Animated.View style={[s.dots, { transform: [{ translateX: shake }] }]}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[s.dot, i < pinInput.length && s.dotFilled]} />
            ))}
          </Animated.View>

          <View style={s.pad}>
            {keys.map((k, i) =>
              k === "" ? (
                <View key={i} style={s.keyEmpty} />
              ) : (
                <TouchableOpacity
                  key={i}
                  style={s.key}
                  onPress={() => (k === "⌫" ? handlePinDel() : handlePinKey(k))}
                  activeOpacity={0.6}
                >
                  <Text style={k === "⌫" ? s.keyDel : s.keyText}>{k}</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      </View>
    );
  }

  // ── SETTINGS CONTENT ─────────────────────────────────────────────────────
  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.blob1} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn2} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={s.unlockedBadge}>
          <Text style={s.unlockedBadgeText}>🔓 Unlocked</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tabBtn, tab === "domains" && s.tabActive]}
          onPress={() => setTab("domains")}
          activeOpacity={0.8}
        >
          <Text style={[s.tabText, tab === "domains" && s.tabTextActive]}>
            🚫 Blocked Sites
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, tab === "pin" && s.tabActive]}
          onPress={() => setTab("pin")}
          activeOpacity={0.8}
        >
          <Text style={[s.tabText, tab === "pin" && s.tabTextActive]}>
            🔑 Change PIN
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "domains" && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Add domain */}
          <View style={s.addRow}>
            <TextInput
              style={s.addInput}
              placeholder="Add domain (e.g. example.com)"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={newDomain}
              onChangeText={setNewDomain}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
              onSubmitEditing={handleAddDomain}
              selectionColor="#6366f1"
            />
            <TouchableOpacity style={s.addBtn} onPress={handleAddDomain} activeOpacity={0.8}>
              <Text style={s.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          <View style={s.listHeader}>
            <Text style={s.listLabel}>{domains.length} blocked domains</Text>
            <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
              <Text style={s.resetText}>↺ Reset to defaults</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
            {domains.map((d) => (
              <View key={d} style={s.domainRow}>
                <View style={s.domainInfo}>
                  <View style={s.domainDot} />
                  <Text style={s.domainText}>{d}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveDomain(d)}
                  style={s.removeBtn}
                  activeOpacity={0.7}
                >
                  <Text style={s.removeIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {tab === "pin" && (
        <ScrollView contentContainerStyle={s.pinContent} showsVerticalScrollIndicator={false}>
          <View style={s.pinCard}>
            <Text style={s.pinCardTitle}>Change your PIN</Text>
            <Text style={s.pinCardSub}>
              Your PIN protects all Guardian settings. Choose something you'll
              remember but others won't guess.
            </Text>

            <Text style={s.pinFieldLabel}>Current PIN</Text>
            <TextInput
              style={s.pinField}
              value={oldPin}
              onChangeText={setOldPin}
              secureTextEntry
              keyboardType="numeric"
              maxLength={8}
              placeholder="••••"
              placeholderTextColor="rgba(255,255,255,0.2)"
              selectionColor="#6366f1"
            />

            <Text style={s.pinFieldLabel}>New PIN</Text>
            <TextInput
              style={s.pinField}
              value={newPin}
              onChangeText={setNewPin}
              secureTextEntry
              keyboardType="numeric"
              maxLength={8}
              placeholder="••••"
              placeholderTextColor="rgba(255,255,255,0.2)"
              selectionColor="#6366f1"
            />

            <Text style={s.pinFieldLabel}>Confirm New PIN</Text>
            <TextInput
              style={s.pinField}
              value={confirmPin}
              onChangeText={setConfirmPin}
              secureTextEntry
              keyboardType="numeric"
              maxLength={8}
              placeholder="••••"
              placeholderTextColor="rgba(255,255,255,0.2)"
              selectionColor="#6366f1"
            />

            <TouchableOpacity style={s.changePinBtn} onPress={handleChangePin} activeOpacity={0.8}>
              <Text style={s.changePinBtnText}>Save New PIN</Text>
            </TouchableOpacity>
          </View>

          <View style={s.warningCard}>
            <Text style={s.warningIcon}>⚠️</Text>
            <Text style={s.warningText}>
              If you forget your PIN, the only way to reset it is to uninstall and reinstall the app. Keep your PIN safe.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
    backgroundColor: "rgba(99,102,241,0.06)",
    top: -60,
    right: -80,
  },

  // Back button (gate)
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 16,
  },
  backIcon: { color: "#a5b4fc", fontSize: 20 },
  backText: { color: "#a5b4fc", fontSize: 15, fontWeight: "500" },

  // Gate
  gateWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  gateIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(99,102,241,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
  },
  gateIcon: { fontSize: 36 },
  gateTitle: { fontSize: 26, color: "#fff", fontWeight: "700", marginBottom: 6 },
  gateSub: { fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 40 },
  dots: { flexDirection: "row", gap: 18, marginBottom: 40 },
  dot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  dotFilled: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  pad: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 234,
    gap: 16,
    justifyContent: "center",
  },
  key: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  keyEmpty: { width: 66, height: 66 },
  keyText: { color: "#fff", fontSize: 24, fontWeight: "300" },
  keyDel: { color: "#a5b4fc", fontSize: 20 },

  // Header (unlocked)
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn2: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, color: "#fff", fontSize: 20, fontWeight: "700" },
  unlockedBadge: {
    backgroundColor: "rgba(34,197,94,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.25)",
  },
  unlockedBadgeText: { color: "rgba(34,197,94,0.9)", fontSize: 12, fontWeight: "600" },

  // Tabs
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#6366f1" },
  tabText: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#fff" },

  // Domain list
  addRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  addInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  addBtn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
  },
  listLabel: { color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "600" },
  resetText: { color: "#a5b4fc", fontSize: 12, fontWeight: "600" },

  listContent: { paddingHorizontal: 16 },
  domainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  domainInfo: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  domainDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ef4444" },
  domainText: { color: "rgba(255,255,255,0.75)", fontSize: 14, flex: 1 },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(239,68,68,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeIcon: { color: "#ef4444", fontSize: 13, fontWeight: "700" },

  // PIN tab
  pinContent: { padding: 16 },
  pinCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  pinCardTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 6 },
  pinCardSub: { color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 20, marginBottom: 24 },
  pinFieldLabel: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 6, fontWeight: "600" },
  pinField: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 18,
    letterSpacing: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  changePinBtn: {
    backgroundColor: "#6366f1",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  changePinBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(234,179,8,0.08)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.2)",
  },
  warningIcon: { fontSize: 18 },
  warningText: { flex: 1, color: "rgba(234,179,8,0.9)", fontSize: 13, lineHeight: 20 },
});
