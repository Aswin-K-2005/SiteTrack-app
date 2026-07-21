// Import Firebase background scripts (Using the compat version for service workers)
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// PASTE YOUR FIREBASE CONFIG OBJECT HERE AGAIN:
const firebaseConfig = {
  apiKey: "AIzaSyC01bUV3PZMGH3PYCfHUZgPmNdKFiff29E",
  authDomain: "site-track-app.firebaseapp.com",
  projectId: "site-track-app",
  storageBucket: "site-track-app.firebasestorage.app",
  messagingSenderId: "351376749809",
  appId: "1:351376749809:web:e86510a68bd9dccb50a550",
  measurementId: "G-DJPCG1FM3W"
};


const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg' // You can change this to your company logo later
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
