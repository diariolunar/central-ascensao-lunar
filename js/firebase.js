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

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";

/* =========================
   IMPORTA AUTH
========================= */

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

/* =========================
   IMPORTA FIRESTORE
========================= */

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

} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

/* =========================
   CONFIG FIREBASE
========================= */

const firebaseConfig = {
  apiKey: "AIzaSyBjZmPN2PheKgbG34dGmFR7j_rs5QZEUAg",
  authDomain: "central-ascensao-lunar.firebaseapp.com",
  projectId: "central-ascensao-lunar",
  storageBucket: "central-ascensao-lunar.firebasestorage.app",
  messagingSenderId: "283153766319",
  appId: "1:283153766319:web:7e255d8e6023f61f07815a"
};

/* =========================
   INICIALIZA FIREBASE
========================= */

const app = initializeApp(firebaseConfig);

/* =========================
   AUTH
========================= */

const auth = getAuth(app);

/* =========================
   FIRESTORE DATABASE
========================= */

const db = getFirestore(app);

/* =========================
   EXPORTA TUDO
========================= */

export {

  /* App */
  app,

  /* Auth */
  auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,

  /* Database */
  db,

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
