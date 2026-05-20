/*
  CENTRAL ASCENSÃO LUNAR
  Arquivo: js/firebase.js

  Este arquivo conecta o sistema ao Firebase.
  Aqui ficam:
  - autenticação
  - banco de dados
  - exportações das funções Firebase
*/

/*
  IMPORTANDO FIREBASE VIA CDN

  Como não estamos usando npm ou terminal,
  vamos usar o Firebase diretamente pela internet.
*/

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

/*
  CONFIGURAÇÃO DO FIREBASE

  VOCÊ VAI TROCAR ISSO PELOS DADOS DO SEU PROJETO.
*/

const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};

/* Inicializa Firebase */
const app = initializeApp(firebaseConfig);

/* Inicializa autenticação */
const auth = getAuth(app);

/* Inicializa banco */
const db = getFirestore(app);

/*
  EXPORTA TUDO
  Assim o app.js consegue usar.
*/

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