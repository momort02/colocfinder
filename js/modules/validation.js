// ==========================================================================
// ColocMatch — Validation de formulaires (défense en profondeur)
// Rappel : cette validation côté client améliore l'UX mais ne remplace pas
// les règles Firestore, seule barrière réellement fiable côté serveur.
// ==========================================================================

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Au moins 8 caractères, une majuscule, une minuscule, un chiffre.
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const PHONE_RE = /^(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4}$/;

export function isValidEmail(value) {
  return EMAIL_RE.test(String(value).trim());
}

export function isValidPassword(value) {
  return PASSWORD_RE.test(String(value));
}

export function isValidPhone(value) {
  return PHONE_RE.test(String(value).trim());
}

export function isNonEmpty(value) {
  return String(value ?? "").trim().length > 0;
}

export function isInRange(value, min, max) {
  const n = Number(value);
  return !Number.isNaN(n) && n >= min && n <= max;
}

/** Retire balises HTML et caractères dangereux d'une saisie texte libre (protection XSS basique). */
export function sanitizeText(value) {
  return String(value ?? "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim()
    .slice(0, 5000);
}

/**
 * Attache une validation en temps réel à un <form>.
 * `rules` : { fieldName: (value) => true | "message d'erreur" }
 * Retourne une fonction `validateAll()` à appeler avant soumission.
 */
export function attachFormValidation(form, rules) {
  function validateField(name) {
    const input = form.elements[name];
    if (!input) return true;
    const fieldWrap = input.closest(".field");
    const errorEl = fieldWrap?.querySelector(".field-error");
    const result = rules[name](input.value, form);
    const ok = result === true;
    if (fieldWrap) fieldWrap.classList.toggle("has-error", !ok);
    if (errorEl) errorEl.textContent = ok ? "" : result;
    return ok;
  }

  Object.keys(rules).forEach((name) => {
    const input = form.elements[name];
    if (!input) return;
    input.addEventListener("blur", () => validateField(name));
    input.addEventListener("input", () => {
      const fieldWrap = input.closest(".field");
      if (fieldWrap?.classList.contains("has-error")) validateField(name);
    });
  });

  return function validateAll() {
    return Object.keys(rules)
      .map((name) => validateField(name))
      .every(Boolean);
  };
}
