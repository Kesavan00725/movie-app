// logout.js — Clears session and redirects to login
// Import and call logout() from any page that has a logout button

import { clearToken } from './session.js';

export function logout() {
  clearToken();
  window.location.href = 'login.html';
}