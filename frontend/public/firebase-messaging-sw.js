importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// 1. Initialize Firebase App
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
