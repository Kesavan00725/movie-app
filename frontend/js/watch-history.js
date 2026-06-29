/* ================================================================
   CINEVERSE — watch-history.js  v2.0
   Watch History module.
   GET    /watch-history/
   GET    /watch-history/continue-watching
   GET    /watch-history/{movie_id}
   POST   /watch-history/
   PATCH  /watch-history/{movie_id}/complete
================================================================ */

'use strict';

const WH_BASE = 'https://cineverse-movie-app.onrender.com';
const WH_PLACEHOLDER = 'assets/images/placeholder.jpg';

function whToken()    { return localStorage.getItem('access_token') || ''; }
function whLoggedIn() { return !!whToken(); }

function whHeaders() {
  return { 'Accept': 'application/json', 'Authorization': `Bearer ${whToken()}` };
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();

  if (!whLoggedIn()) {
    hideSkeleton();
    showSection('wh-auth');
    return;
  }

  updateNavAvatar();

  try {
    await loadAllData();
    hideSkeleton();
    await renderAll();
  } catch (err) {
    console.error('[WH]', err);
    hideSkeleton();
    toast('Could not load watch history. Please try again.', 'error');
    showSection('wh-empty');
  }
});

/* ================================================================
   DATA LOADING
================================================================ */
let allHistory = [];
let continueWatching = [];

async function loadAllData() {
  const [historyRes, continueRes] = await Promise.all([
    fetch(`${WH_BASE}/watch-history/`, { headers: whHeaders() }),
    fetch(`${WH_BASE}/watch-history/continue-watching`, { headers: whHeaders() })
  ]);

  if (historyRes.status === 401 || continueRes.status === 401) {
    localStorage.removeItem('access_token');
    window.location.href = 'login.html';
    return;
  }

  if (!historyRes.ok) throw new Error(`GET /watch-history/ → ${historyRes.status}`);
  if (!continueRes.ok) throw new Error(`GET /watch-history/continue-watching → ${continueRes.status}`);

  allHistory = await historyRes.json();
  continueWatching = await continueRes.json();

  /* Normalize each item to include full movie data */
  allHistory = await Promise.all(allHistory.map(item => normalizeHistoryItem(item)));
  continueWatching = await Promise.all(continueWatching.map(item => normalizeHistoryItem(item)));
}

/* Fetch full movie data if needed */
async function normalizeHistoryItem(item) {
  const movieId = item.movie_id || item.id;
  if (!movieId) return null;

  try {
    /* Try to get full movie data */
    const mRes = await fetch(`${WH_BASE}/movies/${movieId}`, { headers: whHeaders() });
    if (mRes.ok) {
      const movie = await mRes.json();
      return {
        id: item.id,
        user_id: item.user_id,
        movie_id: movieId,
        watched_at: item.watched_at,
        progress: item.progress || 0,
        completed: item.completed || false,
        /* Full movie data */
        movie: {
          id: movie.id,
          title: movie.title || 'Untitled',
          description: movie.description || '',
          release_year: movie.release_year || '',
          rating: Number(movie.rating ?? 0),
          poster_url: resolveImg(movie.poster_url || ''),
          duration: Number(movie.duration ?? 0),
          genre: movie.genre || {}
        }
      };
    }
  } catch (e) {
    console.warn('[WH] Failed to load movie', movieId, e);
  }

  return null;
}

function resolveImg(raw) {
  raw = String(raw || '').trim();
  if (!raw || raw === 'null') return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;
  if (raw.startsWith('/')) return WH_BASE + raw;
  return raw;
}

/* ================================================================
   RENDER ALL
================================================================ */
async function renderAll() {
  allHistory = allHistory.filter(Boolean);
  continueWatching = continueWatching.filter(Boolean);

  if (!allHistory.length) {
    showSection('wh-empty');
    return;
  }

  /* Update statistics */
  updateStats();

  /* Show sections */
  document.getElementById('section-continue').style.display = continueWatching.length > 0 ? '' : 'none';
  document.getElementById('section-history').style.display = '';

  /* Render carousel */
  if (continueWatching.length > 0) {
    renderContinueCarousel();
  }

  /* Render history grid */
  renderHistoryGrid();

  /* Trigger scroll reveal animations */
  setTimeout(revealAnimations, 100);
}

/* ── Update Stats ── */
function updateStats() {
  const totalWatched = allHistory.length;
  const totalCompleted = allHistory.filter(item => item.completed).length;
  const totalContinue = continueWatching.length;
  const totalTime = calculateTotalTime();

document.getElementById("stat-movies-watched").textContent = totalWatched;
document.getElementById("stat-continue-watching").textContent = totalContinue;
document.getElementById("stat-completed").textContent = totalCompleted;
document.getElementById("stat-watch-time").textContent = formatWatchTime(totalTime);
}

