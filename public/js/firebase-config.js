// public/js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBqwsyhCDM6wWs8m90xZiM68a5SOJq9oGw",
  authDomain: "nadrika-f1002.firebaseapp.com",
  projectId: "nadrika-f1002",
  storageBucket: "nadrika-f1002.firebasestorage.app",
  messagingSenderId: "487463555506",
  appId: "1:487463555506:web:baeac613c642ea1822d4ab"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);

// Exportar funciones de Firestore y Auth
export { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  doc,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  logEvent
};