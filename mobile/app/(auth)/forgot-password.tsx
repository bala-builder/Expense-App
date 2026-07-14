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
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { resetPassword } = useApp();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) { setError("Enter your email address"); return; }
    setLoading(true);
    setError("");
    try {
      await resetPassword(email.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
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
      <View style={[s.container, { paddingTop: insets.top }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <View style={s.content}>
          <View style={s.iconCircle}>
            <Ionicons name="lock-open-outline" size={32} color={colors.primary} />
          </View>

          {sent ? (
            <>
              <Text style={s.title}>Check your inbox</Text>
              <Text style={s.subtitle}>
                We sent a password reset link to{"\n"}
                <Text style={{ color: colors.primary, fontWeight: "600" }}>{email}</Text>
              </Text>
              <TouchableOpacity style={s.primaryBtn} onPress={() => router.back()}>
                <Text style={s.primaryBtnText}>Back to Sign In</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.title}>Forgot password?</Text>
              <Text style={s.subtitle}>
                Enter your email and we'll send you a reset link.
              </Text>

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
                  autoFocus
                />
              </View>

              {error ? (
                <View style={s.errorBox}>
                  <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[s.primaryBtn, (!email.trim() || loading) && s.disabledBtn]}
                onPress={handleReset}
                disabled={!email.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.primaryBtnText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof import("@/hooks/useColors").useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
    backBtn: { paddingVertical: 16, paddingRight: 16, alignSelf: "flex-start" },
    content: { flex: 1, justifyContent: "center", paddingBottom: 80 },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 24,
      backgroundColor: `${colors.primary}15`,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginBottom: 24,
    },
    title: { fontSize: 26, fontWeight: "700", color: colors.foreground, textAlign: "center", fontFamily: "Lexend_700Bold" },
    subtitle: { fontSize: 15, color: colors.muted, textAlign: "center", marginTop: 8, marginBottom: 28, lineHeight: 22 },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: colors.radius,
      paddingHorizontal: 14,
      marginBottom: 12,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.foreground },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: `${colors.danger}15`,
      borderRadius: 8,
      padding: 10,
      marginBottom: 12,
    },
    errorText: { fontSize: 13, color: colors.danger, flex: 1 },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 8,
    },
    disabledBtn: { opacity: 0.5 },
    primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  });
}
