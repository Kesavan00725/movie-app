// auth/login.js — CineVerse Login
import { showToast } from "../components/toast.js";
import { API_BASE } from "../config/api.js";
import { setToken, isLoggedIn } from "./session.js";

// ── Redirect if already logged in ─────────────
if (isLoggedIn()) {
  window.location.href = "profile.html";
}

// ── Password toggle ────────────────────────────
document.querySelectorAll(".inputForm").forEach((container) => {
  const input     = container.querySelector("input");
  const toggleBtn = container.querySelector(".password-toggle-btn");
  if (input && toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      toggleBtn.style.color = isPassword ? "var(--primary-color)" : "";
    });
  }
});

// ── DOM refs ───────────────────────────────────
const form          = document.getElementById("login-form");
const emailInput    = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError    = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");
const formError     = document.getElementById("form-error");
const submitBtn     = document.getElementById("login-submit");

// ── Validation ─────────────────────────────────
function validate() {
  let valid = true;

  emailError.textContent    = "";
  passwordError.textContent = "";
  formError.textContent     = "";

  if (!emailInput.value.trim()) {
    emailError.textContent = "Email is required.";
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) {
    emailError.textContent = "Enter a valid email address.";
    valid = false;
  }

  if (!passwordInput.value) {
    passwordError.textContent = "Password is required.";
    valid = false;
  }

  return valid;
}

// ── API call ───────────────────────────────────
async function loginUser(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Server error (${response.status})`);
  }

  if (!response.ok) {
    const detail = data.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((i) => i.msg || String(i)).join(", ")
          : "Login failed. Please try again.";
    throw new Error(message);
  }

  return data;
}

// ── Submit handler ─────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validate()) return;

  submitBtn.disabled     = true;
  submitBtn.textContent  = "Signing in...";

  try {
    const data = await loginUser(
      emailInput.value.trim(),
      passwordInput.value
    );

    if (data.access_token) {
      setToken(data.access_token);
    }

    showToast("Login successful! Taking you to your profile...", "success");
    setTimeout(() => {
      window.location.href = "profile.html";
    }, 1200);

  } catch (err) {
    const message = err.message || "Login failed. Please try again.";
    formError.textContent = message;
    showToast(message, "error");
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = "Sign In";
  }
});