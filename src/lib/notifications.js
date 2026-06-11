import { messaging, db } from './firebase';
import firebase from 'firebase/compat/app';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export async function getNotificationStatus() {
    if (!('Notification' in window)) return 'unsupported';
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';
    if (!messaging) return 'unsupported';
    return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function registerForPushNotifications(userId) {
    try {
        if (!messaging) {
            console.log('FCM not supported in this browser.');
            return false;
        }

        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('Push notifications not supported in this browser.');
            return false;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied or dismissed.');
            return false;
        }

        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;

        const token = await messaging.getToken({
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
        });

        if (token) {
            await db.collection('users').doc(userId).set(
                { fcmTokens: firebase.firestore.FieldValue.arrayUnion(token) },
                { merge: true }
            );
            console.log('FCM token saved:', token.slice(0, 20) + '...');
            return true;
        } else {
            console.warn('No FCM token returned — check VAPID key and service worker.');
            return false;
        }
    } catch (err) {
        console.error('Error registering for push notifications:', err.code || err.message);
        return false;
    }
}

export function onForegroundMessage(callback) {
    if (!messaging) return () => {};
    return messaging.onMessage((payload) => {
        callback(payload);
    });
}
