// profile.js - Load and display user profile from backend
import { getCurrentUser, logout } from "../../utils/api.js";

/**
 * Initialize the profile page.
 * Requires an auth token in localStorage. Redirects to login if missing.
 */
const initProfile = async () => {
  const token = localStorage.getItem("auth_token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const profileName    = document.getElementById("profile-name");
  const profileEmail   = document.getElementById("profile-email");
  const profileJoined  = document.getElementById("profile-joined");
  const profileAvatar  = document.getElementById("profile-avatar");
  const profileError   = document.getElementById("profile-error");
  const profileRetry   = document.getElementById("profile-retry");
  const logoutBtn      = document.getElementById("logout-btn");
  const goHomeBtn      = document.getElementById("go-home-btn");
  const statWatchlist  = document.getElementById("stat-watchlist");
  const statFavorites  = document.getElementById("stat-favorites");
  const statWatched    = document.getElementById("stat-watched");

  const loadProfile = async () => {
    try {
      if (profileError) profileError.hidden = true;

      const user = await getCurrentUser();

      if (profileName)   profileName.textContent  = user.name || "—";
      if (profileEmail)  profileEmail.textContent = user.email || "—";
      if (profileJoined) {
        profileJoined.textContent = "Welcome to CineVerse";
      }

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
      if (statWatched)   statWatched.textContent   = "0";
    } catch (err) {
      console.error("Profile load error:", err);
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("invalid token") || msg.includes("401")) {
        localStorage.removeItem("auth_token");
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
      try {
        await logout();
      } catch {
        localStorage.removeItem("auth_token");
      }
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
