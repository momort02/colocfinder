# ColocMatch — Phase 1

Plateforme de recherche/proposition de colocation. Front-end 100% HTML/CSS/JS vanilla (modules ES6), Firebase Auth + Firestore, carte Leaflet/OSM.

## ✅ Ce qui est livré dans cette phase

- Arborescence complète du projet (`/css`, `/js/modules`, `/js/pages`, `/assets`)
- Système de design (`css/base.css`) : palette blanc/bleu/gris clair, coins arrondis, **mode sombre**, composants (boutons, champs, cartes, toasts, badges, squelettes de chargement)
- `js/modules/firebase-config.js` — à compléter avec vos clés Firebase
- `js/modules/auth.js` — inscription, connexion, déconnexion, reset mot de passe, changement de mot de passe, protection de page (`exigerConnexion`)
- `js/modules/listings.js` — lecture/recherche/création d'annonces, favoris
- `js/modules/layout.js` — en-tête/pied de page communs, reflet de l'état de connexion
- `js/modules/validation.js` — validation + assainissement des formulaires (anti-XSS basique)
- **Pages fonctionnelles** : `index.html` (accueil + annonces récentes dynamiques), `connexion.html`, `inscription.html`, `recherche.html` (filtres + carte Leaflet + pagination)
- `firestore.rules` — règles de sécurité (chacun ne modifie que ses données, messages restreints aux participants)
- SEO : `manifest.json`, `robots.txt`, `sitemap.xml` (squelette)

## ⚙️ Installation

1. Créer un projet Firebase → activer **Authentication (email/mot de passe)** et **Cloud Firestore**.
2. Copier la config SDK dans `js/modules/firebase-config.js`.
3. Déployer les règles : `firebase deploy --only firestore:rules`.
4. Servir le dossier en local avec un serveur statique (les modules ES6 exigent http:// et non file://) :
   ```bash
   npx serve .
   ```
5. Déployer sur GitHub Pages (push du contenu de ce dossier sur la branche `gh-pages` ou via GitHub Actions).

## 🗺️ Feuille de route (phases suivantes)

- **Phase 2** : `publier.html` / `modifier.html` (formulaire multi-photos + géocodage), API Node.js Express d'upload d'images (Oracle Cloud) avec compression, redimensionnement 1600px, suppression EXIF, UUID.
- **Phase 3** : `messages.html` (messagerie temps réel Firestore, indicateur "vu"), `favoris.html`, `profil.html`, `mes-annonces.html`, `annonce.html` (fiche détaillée + carte + annonces similaires + signalement + partage).

Dites-moi par quelle page continuer.
