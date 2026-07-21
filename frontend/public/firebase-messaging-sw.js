importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// 1. Initialize Firebase App (Using the 'compat' syntax that Service Workers require)
firebase.initializeApp({
  apiKey: "AIzaSyCMnQZNUOVbo8R5OqutkzIhOcNkZ3dewTE",
  authDomain: "sitetrack-backend.firebaseapp.com",
  projectId: "sitetrack-backend",
  storageBucket: "sitetrack-backend.firebasestorage.app",
  messagingSenderId: "580393625486",
  appId: "1:580393625486:web:f46229e8ec7ced30ee66df"
});

// 2. Initialize Messaging
const messaging = firebase.messaging();

// 3. THIS IS THE MISSING PIECE: Tell the SW how to decrypt the message
// REPLACE THE VAPID KEY BELOW WITH YOUR NEW FIREBASE VAPID KEY!
messaging.getToken({ 
  vapidKey: "BL59yeNy8YSJvtYDHFir6N32lB3TyIgIXi76iOXvq-dobpBeKzjIySgCwvLRFLzJd5n_qMNuf_hD8uNRylj5jJw" 
});

// 4. Handle the Background Message
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/app-logo.png', // Ensure this file exists in your public folder!
    badge: '/app-logo.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
