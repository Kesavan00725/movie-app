/* ================================================================
   CINEVERSE — favorites.js
   Fetches and displays the logged-in user's favorites from the
   FastAPI backend. Reuses existing card design patterns.
================================================================ */

'use strict';

const FAV_API_BASE = 'https://movie-app-qhzc.onrender.com';
const FAV_PLACEHOLDER = 'assets/images/placeholder.jpg';

/* ── Token ── */
function favToken() { return localStorage.getItem('access_token') || ''; }
function favLoggedIn() { return !!favToken(); }

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  spawnParticles();

  if (!favLoggedIn()) {
    hideSkeleton();
    showState('fav-auth');
    return;
  }

  updateNavAvatar();

  try {
    const movies = await fetchFavorites();
    hideSkeleton();
    renderFavorites(movies);
  } catch (err) {
    console.error('Favorites load error:', err);
    hideSkeleton();
    showToast('Could not load favorites. Please try again.', 'error');
    showState('fav-empty');
  }
});

/* ── Fetch favorites from backend ── */
async function fetchFavorites() {
  const res = await fetch(`${FAV_API_BASE}/favorites/`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${favToken()}`
    }
  });

  if (res.status === 401) {
    localStorage.removeItem('access_token');
    window.location.href = 'login.html';
    return [];
  }

  if (!res.ok) throw new Error(`${res.status}`);

  const data = await res.json();
  const list = Array.isArray(data) ? data : (data?.items || []);

  /* Each item is a FavoriteResponse or a full MovieResponse.
     Try to get movie details if only ids returned. */
  const movies = [];
  for (const item of list) {
    if (item.title) {
      movies.push(normalizeMovie(item));
    } else {
      /* item has movie_id — fetch movie details */
      const movieId = item.movie_id ?? item.id;
      if (movieId) {
        try {
          const mRes = await fetch(`${FAV_API_BASE}/movies/${movieId}`, {
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${favToken()}` }
          });
          if (mRes.ok) {
            const m = await mRes.json();
            movies.push(normalizeMovie(m));
          }
        } catch {}
      }
    }
  }
  return movies;
}

/* ── Normalize movie ── */
function normalizeMovie(m) {
  const images = Array.isArray(m.images) ? m.images : [];
  const poster = resolveImg(m.poster_url || m.poster_path || images[0]?.image_url || '');
  return {
    id: m.id,
    title: m.title || 'Untitled',
    description: m.description || m.overview || '',
    release_year: m.release_year || (m.release_date ? String(m.release_date).slice(0, 4) : ''),
    duration: m.duration,
    language: m.language || '',
    rating: Number(m.rating ?? m.vote_average ?? 0),
    poster_url: poster || FAV_PLACEHOLDER,
    genre: m.genre || {},
  };
}

function resolveImg(raw) {
  raw = String(raw || '').trim();
  if (!raw || raw === 'null') return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;
  if (raw.startsWith('/')) return FAV_API_BASE + raw;
  return raw;
}

