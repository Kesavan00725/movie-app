// profile.js - Load user profile from backend API
import { showToast } from "../../components/toast.js";

const API_BASE_URL =
  window.location.protocol !== "file:" &&
  (window.location.port === "8000" || window.location.port === "")
    ? window.location.origin
    : "http://127.0.0.1:8000";

const TOKEN_KEY = "auth_token";

/**
 * GET /auth/me
 * Backend expects header: Authorization: Bearer <token>
 * Backend returns: { name, email }
 */
async function fetchCurrentUser() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error("Not authenticated");
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error("Cannot connect to server.");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Server error (${response.status})`);
  }

  if (!response.ok) {
    throw new Error(data.detail || "Failed to load profile");
  }

  return data;
}

/**
 * POST /auth/logout
 * Backend expects header: Authorization: Bearer <token>
 */
async function logoutUser() {
  const token = localStorage.getItem(TOKEN_KEY);

  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    // Clear local session even if network fails
  }

  localStorage.removeItem(TOKEN_KEY);
}

const initProfile = async () => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const profileName = document.getElementById("profile-name");
  const profileEmail = document.getElementById("profile-email");
  const profileJoined = document.getElementById("profile-joined");
  const profileAvatar = document.getElementById("profile-avatar");
  const profileError = document.getElementById("profile-error");
  const profileRetry = document.getElementById("profile-retry");
  const logoutBtn = document.getElementById("logout-btn");
  const goHomeBtn = document.getElementById("go-home-btn");
  const statWatchlist = document.getElementById("stat-watchlist");
  const statFavorites = document.getElementById("stat-favorites");
  const statWatched = document.getElementById("stat-watched");

  const loadProfile = async () => {
    try {
      if (profileError) profileError.hidden = true;

      const user = await fetchCurrentUser();

      if (profileName) profileName.textContent = user.name || "—";
      if (profileEmail) profileEmail.textContent = user.email || "—";
      if (profileJoined) profileJoined.textContent = "Welcome to CineVerse";

      if (profileAvatar) {
        const initials = (user.name || "U")
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        profileAvatar.onerror = () => {
          profileAvatar.style.display = "none";
          const avatarWrapper = profileAvatar.parentElement;
          if (avatarWrapper && !avatarWrapper.querySelector(".profile-avatar-initials")) {
            const initialsEl = document.createElement("div");
            initialsEl.className = "profile-avatar-initials";
            initialsEl.textContent = initials;
            avatarWrapper.appendChild(initialsEl);
          }
        };
      }

      if (statWatchlist) statWatchlist.textContent = "0";
      if (statFavorites) statFavorites.textContent = "0";
      if (statWatched) statWatched.textContent = "0";
    } catch (err) {
      console.error("Profile load error:", err);
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("invalid token") || msg.includes("401") || msg.includes("not authenticated")) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "login.html";
        return;
      }
      if (profileError) profileError.hidden = false;
    }
  };

  await loadProfile();

  if (profileRetry) {
    profileRetry.addEventListener("click", loadProfile);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await logoutUser();
      showToast("Logged out", "success");
      window.location.href = "login.html";
    });
  }

  if (goHomeBtn) {
    goHomeBtn.addEventListener("click", () => {
      window.location.href = "home.html";
    });
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProfile);
} else {
  initProfile();
}
