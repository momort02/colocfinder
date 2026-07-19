// ==========================================================================
// ColocMatch — En-tête / pied de page communs + reflet de l'état de connexion
// ==========================================================================

import { surChangementAuth, deconnecter, getProfil } from "./auth.js";
import { initThemeToggle, initMobileNav, showToast } from "./ui-utils.js";

const NAV_LINKS = [
  { href: "index.html", label: "Accueil" },
  { href: "recherche.html", label: "Rechercher" },
  { href: "publier.html", label: "Publier une annonce" },
];

function headerTemplate() {
  const current = window.location.pathname.split("/").pop() || "index.html";
  const links = NAV_LINKS.map(
    (l) => `<a href="${l.href}" class="${l.href === current ? "active" : ""}">${l.label}</a>`
  ).join("");

  return `
  <header class="site-header">
    <div class="container">
      <a href="index.html" class="logo">
        <span class="logo-mark" aria-hidden="true"></span>
        ColocMatch
      </a>
      <nav class="main-nav" aria-label="Navigation principale">${links}</nav>
      <div class="header-actions" data-auth-actions>
        <button class="theme-toggle" data-theme-toggle aria-label="Changer de thème">🌙</button>
        <button class="nav-toggle" data-nav-toggle aria-label="Ouvrir le menu" aria-expanded="false">☰</button>
        <a href="connexion.html" class="btn btn-ghost btn-sm" data-guest-only>Connexion</a>
        <a href="inscription.html" class="btn btn-primary btn-sm" data-guest-only>S'inscrire</a>
      </div>
    </div>
  </header>`;
}

function footerTemplate() {
  const year = new Date().getFullYear();
  return `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <a href="index.html" class="logo"><span class="logo-mark" aria-hidden="true"></span>ColocMatch</a>
          <p style="margin-top:12px; max-width:280px;">La plateforme pour trouver sa colocation idéale, partout en France.</p>
        </div>
        <div>
          <h4>Découvrir</h4>
          <ul>
            <li><a href="recherche.html">Rechercher une colocation</a></li>
            <li><a href="publier.html">Publier une annonce</a></li>
            <li><a href="index.html#categories">Catégories</a></li>
          </ul>
        </div>
        <div>
          <h4>Compte</h4>
          <ul>
            <li><a href="profil.html">Mon profil</a></li>
            <li><a href="favoris.html">Mes favoris</a></li>
            <li><a href="messages.html">Messagerie</a></li>
          </ul>
        </div>
        <div>
          <h4>Assistance</h4>
          <ul>
            <li><a href="#">Aide</a></li>
            <li><a href="#">Confidentialité</a></li>
            <li><a href="#">Conditions d'utilisation</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${year} ColocMatch. Tous droits réservés.</span>
        <span>Fait avec soin pour les colocataires de demain.</span>
      </div>
    </div>
  </footer>`;
}

/** Injecte l'en-tête et le pied de page dans les emplacements `#site-header` / `#site-footer`. */
export function renderLayout() {
  const headerSlot = document.getElementById("site-header");
  const footerSlot = document.getElementById("site-footer");
  if (headerSlot) headerSlot.outerHTML = headerTemplate();
  if (footerSlot) footerSlot.outerHTML = footerTemplate();

  initThemeToggle();
  initMobileNav();
  initAuthState();
}

/** Met à jour le header selon que l'utilisateur est connecté ou non. */
function initAuthState() {
  const actions = document.querySelector("[data-auth-actions]");
  if (!actions) return;

  surChangementAuth(async (user) => {
    actions.querySelectorAll("[data-guest-only]").forEach((el) => el.remove());
    const existingUserMenu = actions.querySelector("[data-user-menu]");
    if (existingUserMenu) existingUserMenu.remove();

    if (!user) {
      const login = document.createElement("a");
      login.href = "connexion.html";
      login.className = "btn btn-ghost btn-sm";
      login.dataset.guestOnly = "";
      login.textContent = "Connexion";

      const signup = document.createElement("a");
      signup.href = "inscription.html";
      signup.className = "btn btn-primary btn-sm";
      signup.dataset.guestOnly = "";
      signup.textContent = "S'inscrire";

      actions.append(login, signup);
      return;
    }

    const profil = await getProfil(user.uid).catch(() => null);
    const initiale = (profil?.prenom || user.email || "?").charAt(0).toUpperCase();

    const menu = document.createElement("div");
    menu.dataset.userMenu = "";
    menu.style.position = "relative";
    menu.innerHTML = `
      <button class="theme-toggle" style="border-radius: var(--radius-full); font-weight:700;" data-user-menu-btn aria-haspopup="true" aria-expanded="false">
        ${initiale}
      </button>
      <div data-user-menu-panel style="display:none; position:absolute; right:0; top:48px; background:var(--color-surface); border:1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-md); min-width:180px; overflow:hidden; z-index:60;">
        <a href="profil.html" style="display:block; padding:10px 14px; font-size:0.88rem;">Mon profil</a>
        <a href="mes-annonces.html" style="display:block; padding:10px 14px; font-size:0.88rem;">Mes annonces</a>
        <a href="favoris.html" style="display:block; padding:10px 14px; font-size:0.88rem;">Mes favoris</a>
        <a href="messages.html" style="display:block; padding:10px 14px; font-size:0.88rem;">Messagerie</a>
        <button data-logout-btn style="display:block; width:100%; text-align:left; padding:10px 14px; font-size:0.88rem; border:none; background:none; color:var(--color-danger);">Déconnexion</button>
      </div>`;
    actions.appendChild(menu);

    const btn = menu.querySelector("[data-user-menu-btn]");
    const panel = menu.querySelector("[data-user-menu-panel]");
    btn.addEventListener("click", () => {
      const open = panel.style.display === "block";
      panel.style.display = open ? "none" : "block";
      btn.setAttribute("aria-expanded", String(!open));
    });
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target)) panel.style.display = "none";
    });
    menu.querySelector("[data-logout-btn]").addEventListener("click", async () => {
      await deconnecter();
      showToast("Vous avez été déconnecté.", "success");
      window.location.href = "index.html";
    });
  });
}
