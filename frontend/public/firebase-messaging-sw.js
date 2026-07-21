importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// 1. Initialize Firebase exactly as you did in firebase.js
firebase.initializeApp({
  apiKey: "AIzaSyC01bUV3PZMGH3PYCfHUZgPmNdKFiff29E",
  authDomain: "site-track-app.firebaseapp.com",
  projectId: "site-track-app",
  storageBucket: "site-track-app.firebasestorage.app",
  messagingSenderId: "351376749809",
  appId: "1:351376749809:web:e86510a68bd9dccb50a550"
});

// 2. Initialize Messaging
const messaging = firebase.messaging();

// 3. THIS IS THE MISSING PIECE: Tell the SW how to decrypt the message
messaging.getToken({ 
  vapidKey: "BCZLJNi224ZFFyZVYScK20pHY9OxMYNtCRzaWVKr45nbEhum05HriF0ToxJP8hiqpy48JWXzDtgFx_joVVlH1ww" 
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
