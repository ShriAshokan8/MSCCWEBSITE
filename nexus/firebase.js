import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAT3OZyWzxQ9NhL_bwNVes22pCGipiLg2U",
  authDomain: "mscnexus-1.firebaseapp.com",
  projectId: "mscnexus-1",
  storageBucket: "mscnexus-1.firebasestorage.app",
  messagingSenderId: "725398471808",
  appId: "1:725398471808:web:08c2ac317534907a841265",
  measurementId: "G-15CGMZBHDC"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth, onAuthStateChanged, signInWithEmailAndPassword, signOut };
