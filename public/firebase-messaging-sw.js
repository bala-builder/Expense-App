// v2
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDQ_Bb0BWjuhs4VegadT_QWxeWaenw2NKg",
    authDomain: "my-first-project-fd8f6.firebaseapp.com",
    projectId: "my-first-project-fd8f6",
    storageBucket: "my-first-project-fd8f6.firebasestorage.app",
    messagingSenderId: "664924566379",
    appId: "1:664924566379:web:9488e04eef0022f2a2122e"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification || {};
    self.registration.showNotification(title || 'Trackcents', {
        body: body || 'You have a new expense.',
        icon: '/logo.png',
        badge: '/logo.png',
        data: payload.data || {}
    });
});
