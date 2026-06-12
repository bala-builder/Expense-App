import * as Notifications from "expo-notifications";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(
  uid: string
): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    try {
      await updateDoc(doc(db, "users", uid), { expoPushToken: token });
    } catch {
      await setDoc(
        doc(db, "users", uid),
        { expoPushToken: token },
        { merge: true }
      );
    }

    return token;
  } catch (error) {
    console.log("Push token error:", error);
    return null;
  }
}

export function setupNotificationListeners(
  onNotification: (notification: Notifications.Notification) => void,
  onResponse: (response: Notifications.NotificationResponse) => void
) {
  const notifSub = Notifications.addNotificationReceivedListener(onNotification);
  const respSub = Notifications.addNotificationResponseReceivedListener(onResponse);
  return () => {
    notifSub.remove();
    respSub.remove();
  };
}
