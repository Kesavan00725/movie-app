// auth/signup.js — CineVerse Signup
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
const form            = document.getElementById("signup-form");
const nameInput       = document.getElementById("full-name");
const emailInput      = document.getElementById("email");
const passwordInput   = document.getElementById("password");
const confirmInput    = document.getElementById("confirm-password");
const nameError       = document.getElementById("full-name-error");
const emailError      = document.getElementById("email-error");
const passwordError   = document.getElementById("password-error");
const confirmError    = document.getElementById("confirm-password-error");
const formError       = document.getElementById("form-error");
const submitBtn       = document.getElementById("signup-submit");

// ── Validation ─────────────────────────────────
function validate() {
  let valid = true;

  nameError.textContent    = "";
  emailError.textContent   = "";
  passwordError.textContent = "";
  confirmError.textContent = "";
  formError.textContent    = "";

  if (!nameInput.value.trim()) {
    nameError.textContent = "Full name is required.";
    valid = false;
  }

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
  } else if (passwordInput.value.length < 8) {
    passwordError.textContent = "Password must be at least 8 characters.";
    valid = false;
  }

  if (!confirmInput.value) {
    confirmError.textContent = "Please confirm your password.";
    valid = false;
  } else if (passwordInput.value !== confirmInput.value) {
    confirmError.textContent = "Passwords do not match.";
    valid = false;
  }

  return valid;
}

// ── API call ───────────────────────────────────
async function signupUser(name, email, password) {
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
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
          : "Signup failed. Please try again.";
    throw new Error(message);
  }

  return data;
}

// ── Submit handler ─────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validate()) return;

  submitBtn.disabled    = true;
  submitBtn.textContent = "Creating account...";

  try {
    const data = await signupUser(
      nameInput.value.trim(),
      emailInput.value.trim(),
      passwordInput.value
    );

    if (data.access_token) {
      setToken(data.access_token);
    }

    showToast("Account created! Taking you to your profile...", "success");
    setTimeout(() => {
      window.location.href = "profile.html";
    }, 1200);

  } catch (err) {
    const message = err.message || "Signup failed. Please try again.";
    formError.textContent = message;
    showToast(message, "error");
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = "Sign Up";
  }
});