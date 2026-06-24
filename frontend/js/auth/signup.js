// signup.js - Frontend registration with backend API
import { showToast } from "../components/toast.js";

// Backend base URL (FastAPI runs on port 8000)
const API_BASE_URL =
  window.location.protocol !== "file:" &&
  (window.location.port === "8000" || window.location.port === "")
    ? window.location.origin
    : "http://127.0.0.1:8000";

const TOKEN_KEY = "auth_token";

/**
 * POST /auth/signup
 * Backend expects: { name, email, password }
 * Backend returns: { name, email, access_token, token_type }
 */
async function signupUser({ name, email, password }) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });
  } catch {
    throw new Error(
      "Cannot connect to server. Start backend: uvicorn main:app --reload --port 8000"
    );
  }

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
          ? detail.map((item) => item.msg || String(item)).join(", ")
          : "Signup failed";
    throw new Error(message);
  }

  if (data.access_token) {
    localStorage.setItem(TOKEN_KEY, data.access_token);
  }

  return data;
}

const initSignup = () => {
  const inputForms = document.querySelectorAll(".inputForm");
  inputForms.forEach((container) => {
    const input = container.querySelector("input");
    const toggleBtn = container.querySelector(".password-toggle-btn");
    if (input && toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        if (input.type === "password") {
          input.type = "text";
          toggleBtn.style.color = "var(--primary-color)";
        } else {
          input.type = "password";
          toggleBtn.style.color = "";
        }
      });
    }
  });

  const form = document.getElementById("signup-form");
  const nameInput = document.getElementById("full-name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("confirm-password");

  const nameError = document.getElementById("full-name-error");
  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const confirmError = document.getElementById("confirm-password-error");
  const formError = document.getElementById("form-error");
  const submitBtn = document.getElementById("signup-submit");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (nameError) nameError.textContent = "";
      if (emailError) emailError.textContent = "";
      if (passwordError) passwordError.textContent = "";
      if (confirmError) confirmError.textContent = "";
      if (formError) formError.textContent = "";

      let hasError = false;

      if (!nameInput.value.trim()) {
        if (nameError) nameError.textContent = "Full name is required.";
        hasError = true;
      }
      if (!emailInput.value.trim()) {
        if (emailError) emailError.textContent = "Email is required.";
        hasError = true;
      }
      if (!passwordInput.value.trim()) {
        if (passwordError) passwordError.textContent = "Password is required.";
        hasError = true;
      } else if (passwordInput.value.length < 8) {
        if (passwordError) passwordError.textContent = "Password must be at least 8 characters.";
        hasError = true;
      }
      if (!confirmInput.value.trim()) {
        if (confirmError) confirmError.textContent = "Please confirm your password.";
        hasError = true;
      } else if (passwordInput.value !== confirmInput.value) {
        if (confirmError) confirmError.textContent = "Passwords do not match.";
        hasError = true;
      }

      if (hasError) return;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Signing up...";
      }

      try {
        await signupUser({
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          password: passwordInput.value,
        });

        showToast("Account created! Taking you to your profile...", "success");
        setTimeout(() => {
          window.location.href = "profile.html";
        }, 1200);
      } catch (err) {
        const message =
          window.location.protocol === "file:"
            ? "Open http://127.0.0.1:8000/app/signup.html (do not open the HTML file directly)."
            : err.message || "Signup failed";
        showToast(message, "error");
        if (formError) formError.textContent = message;
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Sign Up";
        }
      }
    });
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem(TOKEN_KEY)) {
      window.location.href = "profile.html";
      return;
    }
    initSignup();
  });
} else {
  if (localStorage.getItem(TOKEN_KEY)) {
    window.location.href = "profile.html";
  } else {
    initSignup();
  }
}
