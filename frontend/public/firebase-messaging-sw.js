importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC01bUV3PZMGH3PYCfHUZgPmNdKFiff29E",
  authDomain: "site-track-app.firebaseapp.com",
  projectId: "site-track-app",
  storageBucket: "site-track-app.firebasestorage.app",
  messagingSenderId: "351376749809",
  appId: "1:351376749809:web:e86510a68bd9dccb50a550"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/app-logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
