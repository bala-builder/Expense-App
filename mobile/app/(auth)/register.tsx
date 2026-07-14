import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { Link, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { register } = useApp();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError("All fields are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register(name.trim(), email.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (err: any) {
      const msg =
        err.code === "auth/email-already-in-use"
          ? "This email is already registered"
          : err.code === "auth/invalid-email"
          ? "Invalid email address"
          : err.message || "Registration failed";
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const s = makeStyles(colors);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[s.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.logoRow}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={s.logoCircle}
            resizeMode="contain"
          />
        </View>
        <Text style={s.title}>Create account</Text>
        <Text style={s.subtitle}>Start tracking expenses with friends</Text>

        <View style={s.form}>
          <View style={s.inputWrapper}>
            <Ionicons name="person-outline" size={18} color={colors.muted} style={s.inputIcon} />
            <TextInput
              style={s.input}
              value={name}
              onChangeText={(t) => { setName(t); setError(""); }}
              placeholder="Full name"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
            />
          </View>

          <View style={s.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={colors.muted} style={s.inputIcon} />
            <TextInput
              style={s.input}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(""); }}
              placeholder="Email address"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={s.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.muted} style={s.inputIcon} />
            <TextInput
              style={[s.input, { paddingRight: 48 }]}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(""); }}
              placeholder="Password (min 6 characters)"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={s.verificationNote}>
            A verification email will be sent to your address.
          </Text>

          <TouchableOpacity
            style={[s.primaryBtn, (loading || !name || !email || !password) && s.disabledBtn]}
            onPress={handleRegister}
            disabled={loading || !name || !email || !password}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.primaryBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={s.loginRow}>
          <Text style={s.loginText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={s.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof import("@/hooks/useColors").useColors>) {
  return StyleSheet.create({
    container: { flexGrow: 1, paddingHorizontal: 24 },
    logoRow: { alignItems: "center", marginBottom: 24 },
    logoCircle: {
      width: 72,
      height: 72,
      borderRadius: 20,
    },
    title: { fontSize: 28, fontWeight: "700", color: colors.foreground, textAlign: "center", fontFamily: "Lexend_700Bold" },
    subtitle: { fontSize: 15, color: colors.muted, textAlign: "center", marginTop: 6, marginBottom: 32, fontFamily: "Lexend_400Regular" },
    form: { gap: 12 },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: colors.radius,
      paddingHorizontal: 14,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.foreground, fontFamily: "Lexend_400Regular" },
    eyeBtn: { padding: 4, position: "absolute", right: 12 },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: `${colors.danger}15`,
      borderRadius: 8,
      padding: 10,
    },
    errorText: { fontSize: 13, color: colors.danger, flex: 1 },
    verificationNote: { fontSize: 12, color: colors.mutedForeground, lineHeight: 18 },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 4,
    },
    disabledBtn: { opacity: 0.5 },
    primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16, fontFamily: "Lexend_700Bold" },
    loginRow: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
    loginText: { fontSize: 14, color: colors.muted },
    loginLink: { fontSize: 14, color: colors.primary, fontWeight: "600" },
  });
}
