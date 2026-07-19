import { renderLayout } from "../modules/layout.js";
import { inscrire, traduireErreurAuth } from "../modules/auth.js";
import { attachFormValidation, isValidEmail, isValidPassword, isNonEmpty, sanitizeText } from "../modules/validation.js";
import { setButtonLoading } from "../modules/ui-utils.js";

renderLayout();

const form = document.getElementById("signup-form");
const errorBox = document.getElementById("auth-error");
const signupBtn = document.getElementById("signup-btn");

const validateAll = attachFormValidation(form, {
  prenom: (v) => isNonEmpty(v) || "Le prénom est requis.",
  nom: (v) => isNonEmpty(v) || "Le nom est requis.",
  email: (v) => isValidEmail(v) || "Adresse email invalide.",
  password: (v) => isValidPassword(v) || "Mot de passe trop faible (8 car., 1 maj., 1 min., 1 chiffre).",
  password2: (v, f) => v === f.password.value || "Les mots de passe ne correspondent pas.",
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.classList.remove("visible");
  if (!validateAll()) return;
  if (!form.cgu.checked) {
    errorBox.textContent = "Vous devez accepter les conditions d'utilisation.";
    errorBox.classList.add("visible");
    return;
  }

  setButtonLoading(signupBtn, true, "Création…");
  try {
    await inscrire({
      email: form.email.value.trim(),
      password: form.password.value,
      prenom: sanitizeText(form.prenom.value),
      nom: sanitizeText(form.nom.value),
    });
    window.location.href = "profil.html?bienvenue=1";
  } catch (err) {
    errorBox.textContent = traduireErreurAuth(err);
    errorBox.classList.add("visible");
  } finally {
    setButtonLoading(signupBtn, false);
  }
});
