import { messaging, db } from './firebase';
import firebase from 'firebase/compat/app';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export async function registerForPushNotifications(userId) {
    try {
        if (!messaging) {
            console.log('FCM not supported in this browser.');
            return;
        }

        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('Push notifications not supported in this browser.');
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied.');
            return;
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
        } else {
            console.warn('No FCM token returned — check VAPID key and service worker.');
        }
    } catch (err) {
        console.error('Error registering for push notifications:', err.code || err.message);
    }
}

export function onForegroundMessage(callback) {
    if (!messaging) return () => {};
    return messaging.onMessage((payload) => {
        callback(payload);
    });
}
