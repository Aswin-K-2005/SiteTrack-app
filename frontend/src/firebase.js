import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// 1. PASTE YOUR FIREBASE CONFIG OBJECT HERE:
const firebaseConfig = {
  apiKey: "AIzaSyC01bUV3PZMGH3PYCfHUZgPmNdKFiff29E",
  authDomain: "site-track-app.firebaseapp.com",
  projectId: "site-track-app",
  storageBucket: "site-track-app.firebasestorage.app",
  messagingSenderId: "351376749809",
  appId: "1:351376749809:web:e86510a68bd9dccb50a550",
  measurementId: "G-DJPCG1FM3W"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Function to request permission and get the token
export const requestPushPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // 2. PASTE YOUR VAPID KEY HERE:
      const token = await getToken(messaging, {
        vapidKey: "YOUR_LONG_VAPID_KEY_STRING_HERE"
      });
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

// Listener for foreground messages (when the app is open)
export const listenForMessages = () => {
  onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);
    // You can trigger a custom React toast notification here later!
  });
};
