import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Alert,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { verifyPin, getPin } from "../services/pinService";
import { LinearGradient } from "expo-linear-gradient";

export default function PinScreen() {
  const [entered, setEntered] = useState("");
  const [shake] = useState(new Animated.Value(0));
  const [firstLaunch, setFirstLaunch] = useState(false);
  const [setupStep, setSetupStep] = useState<"first" | "confirm" | null>(null);
  const [firstPin, setFirstPin] = useState("");

  useEffect(() => {
    // If PIN is still the default, we can skip setup — user will change in settings
    checkFirstLaunch();
  }, []);

  async function checkFirstLaunch() {
    const pin = await getPin();
    // If default pin "1234", show direct login
    setFirstLaunch(false);
  }

  function triggerShake() {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

  async function handleKey(key: string) {
    if (entered.length >= 4) return;
    const next = entered + key;
    setEntered(next);

    if (next.length === 4) {
      const ok = await verifyPin(next);
      if (ok) {
        setEntered("");
        router.replace("/dashboard");
      } else {
        Vibration.vibrate(400);
        triggerShake();
        setTimeout(() => {
          setEntered("");
        }, 600);
        Alert.alert("Wrong PIN", "Please try again.");
      }
    }
  }

  function handleDel() {
    setEntered((p) => p.slice(0, -1));
  }

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  return (
    <View style={s.container}>
      {/* Background gradient */}
      <View style={s.bgCircle1} />
      <View style={s.bgCircle2} />

      {/* Shield Icon */}
      <View style={s.iconWrap}>
        <Text style={s.iconEmoji}>🛡️</Text>
      </View>

      <Text style={s.title}>Guardian</Text>
      <Text style={s.sub}>Enter your PIN to continue</Text>

      {/* PIN dots */}
      <Animated.View style={[s.dots, { transform: [{ translateX: shake }] }]}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              s.dot,
              i < entered.length && s.dotFilled,
            ]}
          />
        ))}
      </Animated.View>

      {/* Keypad */}
      <View style={s.pad}>
        {keys.map((k, i) =>
          k === "" ? (
            <View key={i} style={s.keyEmpty} />
          ) : (
            <TouchableOpacity
              key={i}
              style={s.key}
              onPress={() => (k === "⌫" ? handleDel() : handleKey(k))}
              activeOpacity={0.6}
            >
              <Text style={k === "⌫" ? s.keyDel : s.keyText}>{k}</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <Text style={s.hint}>Default PIN: 1234  •  Change in Settings</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f1a",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  bgCircle1: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: "rgba(99,102,241,0.08)",
    top: -80,
    right: -80,
  },
  bgCircle2: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(139,92,246,0.06)",
    bottom: 60,
    left: -60,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(99,102,241,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
  },
  iconEmoji: { fontSize: 40 },
  title: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 44,
  },
  dots: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 48,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "transparent",
  },
  dotFilled: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  pad: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 234,
    gap: 16,
    justifyContent: "center",
    marginBottom: 32,
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
  keyDel: { color: "#a5b4fc", fontSize: 20, fontWeight: "400" },
  hint: {
    fontSize: 11,
    color: "rgba(255,255,255,0.2)",
    textAlign: "center",
  },
});