function calculateTotalTime() {
  /* Sum of duration for all completed movies */
  return allHistory
    .filter(item => item.completed && item.movie)
    .reduce((sum, item) => sum + (item.movie.duration || 0), 0);
}

function formatWatchTime(seconds) {
  if (!seconds) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/* ── Render Continue Watching ── */
function renderContinueCarousel() {
  const carousel = document.getElementById('continue-track');
  carousel.innerHTML = continueWatching
    .map((item, i) => buildContinueCard(item, i))
    .join('');

  /* Wire resume buttons */
  carousel.querySelectorAll('.wh-btn-resume').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const movieId = btn.dataset.id;
      window.location.href = `movie-details.html?id=${movieId}`;
    });
  });
}

function buildContinueCard(item, i) {
  const movie = item.movie;
  if (!movie) return '';

  const progressPct = item.progress && movie.duration
    ? Math.min(100, Math.round((item.progress / movie.duration) * 100))
    : 0;

  const poster = movie.poster_url || WH_PLACEHOLDER;

  return `
    <div class="wh-carousel-item" role="listitem" style="animation:carouselSlideIn 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s both">
      <div class="wh-continue-card">
        <div class="wh-continue-poster">
          <img src="${esc(poster)}" alt="${esc(movie.title)}" loading="lazy" onerror="this.src='${WH_PLACEHOLDER}'">
          <div class="wh-continue-overlay">
            <div class="wh-continue-info">
              <div class="wh-continue-title">${esc(movie.title)}</div>
              <div class="wh-progress-wrap">
                <div class="wh-progress-bar">
                  <div class="wh-progress-fill" style="width:${progressPct}%"></div>
                </div>
                <div class="wh-progress-text">${progressPct}% watched</div>
              </div>
              <div class="wh-continue-actions">
                <button class="wh-btn-resume" data-id="${movie.id}" aria-label="Resume watching ${esc(movie.title)}">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><polygon points="5 3 19 12 5 21"/></svg>
                  Resume
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

/* ── Render History Grid ── */
function renderHistoryGrid() {
  const grid = document.getElementById('wh-history-grid');
  grid.innerHTML = allHistory
    .map((item, i) => buildHistoryCard(item, i))
    .join('');

  showSection('wh-history-grid');

  /* Wire card actions */
  grid.querySelectorAll('.wh-btn-resume').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const movieId = btn.dataset.id;
      window.location.href = `movie-details.html?id=${movieId}`;
    });
  });

  grid.querySelectorAll('.wh-btn-mark-complete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      if (btn.dataset.loading) return;
      const movieId = btn.dataset.id;
      const card = btn.closest('.mgc');
      btn.dataset.loading = '1';
      btn.style.opacity = '0.4';
      await markMovieComplete(movieId, card);
      delete btn.dataset.loading;
      btn.style.opacity = '';
    });
  });
}

function buildHistoryCard(item, i) {
  const movie = item.movie;
  if (!movie) return '';

  const poster = movie.poster_url || WH_PLACEHOLDER;
  const rating = movie.rating ? movie.rating.toFixed(1) : '--';
  const year = movie.release_year || '--';
  const genre = movie.genre?.name || 'Film';
  const watchedDate = formatWatchedDate(item.watched_at);

  const progressPct = item.progress && movie.duration
    ? Math.min(100, Math.round((item.progress / movie.duration) * 100))
    : 0;

  return `
    <div class="mgc" role="listitem" style="animation:fwlFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s both">
      <div class="mgc-poster">
        <img src="${esc(poster)}" alt="${esc(movie.title)}" loading="lazy" onerror="this.src='${WH_PLACEHOLDER}'">
        <div class="mgc-rating">
          <svg viewBox="0 0 24 24" fill="#f4c542" width="10" height="10"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          ${rating}
        </div>
        <div class="mgc-gradient"></div>
        <div class="wh-history-card-overlay">
          <div class="wh-card-meta">
            <div class="wh-watched-date">Watched ${watchedDate}</div>
            ${item.completed ? `<div class="wh-completion-badge">
              <svg viewBox="0 0 24 24" fill="currentColor"><polyline points="20 6 9 17 4 12"/></svg>
              Completed
            </div>` : `<div class="wh-card-progress">
              ${progressPct}% watched
            </div>`}
          </div>
          <div class="wh-card-actions">
            <button class="wh-btn-small wh-btn-resume" data-id="${movie.id}" aria-label="Resume watching ${esc(movie.title)}">
              <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><polygon points="5 3 19 12 5 21"/></svg>
              Resume
            </button>
            ${!item.completed ? `<button class="wh-btn-small wh-btn-mark-complete" data-id="${movie.id}" aria-label="Mark ${esc(movie.title)} as complete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
              Complete
            </button>` : ''}
          </div>
        </div>
      </div>
      <div class="mgc-info">
        <a href="movie-details.html?id=${movie.id}" class="mgc-title">${esc(movie.title)}</a>
        <div class="mgc-meta-row">
          <span>${year}</span>
          <span class="mgc-genre-tag">${esc(genre)}</span>
        </div>
      </div>
    </div>`;
}

function formatWatchedDate(dateStr) {
  if (!dateStr) return 'recently';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

/* – Mark as Complete ── */
async function markMovieComplete(movieId, cardEl) {
  try {
    const res = await fetch(`${WH_BASE}/watch-history/${movieId}/complete`, {
      method: 'PATCH',
      headers: whHeaders()
    });

    if (res.ok) {
      /* Update local state */
      const item = allHistory.find(x => x.movie_id === movieId);
      if (item) {
        item.completed = true;
        /* Re-render card to show completion badge */
        const idx = allHistory.findIndex(x => x.movie_id === movieId);
        if (idx !== -1) {
          const grid = document.getElementById('history-grid');
          const cards = grid.querySelectorAll('.mgc');
          if (cards[idx]) {
            cards[idx].outerHTML = buildHistoryCard(item, idx);
            /* Re-wire new card */
            const newCard = cards[idx].parentNode.querySelector('.mgc');
            const newBtn = newCard?.querySelector('.wh-btn-resume');
            if (newBtn) {
              newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = `movie-details.html?id=${movieId}`;
              });
            }
          }
        }
      }
      /* Update stats */
      updateStats();
      toast('✓ Marked as complete', 'success');
    } else {
      toast('Could not update. Please try again.', 'error');
    }
  } catch { toast('Network error.', 'error'); }
}

/* ================================================================
   HELPERS
================================================================ */
function hideSkeleton() {
  const sk = document.getElementById('wh-skeleton-grid');
  if (sk) sk.style.display = 'none';
}

function showSection(id) {
  if (id === 'history-grid') {
    document.getElementById('history-grid').style.display = '';
  } else if (id === 'wh-empty') {
    document.getElementById('wh-empty').style.display = '';
    document.getElementById('wh-auth').style.display = 'none';
  } else if (id === 'wh-auth') {
    document.getElementById('wh-auth').style.display = '';
    document.getElementById('wh-empty').style.display = 'none';
  }
}

function toast(msg, type = 'success') {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id='toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.innerHTML = `<span class="toast__icon">${type==='success'?'✓':'!'}</span><span class="toast__message">${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('toast--exit'); setTimeout(() => t.remove(), 350); }, 3000);
}

