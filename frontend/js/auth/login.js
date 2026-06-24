// login.js - Frontend login with backend API
import { showToast } from "../components/toast.js";

// Backend base URL (FastAPI runs on port 8000)
const API_BASE_URL =
  window.location.protocol !== "file:" &&
  (window.location.port === "8000" || window.location.port === "")
    ? window.location.origin
    : "http://127.0.0.1:8000";

const TOKEN_KEY = "auth_token";

/**
 * POST /auth/login
 * Backend expects: { email, password }
 * Backend returns: { access_token, token_type }
 */
async function loginUser({ email, password }) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
          : "Login failed";
    throw new Error(message);
  }

  if (data.access_token) {
    localStorage.setItem(TOKEN_KEY, data.access_token);
  }

  return data;
}

const initLogin = () => {
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

  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const formError = document.getElementById("form-error");
  const submitBtn = document.getElementById("login-submit");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (emailError) emailError.textContent = "";
      if (passwordError) passwordError.textContent = "";
      if (formError) formError.textContent = "";

      let hasError = false;

      if (!emailInput.value.trim()) {
        if (emailError) emailError.textContent = "Email is required.";
        hasError = true;
      }
      if (!passwordInput.value.trim()) {
        if (passwordError) passwordError.textContent = "Password is required.";
        hasError = true;
      }

      if (hasError) return;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Signing in...";
      }

      try {
        await loginUser({
          email: emailInput.value.trim(),
          password: passwordInput.value,
        });

        showToast("Login successful! Taking you to your profile...", "success");
        setTimeout(() => {
          window.location.href = "profile.html";
        }, 1200);
      } catch (err) {
        const message =
          window.location.protocol === "file:"
            ? "Open http://127.0.0.1:8000/app/login.html (do not open the HTML file directly)."
            : err.message || "Login failed";
        showToast(message, "error");
        if (formError) formError.textContent = message;
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Sign In";
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
    initLogin();
  });
} else {
  if (localStorage.getItem(TOKEN_KEY)) {
    window.location.href = "profile.html";
  } else {
    initLogin();
  }
}
