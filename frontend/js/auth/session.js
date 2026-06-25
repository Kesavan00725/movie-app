// session.js — Auth state shared across all pages
// Import this wherever you need token access or auth guard

const TOKEN_KEY = 'auth_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

// Call this at the top of any protected page (profile, watchlist, etc.)
// Instantly redirects to login if no token is found
export function requireAuth() {
  if (!localStorage.getItem(TOKEN_KEY)) {
    window.location.href = 'login.html';
  }
}