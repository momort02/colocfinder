import { renderLayout } from "../modules/layout.js";
import { initScrollReveal, escapeHTML, formatPrice, showToast } from "../modules/ui-utils.js";
import { getAnnoncesRecentes } from "../modules/listings.js";

renderLayout();
initScrollReveal();
animateStats();
loadRecentListings();

document.getElementById("hero-search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const ville = document.getElementById("hero-ville").value.trim();
  const budgetMax = document.getElementById("hero-budget").value;
  const params = new URLSearchParams();
  if (ville) params.set("ville", ville);
  if (budgetMax) params.set("budgetMax", budgetMax);
  window.location.href = `recherche.html?${params.toString()}`;
});

/** Anime les compteurs de la section statistiques. */
function animateStats() {
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count);
    const duration = 1200;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString("fr-FR");
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

/** Charge les annonces récentes depuis Firestore et les affiche. */
async function loadRecentListings() {
  const container = document.getElementById("recent-listings");
  try {
    const annonces = await getAnnoncesRecentes(6);
    if (!annonces.length) {
      container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="icon">🏠</div><p>Aucune annonce publiée pour le moment. Soyez le premier !</p></div>`;
      return;
    }
    container.innerHTML = annonces.map(renderListingCard).join("");
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="icon">⚠️</div><p>Impossible de charger les annonces pour le moment.</p></div>`;
  }
}

function renderListingCard(annonce) {
  const photo = annonce.photos?.[0] || "assets/placeholder-annonce.jpg";
  return `
    <a class="card listing-card" href="annonce.html?id=${annonce.id}">
      <div class="listing-media">
        <img src="${escapeHTML(photo)}" alt="${escapeHTML(annonce.titre)}" loading="lazy" />
        <div class="listing-badges">
          ${annonce.badgeNouveau ? '<span class="badge badge-new">Nouveau</span>' : ""}
          ${annonce.verifie ? '<span class="badge badge-verified">Vérifié</span>' : ""}
        </div>
      </div>
      <div class="listing-body">
        <div class="listing-title">${escapeHTML(annonce.titre)}</div>
        <div class="listing-meta">📍 ${escapeHTML(annonce.ville)}</div>
        <div class="listing-price">${formatPrice(annonce.prix)}<small> / mois</small></div>
      </div>
    </a>`;
}
