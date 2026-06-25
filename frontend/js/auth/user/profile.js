// user/profile.js — CineVerse Profile Page
import { getToken, clearToken, requireAuth } from '../auth/session.js';
import { API_BASE } from '../config/api.js';

// ── Auth guard ─────────────────────────────────
requireAuth();

// ── DOM refs ───────────────────────────────────
const skeleton    = document.getElementById('profile-skeleton');
const errorState  = document.getElementById('profile-error');
const content     = document.getElementById('profile-content');
const retryBtn    = document.getElementById('profile-retry');
const logoutBtn   = document.getElementById('logout-btn');

const avatarEl    = document.getElementById('profile-avatar');
const nameEl      = document.getElementById('profile-name');
const emailEl     = document.getElementById('profile-email');
const joinedEl    = document.getElementById('joined-date');

const statWatched   = document.getElementById('stat-watched');
const statWatchlist = document.getElementById('stat-watchlist');
const statFavorites = document.getElementById('stat-favorites');

// ── UI state helpers ───────────────────────────
function showSkeleton() {
  skeleton.hidden   = false;
  errorState.hidden = true;
  content.hidden    = true;
}

function showError() {
  skeleton.hidden   = true;
  errorState.hidden = false;
  content.hidden    = true;
}

function showContent() {
  skeleton.hidden   = true;
  errorState.hidden = true;
  content.hidden    = false;
}

// ── API calls ──────────────────────────────────
async function fetchProfile(token) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = 'login.html';
    return null;
  }

  if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
  return res.json();
}

async function fetchStats(token) {
  // Non-critical — returns null silently if endpoint doesn't exist yet
  try {
    const res = await fetch(`${API_BASE}/auth/me/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ── DOM population ─────────────────────────────
function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

function populateProfile(user) {
  nameEl.textContent   = user.name || user.full_name || 'Unknown User';
  emailEl.textContent  = user.email || '—';
  joinedEl.textContent = user.created_at ? formatDate(user.created_at) : '—';

  if (user.avatar_url) {
    avatarEl.src = user.avatar_url;
    avatarEl.alt = `${user.name || user.full_name}'s profile picture`;
  }
}

function populateStats(stats) {
  if (!stats) return;
  statWatched.textContent   = stats.watched_count   ?? '0';
  statWatchlist.textContent = stats.watchlist_count ?? '0';
  statFavorites.textContent = stats.favorites_count ?? '0';
}

// ── Main loader ────────────────────────────────
async function loadProfile() {
  const token = getToken();
  if (!token) return;

  showSkeleton();

  try {
    const [user, stats] = await Promise.all([
      fetchProfile(token),
      fetchStats(token)
    ]);

    if (!user) return; // 401 — already redirected

    populateProfile(user);
    populateStats(stats);
    showContent();
  } catch (err) {
    console.error('[Profile] Load error:', err);
    showError();
  }
}

// ── Logout ─────────────────────────────────────
logoutBtn.addEventListener('click', () => {
  clearToken();
  window.location.href = 'login.html';
});

// ── Retry ──────────────────────────────────────
retryBtn.addEventListener('click', loadProfile);

// ── Init ───────────────────────────────────────
loadProfile();