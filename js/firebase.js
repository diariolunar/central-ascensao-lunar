/*
  CENTRAL ASCENSÃO LUNAR
  Arquivo: js/firebase.js

  RESPONSÁVEL POR:
  - conectar o sistema ao Firebase
  - autenticação
  - banco de dados Firestore

  IMPORTANTE:
  Este projeto usa Firebase via CDN.
  Não precisa instalar nada.
*/

/* =========================
   IMPORTA FIREBASE APP
========================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBjZmPN2PheKgbG34dGmFR7j_rs5QZEUAg",
  authDomain: "central-ascensao-lunar.firebaseapp.com",
  projectId: "central-ascensao-lunar",
  storageBucket: "central-ascensao-lunar.firebasestorage.app",
  messagingSenderId: "283153766319",
  appId: "1:283153766319:web:7e255d8e6023f61f07815a"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  db,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp
};