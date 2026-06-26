/* ================================================================
   CINEVERSE — cv-api.js
   Shared module: Backend-backed Favorites & Watchlist via JWT.
   Include this BEFORE home.js / movie_page.js / movie-details.js.
================================================================ */

'use strict';

const CV_API_BASE = 'https://movie-app-qhzc.onrender.com';

/* ── Token ─────────────────────────────────────────────────── */
function cvGetToken() {
  return localStorage.getItem('access_token') || '';
}

function cvIsLoggedIn() {
  return !!cvGetToken();
}

/* ── Authenticated fetch helpers ───────────────────────────── */
async function cvAuthPost(path) {
  const token = cvGetToken();
  const res = await fetch(`${CV_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return res;
}

async function cvAuthDelete(path) {
  const token = cvGetToken();
  const res = await fetch(`${CV_API_BASE}${path}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return res;
}

async function cvAuthGet(path) {
  const token = cvGetToken();
  const res = await fetch(`${CV_API_BASE}${path}`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

/* ================================================================
   FAVORITES (backend-only, no localStorage)
================================================================ */
const CV_Favorites = (() => {
  let _ids = new Set(); // Set of movie_id numbers
  let _loaded = false;

  async function load() {
    if (!cvIsLoggedIn()) { _ids = new Set(); _loaded = true; return; }
    try {
      const data = await cvAuthGet('/favorites/');
      const list = Array.isArray(data) ? data : (data?.items || []);
      // API returns FavoriteResponse: { id, movie_id }
      _ids = new Set(list.map(f => String(f.movie_id ?? f.id)));
      _loaded = true;
    } catch (e) {
      console.warn('CV_Favorites.load failed:', e);
      _ids = new Set();
      _loaded = true;
    }
  }

  function has(movieId) {
    return _ids.has(String(movieId));
  }

  async function toggle(movieId, onSuccess) {
    if (!cvIsLoggedIn()) {
      cvShowAuthToast();
      return false;
    }
    const id = String(movieId);
    try {
      if (_ids.has(id)) {
        const res = await cvAuthDelete(`/favorites/${id}`);
        if (res.ok || res.status === 404) {
          _ids.delete(id);
          if (onSuccess) onSuccess(false);
          return false;
        }
      } else {
        const res = await cvAuthPost(`/favorites/${id}`);
        if (res.ok) {
          _ids.add(id);
          if (onSuccess) onSuccess(true);
          return true;
        }
      }
    } catch (e) {
      console.warn('CV_Favorites.toggle failed:', e);
    }
    return _ids.has(id);
  }

  function isLoaded() { return _loaded; }

  return { load, has, toggle, isLoaded };
})();

/* ================================================================
   WATCHLIST (backend-only, no localStorage)
================================================================ */
const CV_Watchlist = (() => {
  let _ids = new Set();
  let _loaded = false;

  async function load() {
    if (!cvIsLoggedIn()) { _ids = new Set(); _loaded = true; return; }
    try {
      const data = await cvAuthGet('/watchlist/');
      const list = Array.isArray(data) ? data : (data?.items || []);
      _ids = new Set(list.map(w => String(w.movie_id ?? w.id)));
      _loaded = true;
    } catch (e) {
      console.warn('CV_Watchlist.load failed:', e);
      _ids = new Set();
      _loaded = true;
    }
  }

  function has(movieId) {
    return _ids.has(String(movieId));
  }

  async function toggle(movieId, onSuccess) {
    if (!cvIsLoggedIn()) {
      cvShowAuthToast();
      return false;
    }
    const id = String(movieId);
    try {
      if (_ids.has(id)) {
        const res = await cvAuthDelete(`/watchlist/${id}`);
        if (res.ok || res.status === 404) {
          _ids.delete(id);
          if (onSuccess) onSuccess(false);
          return false;
        }
      } else {
        const res = await cvAuthPost(`/watchlist/${id}`);
        if (res.ok) {
          _ids.add(id);
          if (onSuccess) onSuccess(true);
          return true;
        }
      }
    } catch (e) {
      console.warn('CV_Watchlist.toggle failed:', e);
    }
    return _ids.has(id);
  }

  function isLoaded() { return _loaded; }

  return { load, has, toggle, isLoaded };
})();

/* ================================================================
   AUTH TOAST  (login-required prompt)
================================================================ */
function cvShowAuthToast() {
  const existing = document.getElementById('cv-auth-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'cv-auth-toast';
  toast.style.cssText = `
    position:fixed;bottom:28px;right:28px;z-index:99999;
    background:rgba(18,12,8,0.96);
    border:1px solid rgba(232,168,56,0.35);
    border-radius:14px;
    padding:18px 22px;
    display:flex;flex-direction:column;gap:10px;
    box-shadow:0 8px 32px rgba(0,0,0,0.5),0 0 0 1px rgba(232,168,56,0.1);
    backdrop-filter:blur(12px);
    animation:cvToastIn 0.3s cubic-bezier(0.16,1,0.3,1);
    max-width:320px;
  `;
  toast.innerHTML = `
    <style>@keyframes cvToastIn{from{opacity:0;transform:translateY(16px) scale(0.95)}to{opacity:1;transform:none}}</style>
    <div style="display:flex;align-items:center;gap:10px">
      <svg viewBox="0 0 24 24" fill="none" stroke="#e8a838" stroke-width="2" width="20" height="20"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      <span style="font-size:0.9rem;font-weight:600;color:#fff">Sign in Required</span>
    </div>
    <p style="font-size:0.8rem;color:rgba(255,255,255,0.6);margin:0;line-height:1.5">Please sign in to add movies to your Favorites & Watchlist.</p>
    <div style="display:flex;gap:8px;margin-top:2px">
      <a href="login.html" style="flex:1;text-align:center;background:linear-gradient(135deg,#e8a838,#f5c451);color:#0a0a0f;font-size:0.8rem;font-weight:700;padding:8px 12px;border-radius:8px;text-decoration:none;letter-spacing:0.05em">Sign In</a>
      <button onclick="this.closest('#cv-auth-toast').remove()" style="padding:8px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.6);font-size:0.8rem;border-radius:8px;cursor:pointer">Dismiss</button>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 320);
  }, 4000);
}

/* ================================================================
   GENERIC TOAST
================================================================ */
function cvToast(message, type = 'success') {
  const container = document.getElementById('toast-container') || (() => {
    const el = document.createElement('div');
    el.id = 'toast-container';
    el.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(el);
    return el;
  })();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  // Use existing toast CSS if available, else inline
  toast.innerHTML = `
    <span class="toast__icon">${type === 'success' ? '✓' : type === 'error' ? '!' : 'ℹ'}</span>
    <span class="toast__message">${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast--exit');
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}

/* ================================================================
   INIT — call once after DOMContentLoaded on pages that need it
================================================================ */
async function cvInitUserLists() {
  await Promise.all([CV_Favorites.load(), CV_Watchlist.load()]);
}