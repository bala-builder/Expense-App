import { messaging, db } from './firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export async function registerForPushNotifications(userId) {
    if (!messaging) {
        console.log('FCM not supported in this browser.');
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied.');
            return;
        }

        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        const token = await messaging.getToken({
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
        });

        if (token) {
            await db.collection('users').doc(userId).update({ fcmToken: token });
            console.log('FCM token saved.');
        }
    } catch (err) {
        console.error('Error registering for push notifications:', err);
    }
}

export function onForegroundMessage(callback) {
    if (!messaging) return () => {};
    return messaging.onMessage((payload) => {
        callback(payload);
    });
}
