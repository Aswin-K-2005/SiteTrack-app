import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC01bUV3PZMGH3PYCfHUZgPmNdKFiff29E",
  authDomain: "site-track-app.firebaseapp.com",
  projectId: "site-track-app",
  storageBucket: "site-track-app.firebasestorage.app",
  messagingSenderId: "351376749809",
  appId: "1:351376749809:web:e86510a68bd9dccb50a550"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const requestPushPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // 1. Explicitly register the service worker for iOS PWA support
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

      // 2. Request token with registration & VAPID key
      const token = await getToken(messaging, {
        vapidKey: "BCZLJNi224ZFFyZVYScK20pHY9OxMYNtCRzaWVKr45nbEhum05HriF0ToxJP8hiqpy48JWXzDtgFx_joVVlH1ww", // Replace with your real VAPID key from Firebase
        serviceWorkerRegistration: registration,
      });

      console.log("Generated FCM Token:", token);
      return token;
    } else {
      console.warn("Notification permission denied by user.");
      return null;
    }
  } catch (error) {
    console.error("Error generating FCM token:", error);
    return null;
  }
};
