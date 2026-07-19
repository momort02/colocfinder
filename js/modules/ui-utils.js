// ==========================================================================
// ColocMatch — Utilitaires d'interface partagés
// ==========================================================================

/** Affiche une notification toast en bas de l'écran. */
export function showToast(message, type = "info", duration = 4000) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 200ms ease";
    setTimeout(() => toast.remove(), 220);
  }, duration);
}

/** Bascule un bouton en état "chargement" avec un spinner, et restaure son contenu ensuite. */
export function setButtonLoading(button, isLoading, loadingText = "Patientez…") {
  if (isLoading) {
    button.dataset.originalContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${loadingText}`;
  } else {
    button.disabled = false;
    if (button.dataset.originalContent) button.innerHTML = button.dataset.originalContent;
  }
}

/** Initialise le bouton de bascule mode clair / mode sombre et applique la préférence sauvegardée. */
export function initThemeToggle() {
  const stored = localStorage.getItem("colocmatch-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = stored || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);

  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    updateToggleIcon(btn, theme);
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("colocmatch-theme", next);
      document.querySelectorAll("[data-theme-toggle]").forEach((b) => updateToggleIcon(b, next));
    });
  });
}

function updateToggleIcon(btn, theme) {
  btn.textContent = theme === "dark" ? "☀️" : "🌙";
  btn.setAttribute("aria-label", theme === "dark" ? "Activer le mode clair" : "Activer le mode sombre");
}

/** Ouvre/ferme le menu mobile. */
export function initMobileNav() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

/** Observe les éléments `.reveal` et ajoute `.is-visible` à leur entrée dans le viewport. */
export function initScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  items.forEach((item) => observer.observe(item));
}

/** Échappe une chaîne pour un affichage sûr en HTML (protection XSS de base). */
export function escapeHTML(str = "") {
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

/** Formate un prix en euros. */
export function formatPrice(value) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

/** Formate une date relative simple ("il y a 3 jours"). */
export function formatRelativeDate(date) {
  const d = date?.toDate ? date.toDate() : new Date(date);
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays <= 0) return "aujourd'hui";
  if (diffDays === 1) return "hier";
  if (diffDays < 30) return `il y a ${diffDays} jours`;
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `il y a ${months} mois`;
  return `il y a ${Math.floor(months / 12)} an(s)`;
}
