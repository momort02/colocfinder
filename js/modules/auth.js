// ==========================================================================
// ColocMatch — Authentification Firebase
// ==========================================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

/**
 * Crée un compte Firebase Auth + le document Firestore `users/{uid}` associé.
 * @param {{email:string, password:string, prenom:string, nom:string}} data
 */
export async function inscrire({ email, password, prenom, nom }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  await updateProfile(user, { displayName: `${prenom} ${nom}` });

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    nom: nom.trim(),
    prenom: prenom.trim(),
    photo: "",
    description: "",
    age: null,
    telephone: "",
    email: user.email,
    ville: "",
    budget: null,
    dateCreation: serverTimestamp(),
  });

  return user;
}

/** Connecte un utilisateur existant. */
export async function connecter(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/** Déconnecte l'utilisateur courant. */
export function deconnecter() {
  return signOut(auth);
}

/** Envoie un email de réinitialisation de mot de passe. */
export function reinitialiserMotDePasse(email) {
  return sendPasswordResetEmail(auth, email);
}

/** Change le mot de passe (nécessite une ré-authentification récente). */
export async function changerMotDePasse(ancienMotDePasse, nouveauMotDePasse) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non connecté.");
  const credential = EmailAuthProvider.credential(user.email, ancienMotDePasse);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, nouveauMotDePasse);
}

/** Récupère le document Firestore du profil utilisateur. */
export async function getProfil(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

/** Met à jour le profil Firestore (et le displayName Auth si nom/prénom changent). */
export async function mettreAJourProfil(uid, updates) {
  await updateDoc(doc(db, "users", uid), updates);
  if (updates.nom || updates.prenom) {
    const profil = await getProfil(uid);
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: `${profil.prenom} ${profil.nom}`,
      });
    }
  }
}

/**
 * S'abonne à l'état de connexion. Rappelle `callback(user | null)` à chaque
 * changement. Retourne la fonction de désabonnement.
 */
export function surChangementAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Protège une page : redirige vers connexion.html si personne n'est connecté.
 * À appeler en haut des pages qui nécessitent une session (profil, publier, etc.)
 */
export function exigerConnexion(redirectTo = "connexion.html") {
  return new Promise((resolve) => {
    const unsubscribe = surChangementAuth((user) => {
      unsubscribe();
      if (!user) {
        const retour = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `${redirectTo}?retour=${retour}`;
      } else {
        resolve(user);
      }
    });
  });
}

/** Traduit les codes d'erreur Firebase Auth en messages français lisibles. */
export function traduireErreurAuth(error) {
  const map = {
    "auth/email-already-in-use": "Cette adresse email est déjà utilisée.",
    "auth/invalid-email": "Adresse email invalide.",
    "auth/weak-password": "Mot de passe trop faible (8 caractères minimum).",
    "auth/user-not-found": "Aucun compte ne correspond à cette adresse email.",
    "auth/wrong-password": "Mot de passe incorrect.",
    "auth/invalid-credential": "Email ou mot de passe incorrect.",
    "auth/too-many-requests": "Trop de tentatives. Réessayez dans quelques minutes.",
    "auth/network-request-failed": "Problème de connexion réseau.",
  };
  return map[error?.code] || "Une erreur est survenue. Veuillez réessayer.";
}