/* ── Render ── */
function renderFavorites(movies) {
  const count = document.getElementById('fav-count');
  if (count) count.textContent = `${movies.length} film${movies.length !== 1 ? 's' : ''}`;

  if (!movies.length) {
    showState('fav-empty');
    return;
  }

  const grid = document.getElementById('fav-grid');
  grid.style.display = '';
  grid.innerHTML = movies.map((m, i) => buildCard(m, i)).join('');

  /* Wire remove buttons */
  grid.querySelectorAll('.fwl-fav-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      const movieId = btn.dataset.id;
      btn.disabled = true;
      btn.style.opacity = '0.5';
      await removeFromFavorites(movieId, btn.closest('.mgc'));
    });
  });

  /* Wire watchlist buttons */
  grid.querySelectorAll('.fwl-wl-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      const movieId = btn.dataset.id;
      const active = btn.classList.contains('active');
      try {
        const method = active ? 'DELETE' : 'POST';
        const res = await fetch(`${FAV_API_BASE}/watchlist/${movieId}`, {
          method,
          headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${favToken()}` }
        });
        if (res.ok || res.status === 404) {
          btn.classList.toggle('active', !active);
          btn.innerHTML = bookmarkSvg(!active);
          showToast(!active ? '📌 Added to Watchlist' : 'Removed from Watchlist', !active ? 'success' : '');
        }
      } catch {
        showToast('Could not update watchlist.', 'error');
      }
    });
  });

  /* Stagger animation */
  grid.querySelectorAll('.mgc').forEach((card, i) => {
    card.style.animationDelay = `${i * 0.05}s`;
  });

  initReveal();
}

async function removeFromFavorites(movieId, cardEl) {
  try {
    const res = await fetch(`${FAV_API_BASE}/favorites/${movieId}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${favToken()}` }
    });

    if (res.ok || res.status === 404) {
      /* Animate card out */
      if (cardEl) {
        cardEl.style.transition = 'opacity 0.3s, transform 0.3s';
        cardEl.style.opacity = '0';
        cardEl.style.transform = 'scale(0.9)';
        setTimeout(() => {
          cardEl.remove();
          /* Update count */
          const remaining = document.querySelectorAll('#fav-grid .mgc').length;
          const count = document.getElementById('fav-count');
          if (count) count.textContent = `${remaining} film${remaining !== 1 ? 's' : ''}`;
          if (remaining === 0) showState('fav-empty');
        }, 320);
      }
      showToast('Removed from Favorites', '');
    } else {
      showToast('Could not remove. Try again.', 'error');
      if (cardEl) {
        const btn = cardEl.querySelector('.fwl-fav-btn');
        if (btn) { btn.disabled = false; btn.style.opacity = ''; }
      }
    }
  } catch {
    showToast('Network error. Could not remove.', 'error');
  }
}

/* ── Card HTML (matches .mgc from movie_page) ── */
function buildCard(m, i) {
  const rating = m.rating ? m.rating.toFixed(1) : '--';
  const year   = m.release_year || '--';
  const genre  = m.genre?.name || 'Film';

  return `
    <div class="mgc" role="listitem" style="animation: fwlFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s both;">
      <div class="mgc-poster">
        <img src="${escHtml(m.poster_url)}" alt="${escHtml(m.title)}" loading="lazy"
             onerror="this.src='${FAV_PLACEHOLDER}'">
        <div class="mgc-rating">
          <svg viewBox="0 0 24 24" fill="#f4c542" width="10" height="10" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          ${rating}
        </div>
        <div class="mgc-gradient"></div>
        <div class="mgc-actions">
          <a href="movie-details.html?id=${m.id}" class="mgc-play-btn" aria-label="Watch ${escHtml(m.title)}">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
          </a>
          <div class="mgc-action-row">
            <button class="mgc-action-btn fwl-wl-btn" data-id="${m.id}" aria-label="Watchlist" title="Add to Watchlist">
              ${bookmarkSvg(false)}
            </button>
            <button class="mgc-action-btn fwl-fav-btn active" data-id="${m.id}" aria-label="Remove from Favorites" title="Remove from Favorites">
              ${heartSvg(true)}
            </button>
          </div>
        </div>
      </div>
      <div class="mgc-info">
        <a href="movie-details.html?id=${m.id}" class="mgc-title">${escHtml(m.title)}</a>
        <div class="mgc-meta-row">
          <span>${year}</span>
          <span class="mgc-genre-tag">${escHtml(genre)}</span>
        </div>
      </div>
    </div>`;
}

/* ── SVGs ── */
function heartSvg(active) {
  return `<svg viewBox="0 0 24 24" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
}

function bookmarkSvg(active) {
  return `<svg viewBox="0 0 24 24" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
}

/* ── UI helpers ── */
function hideSkeleton() {
  const sk = document.getElementById('skeleton-grid');
  if (sk) sk.style.display = 'none';
}

function showState(id) {
  ['fav-grid', 'fav-empty', 'fav-auth'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? '' : 'none';
  });
}

/* ── Toast ── */
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span class="toast__icon">${type === 'success' ? '✓' : type === 'error' ? '!' : 'ℹ'}</span><span class="toast__message">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast--exit');
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}

/* ── Navbar helpers ── */
function updateNavAvatar() {
  const name = localStorage.getItem('user_name') || '';
  const avatar = document.getElementById('nav-avatar');
  if (avatar && name) avatar.textContent = name[0].toUpperCase();
}

function initNavbar() {
  const hamburger = document.getElementById('nav-hamburger');
  const drawer    = document.getElementById('nav-mobile-drawer');
  if (hamburger && drawer) {
    hamburger.addEventListener('click', () => {
      const open = drawer.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(open));
    });
  }
  /* Sticky scroll */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }
}

function spawnParticles() {
  /* No-op if the page doesn't have a particle canvas — graceful */
}

function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  els.forEach(el => io.observe(el));
}

/* ── Escape helpers ── */
function escHtml(v) {
  return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}