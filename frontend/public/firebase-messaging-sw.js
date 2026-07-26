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
}); /* THE FIX: Added missing closing brace and parenthesis here */

// 2. Initialize Messaging
const messaging = firebase.messaging();

// 3. Android Chrome absolutely requires a 'fetch' event listener to show the PWA Install prompt!
self.addEventListener('fetch', function(event) {
    // An empty fetch handler is enough to pass the PWA installability test.
});
