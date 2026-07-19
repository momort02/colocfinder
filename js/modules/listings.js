// ==========================================================================
// ColocMatch — Accès Firestore pour la collection "annonces" et "favoris"
// ==========================================================================

import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fbLimit,
  startAfter,
  serverTimestamp,
  increment,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const ANNONCES = "annonces";
const FAVORIS = "favoris";

/** Récupère les annonces actives les plus récentes. */
export async function getAnnoncesRecentes(nb = 6) {
  const q = query(
    collection(db, ANNONCES),
    where("active", "==", true),
    orderBy("datePublication", "desc"),
    fbLimit(nb)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Recherche d'annonces avec filtres. Firestore ne permettant qu'un nombre
 * limité d'inégalités combinées, les filtres les plus discriminants (ville,
 * prix) sont appliqués côté requête, le reste est filtré côté client.
 */
export async function rechercherAnnonces(filtres = {}, { pageSize = 12, cursor = null } = {}) {
  const clauses = [where("active", "==", true)];
  if (filtres.ville) clauses.push(where("ville", "==", filtres.ville));
  if (filtres.prixMax) clauses.push(where("prix", "<=", Number(filtres.prixMax)));

  let q = query(collection(db, ANNONCES), ...clauses, orderBy("prix", "asc"), fbLimit(pageSize));
  if (cursor) q = query(collection(db, ANNONCES), ...clauses, orderBy("prix", "asc"), startAfter(cursor), fbLimit(pageSize));

  const snap = await getDocs(q);
  let resultats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Filtres additionnels appliqués côté client
  if (filtres.prixMin) resultats = resultats.filter((a) => a.prix >= Number(filtres.prixMin));
  if (filtres.animaux !== undefined) resultats = resultats.filter((a) => a.animaux === filtres.animaux);
  if (filtres.fumeur !== undefined) resultats = resultats.filter((a) => a.fumeur === filtres.fumeur);
  if (filtres.genreRecherche) resultats = resultats.filter((a) => a.genreRecherche === filtres.genreRecherche || a.genreRecherche === "mixte");
  if (filtres.equipements?.length) {
    resultats = resultats.filter((a) => filtres.equipements.every((eq) => a.equipements?.includes(eq)));
  }

  const dernierDoc = snap.docs[snap.docs.length - 1] || null;
  return { resultats, dernierDoc, aPlus: snap.docs.length === pageSize };
}

/** Récupère une annonce par son id et incrémente son compteur de vues. */
export async function getAnnonce(id, { compterVue = true } = {}) {
  const ref = doc(db, ANNONCES, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  if (compterVue) updateDoc(ref, { vues: increment(1) }).catch(() => {});
  return { id: snap.id, ...snap.data() };
}

/** Crée une nouvelle annonce. */
export async function creerAnnonce(data, auteurUid) {
  return addDoc(collection(db, ANNONCES), {
    ...data,
    auteur: auteurUid,
    vues: 0,
    active: true,
    datePublication: serverTimestamp(),
  });
}

/** Met à jour une annonce existante. */
export function modifierAnnonce(id, updates) {
  return updateDoc(doc(db, ANNONCES, id), updates);
}

/** Active / désactive une annonce. */
export function basculerActivation(id, active) {
  return updateDoc(doc(db, ANNONCES, id), { active });
}

/** Supprime une annonce. */
export function supprimerAnnonce(id) {
  return deleteDoc(doc(db, ANNONCES, id));
}

/** Récupère toutes les annonces publiées par un utilisateur. */
export async function getAnnoncesUtilisateur(uid) {
  const q = query(collection(db, ANNONCES), where("auteur", "==", uid), orderBy("datePublication", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---- Favoris ----

/** Ajoute une annonce aux favoris de l'utilisateur (id déterministe pour éviter les doublons). */
export function ajouterFavori(uid, annonceId) {
  return setDoc(doc(db, FAVORIS, `${uid}_${annonceId}`), { uid, annonceId, dateAjout: serverTimestamp() });
}

/** Retire une annonce des favoris. */
export function retirerFavori(uid, annonceId) {
  return deleteDoc(doc(db, FAVORIS, `${uid}_${annonceId}`));
}

/** Vérifie si une annonce est en favori pour cet utilisateur. */
export async function estFavori(uid, annonceId) {
  const snap = await getDoc(doc(db, FAVORIS, `${uid}_${annonceId}`));
  return snap.exists();
}

/** Récupère toutes les annonces favorites d'un utilisateur. */
export async function getFavorisUtilisateur(uid) {
  const q = query(collection(db, FAVORIS), where("uid", "==", uid));
  const snap = await getDocs(q);
  const annonceIds = snap.docs.map((d) => d.data().annonceId);
  const annonces = await Promise.all(annonceIds.map((id) => getAnnonce(id, { compterVue: false })));
  return annonces.filter(Boolean);
}