function updateNavAvatar() {
  const name = localStorage.getItem('user_name') || '';
  const el = document.getElementById('nav-avatar');
  if (el && name) el.textContent = name[0].toUpperCase();
}

function initNavbar() {
  const h = document.getElementById('nav-hamburger');
  const d = document.getElementById('nav-mobile-drawer');
  if (h && d) h.addEventListener('click', () => { const o = d.classList.toggle('open'); h.setAttribute('aria-expanded', String(o)); });
  const nb = document.querySelector('.navbar');
  if (nb) window.addEventListener('scroll', () => nb.classList.toggle('scrolled', scrollY > 40), { passive: true });
}

function esc(v) {
  return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Scroll Reveal Animations ── */
function revealAnimations() {
  const reveals = document.querySelectorAll('.reveal, .reveal-scale');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });
  reveals.forEach(el => observer.observe(el));
}
const profileBtn =
document.getElementById(
'profile-btn'
);


const dropdown =
document.getElementById(
'profile-dropdown'
);


profileBtn.onclick=()=>{

dropdown.classList.toggle(
'active'
);

};



document.addEventListener(

'click',

e=>{

if(

!profileBtn.contains(e.target)

&&

!dropdown.contains(e.target)

){

dropdown.classList.remove(

'active'

);

}

}

);



const username=

localStorage.getItem(

'user_name'

)||'Guest';



const email=

localStorage.getItem(

'user_email'

)||'';



document.getElementById(

'dropdown-name'

).textContent=username;



document.getElementById(

'dropdown-email'

).textContent=email;



const initial=

username.charAt(

0

).toUpperCase();



profileBtn.textContent=initial;



document.getElementById(

'dropdown-avatar'

).textContent=initial;



document.getElementById(

'logout-btn'

).onclick=()=>{


localStorage.clear();



window.location.href=

'login.html';


};