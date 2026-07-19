import { renderLayout } from "../modules/layout.js";
import { escapeHTML, formatPrice, showToast } from "../modules/ui-utils.js";
import { rechercherAnnonces } from "../modules/listings.js";

renderLayout();

const state = {
  filtres: {},
  cursor: null,
  resultats: [],
  vue: "list",
};

let map = null;
let markers = [];

// Pré-remplissage depuis les paramètres d'URL (venant de la home ou d'une catégorie)
const params = new URLSearchParams(window.location.search);
if (params.get("ville")) document.getElementById("f-ville").value = params.get("ville");
if (params.get("budgetMax")) document.getElementById("f-prix-max").value = params.get("budgetMax");

initChips();
document.getElementById("filters-form").addEventListener("submit", (e) => {
  e.preventDefault();
  applyFilters();
  runSearch({ reset: true });
});
document.getElementById("reset-filters").addEventListener("click", resetFilters);
document.getElementById("sort").addEventListener("change", () => runSearch({ reset: true }));
document.getElementById("load-more").addEventListener("click", () => runSearch({ reset: false }));
document.querySelectorAll(".view-toggle button").forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

applyFilters();
runSearch({ reset: true });

function initChips() {
  document.querySelectorAll("#f-genre .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const alreadyActive = chip.getAttribute("aria-pressed") === "true";
      document.querySelectorAll("#f-genre .chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
      chip.setAttribute("aria-pressed", String(!alreadyActive));
    });
  });
  document.querySelectorAll("#f-prefs .chip, #f-equipements .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const active = chip.getAttribute("aria-pressed") === "true";
      chip.setAttribute("aria-pressed", String(!active));
    });
  });
}

function applyFilters() {
  const genreChip = document.querySelector('#f-genre .chip[aria-pressed="true"]');
  const equipements = [...document.querySelectorAll('#f-equipements .chip[aria-pressed="true"]')].map((c) => c.dataset.value);
  const prefs = {};
  document.querySelectorAll('#f-prefs .chip').forEach((c) => {
    if (c.getAttribute("aria-pressed") === "true") prefs[c.dataset.key] = true;
  });

  state.filtres = {
    ville: document.getElementById("f-ville").value.trim() || undefined,
    prixMin: document.getElementById("f-prix-min").value || undefined,
    prixMax: document.getElementById("f-prix-max").value || undefined,
    genreRecherche: genreChip?.dataset.value,
    equipements: equipements.length ? equipements : undefined,
    ...prefs,
  };
}

function resetFilters() {
  document.getElementById("filters-form").reset();
  document.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
  state.filtres = {};
  runSearch({ reset: true });
}

async function runSearch({ reset }) {
  const grid = document.getElementById("results-grid");
  const countEl = document.getElementById("results-count");
  const loadMoreBtn = document.getElementById("load-more");

  if (reset) {
    state.cursor = null;
    state.resultats = [];
    grid.innerHTML = Array(3).fill('<div class="card listing-card"><div class="skeleton" style="aspect-ratio:4/3;"></div></div>').join("");
  }

  try {
    const { resultats, dernierDoc, aPlus } = await rechercherAnnonces(state.filtres, { cursor: reset ? null : state.cursor });
    let combined = reset ? resultats : [...state.resultats, ...resultats];

    const sort = document.getElementById("sort").value;
    if (sort === "prix-asc") combined = [...combined].sort((a, b) => a.prix - b.prix);
    if (sort === "prix-desc") combined = [...combined].sort((a, b) => b.prix - a.prix);
    if (sort === "recent") combined = [...combined].sort((a, b) => (b.datePublication?.seconds || 0) - (a.datePublication?.seconds || 0));

    state.resultats = combined;
    state.cursor = dernierDoc;

    countEl.textContent = combined.length ? `${combined.length} annonce${combined.length > 1 ? "s" : ""} trouvée${combined.length > 1 ? "s" : ""}` : "Aucune annonce trouvée";
    grid.innerHTML = combined.length
      ? combined.map(renderCard).join("")
      : `<div class="empty-state" style="grid-column:1/-1;"><div class="icon">🔍</div><p>Aucune annonce ne correspond à ces critères. Essayez d'élargir votre recherche.</p></div>`;

    loadMoreBtn.hidden = !aPlus;
    if (state.vue === "map") renderMap(combined);
  } catch (err) {
    console.error(err);
    countEl.textContent = "Erreur de chargement";
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="icon">⚠️</div><p>Impossible de charger les résultats pour le moment.</p></div>`;
  }
}

function renderCard(annonce) {
  const photo = annonce.photos?.[0] || "assets/placeholder-annonce.jpg";
  return `
    <a class="card listing-card" href="annonce.html?id=${annonce.id}">
      <div class="listing-media">
        <img src="${escapeHTML(photo)}" alt="${escapeHTML(annonce.titre)}" loading="lazy" />
      </div>
      <div class="listing-body">
        <div class="listing-title">${escapeHTML(annonce.titre)}</div>
        <div class="listing-meta">📍 ${escapeHTML(annonce.ville)}</div>
        <div class="listing-price">${formatPrice(annonce.prix)}<small> / mois</small></div>
      </div>
    </a>`;
}

function switchView(view) {
  state.vue = view;
  document.querySelectorAll(".view-toggle button").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === view);
    b.setAttribute("aria-selected", String(b.dataset.view === view));
  });
  document.getElementById("map").hidden = view !== "map";
  document.getElementById("results-grid").hidden = view === "map";
  if (view === "map") {
    initMap();
    renderMap(state.resultats);
  }
}

function initMap() {
  if (map) return;
  map = L.map("map").setView([46.6034, 1.8883], 6); // Centre France
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);
}

function renderMap(annonces) {
  if (!map) return;
  markers.forEach((m) => map.removeLayer(m));
  markers = [];

  const valides = annonces.filter((a) => a.latitude && a.longitude);
  valides.forEach((a) => {
    const marker = L.marker([a.latitude, a.longitude]).addTo(map);
    marker.bindPopup(
      `<div class="map-popup-title">${escapeHTML(a.titre)}</div><div class="map-popup-price">${formatPrice(a.prix)} / mois</div><a href="annonce.html?id=${a.id}">Voir l'annonce →</a>`
    );
    markers.push(marker);
  });

  if (valides.length) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.2));
  }
}
