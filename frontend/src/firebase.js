import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// CORRECT REACT SYNTAX FOR CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCMnQZNUOVbo8R5OqutkzIhOcNkZ3dewTE",
  authDomain: "sitetrack-backend.firebaseapp.com",
  projectId: "sitetrack-backend",
  storageBucket: "sitetrack-backend.firebasestorage.app",
  messagingSenderId: "580393625486",
  appId: "1:580393625486:web:f46229e8ec7ced30ee66df"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const requestPushPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      
      const token = await getToken(messaging, {
        vapidKey: "YOUR_NEW_VAPID_KEY_HERE", // <--- PASTE YOUR NEW VAPID KEY HERE
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

// Listen for foreground messages
export const listenForMessages = () => {
  onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);
    if (payload.notification) {
      alert(`${payload.notification.title}\n${payload.notification.body}`);
    }
  });
};
