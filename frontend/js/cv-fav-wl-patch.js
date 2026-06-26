/* ================================================================
   CINEVERSE — cv-fav-wl-patch.js
   Patches home.js & movie_page.js to use backend API instead of
   localStorage for Favorites and Watchlist.
   Load AFTER cv-api.js and the page's own JS file.
================================================================ */

'use strict';

(function cvPatch() {

  /* ── Wait for DOM and cv-api to be ready ── */
  async function onReady() {
    /* Patch movie_page.js localStorage functions globally */
    if (typeof window.isInWatchlist === 'undefined') {
      /* Define globally so movie_page.js overrides also work */
      window.isInWatchlist  = (id) => CV_Watchlist.has(id);
      window.isInFavourite  = (id) => CV_Favorites.has(id);
      window.toggleWatchlist = async (movie) => {
        const added = await CV_Watchlist.toggle(movie.id);
        cvToast(added ? '📌 Added to Watchlist' : 'Removed from Watchlist', added ? 'success' : '');
        return added;
      };
      window.toggleFavourite = async (movie) => {
        const added = await CV_Favorites.toggle(movie.id);
        cvToast(added ? '♥ Added to Favorites' : 'Removed from Favorites', added ? 'success' : '');
        return added;
      };
    }

    /* Load user lists from backend */
    await cvInitUserLists();

    /* After lists loaded, update any already-rendered buttons */
    refreshAllCardButtons();

    /* Observe DOM for new cards (dynamically rendered) */
    const mo = new MutationObserver(() => refreshAllCardButtons());
    mo.observe(document.body, { childList: true, subtree: true });

    /* Re-wire grid action buttons when movie_page.js re-renders */
    document.addEventListener('cv-grid-rendered', refreshAllCardButtons);
  }

  /* ── Refresh icon/active state of all fav & WL buttons on page ── */
  function refreshAllCardButtons() {
    /* movie_page.js grid: .mgc-fav-btn, .mgc-wl-btn */
    document.querySelectorAll('.mgc-fav-btn').forEach(btn => {
      const movie = safeParseMovie(btn.dataset.movie);
      if (!movie?.id) return;
      const active = CV_Favorites.has(movie.id);
      btn.classList.toggle('active', active);
      btn.innerHTML = heartSvgPatch(active);
    });

    document.querySelectorAll('.mgc-wl-btn').forEach(btn => {
      const movie = safeParseMovie(btn.dataset.movie);
      if (!movie?.id) return;
      const active = CV_Watchlist.has(movie.id);
      btn.classList.toggle('active', active);
      btn.innerHTML = bookmarkSvgPatch(active);
    });
  }

  /* ── Override wireGridActions so clicks call backend ── */
  const _origWireGrid = window.wireGridActions;
  window.wireGridActions = function(root) {
    /* Still call original to set up other events (quickview etc) */
    if (_origWireGrid) _origWireGrid(root);

    /* Then re-wire fav/wl to use backend */
    root.querySelectorAll('.mgc-fav-btn').forEach(btn => {
      const fresh = btn.cloneNode(true);
      btn.parentNode.replaceChild(fresh, btn);
      const movie = safeParseMovie(fresh.dataset.movie);
      if (!movie?.id) return;
      fresh.classList.toggle('active', CV_Favorites.has(movie.id));
      fresh.innerHTML = heartSvgPatch(CV_Favorites.has(movie.id));
      fresh.addEventListener('click', async (e) => {
        e.preventDefault(); e.stopPropagation();
        const loading = fresh.classList.add('cv-loading');
        const added = await CV_Favorites.toggle(movie.id);
        fresh.classList.remove('cv-loading');
        fresh.classList.toggle('active', added);
        fresh.innerHTML = heartSvgPatch(added);
        cvToast(added ? '♥ Added to Favorites' : 'Removed from Favorites', added ? 'success' : '');
      });
    });

    root.querySelectorAll('.mgc-wl-btn').forEach(btn => {
      const fresh = btn.cloneNode(true);
      btn.parentNode.replaceChild(fresh, btn);
      const movie = safeParseMovie(fresh.dataset.movie);
      if (!movie?.id) return;
      fresh.classList.toggle('active', CV_Watchlist.has(movie.id));
      fresh.innerHTML = bookmarkSvgPatch(CV_Watchlist.has(movie.id));
      fresh.addEventListener('click', async (e) => {
        e.preventDefault(); e.stopPropagation();
        const added = await CV_Watchlist.toggle(movie.id);
        fresh.classList.toggle('active', added);
        fresh.innerHTML = bookmarkSvgPatch(added);
        cvToast(added ? '📌 Added to Watchlist' : 'Removed from Watchlist', added ? 'success' : '');
      });
    });
  };

  /* ── Override home.js Watchlist.add calls ── */
  if (typeof window.Watchlist === 'undefined') {
    window.Watchlist = {
      add: async (movie) => {
        const added = await CV_Watchlist.toggle(movie.id);
        cvToast(added ? '📌 Added to Watchlist' : 'Removed from Watchlist', added ? 'success' : '');
      }
    };
  }

  /* ── SVG helpers ── */
  function heartSvgPatch(active) {
    return `<svg viewBox="0 0 24 24" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  }
  function bookmarkSvgPatch(active) {
    return `<svg viewBox="0 0 24 24" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
  }

  function safeParseMovie(json) {
    try { return JSON.parse(json || '{}'); } catch { return {}; }
  }

  /* ── Boot ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

})();