// ==========================================================================
// ColocMatch — Initialisation Firebase
// Remplacer les valeurs ci-dessous par celles de votre projet Firebase
// (Console Firebase > Paramètres du projet > Vos applications > Config SDK).
// Ce fichier est public une fois déployé sur GitHub Pages : c'est normal,
// la clé "apiKey" de Firebase n'est pas un secret. La sécurité réelle est
// assurée par les règles Firestore (voir firestore.rules) et par
// l'authentification Firebase elle-même.
// ==========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  connectAuthEmulator,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  connectFirestoreEmulator,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "REMPLACER_API_KEY",
  authDomain: "colocmatch.firebaseapp.com",
  projectId: "colocmatch",
  storageBucket: "colocmatch.appspot.com", // non utilisé (pas de Firebase Storage)
  messagingSenderId: "REMPLACER_SENDER_ID",
  appId: "REMPLACER_APP_ID",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// URL de l'API d'upload d'images (Oracle Cloud). À adapter selon l'environnement.
export const UPLOAD_API_URL = "https://api.colocmatch.fr/upload";

// Décommenter pour développer en local avec les émulateurs Firebase :
// connectAuthEmulator(auth, "http://localhost:9099");
// connectFirestoreEmulator(db, "localhost", 8080);
