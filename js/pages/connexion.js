import { renderLayout } from "../modules/layout.js";
import { connecter, reinitialiserMotDePasse, traduireErreurAuth } from "../modules/auth.js";
import { attachFormValidation, isValidEmail, isNonEmpty } from "../modules/validation.js";
import { setButtonLoading, showToast } from "../modules/ui-utils.js";

renderLayout();

const form = document.getElementById("login-form");
const errorBox = document.getElementById("auth-error");
const loginBtn = document.getElementById("login-btn");

const validateAll = attachFormValidation(form, {
  email: (v) => isValidEmail(v) || "Adresse email invalide.",
  password: (v) => isNonEmpty(v) || "Le mot de passe est requis.",
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.classList.remove("visible");
  if (!validateAll()) return;

  setButtonLoading(loginBtn, true, "Connexion…");
  try {
    await connecter(form.email.value.trim(), form.password.value);
    const params = new URLSearchParams(window.location.search);
    window.location.href = params.get("retour") || "index.html";
  } catch (err) {
    errorBox.textContent = traduireErreurAuth(err);
    errorBox.classList.add("visible");
  } finally {
    setButtonLoading(loginBtn, false);
  }
});

document.getElementById("forgot-link").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = form.email.value.trim();
  if (!isValidEmail(email)) {
    errorBox.textContent = "Saisissez d'abord votre adresse email ci-dessus, puis cliquez à nouveau.";
    errorBox.classList.add("visible");
    return;
  }
  try {
    await reinitialiserMotDePasse(email);
    showToast("Email de réinitialisation envoyé.", "success");
  } catch (err) {
    errorBox.textContent = traduireErreurAuth(err);
    errorBox.classList.add("visible");
  }
});
