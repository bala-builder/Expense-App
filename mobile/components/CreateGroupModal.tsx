import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { addGroup } = useApp();
  const [groupName, setGroupName] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    if (emails.includes(email)) {
      setError("Email already added");
      return;
    }
    setEmails([...emails, email]);
    setEmailInput("");
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await addGroup(groupName.trim(), emails);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setGroupName("");
      setEmails([]);
      setEmailInput("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(colors);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>New Group</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Group Name</Text>
            <TextInput
              style={styles.input}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="e.g. Weekend Trip, Roommates"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
            />

            <Text style={styles.label}>Invite Members (optional)</Text>
            <View style={styles.emailRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={emailInput}
                onChangeText={(t) => { setEmailInput(t); setError(""); }}
                placeholder="friend@email.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                onSubmitEditing={addEmail}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addEmailBtn} onPress={addEmail}>
                <Ionicons name="add" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {emails.length > 0 && (
              <View style={styles.chipContainer}>
                {emails.map((email) => (
                  <View key={email} style={styles.chip}>
                    <Text style={styles.chipText}>{email}</Text>
                    <TouchableOpacity onPress={() => removeEmail(email)}>
                      <Ionicons name="close-circle" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.hint}>
              Invited members will receive an email to join Trackcents.
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.createBtn, (!groupName.trim() || loading) && styles.disabledBtn]}
              onPress={handleCreate}
              disabled={!groupName.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.createBtnText}>Create Group</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(colors: ReturnType<typeof import("@/hooks/useColors").useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    title: { fontSize: 18, fontWeight: "700", color: colors.foreground },
    closeBtn: { padding: 4 },
    body: { flex: 1, padding: 20 },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
      marginBottom: 8,
      marginTop: 16,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: colors.radius,
      paddingHorizontal: 16,
      paddingVertical: 13,
      fontSize: 15,
      color: colors.foreground,
      marginBottom: 8,
    },
    emailRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    addEmailBtn: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: colors.radius,
      padding: 13,
    },
    errorText: { fontSize: 13, color: colors.danger, marginBottom: 8 },
    chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: `${colors.primary}15`,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    chipText: { fontSize: 13, color: colors.primary, fontWeight: "500" },
    hint: { fontSize: 12, color: colors.mutedForeground, marginTop: 12, lineHeight: 18 },
    footer: {
      padding: 20,
      paddingBottom: 32,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    createBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 15,
      alignItems: "center",
    },
    disabledBtn: { opacity: 0.5 },
    createBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  });
}
