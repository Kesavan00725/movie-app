/* ================================================================
   CINEVERSE — cv-details-patch.js
   Patches movie-details.js to use backend for Watchlist too.
   Load AFTER cv-api.js and movie-details.js.
================================================================ */

'use strict';

(function cvDetailsPatch() {

  async function onReady() {
    /* Load user lists */
    await cvInitUserLists();

    /* Now patch the wireButtons watchlist section */
    const params = new URLSearchParams(window.location.search);
    const detailMovieId = params.get('id');
    if (!detailMovieId) return;

    /* Override the local watchlist functions used by movie-details.js */
    /* These are locally-scoped in movie-details.js so we hook buttons directly */
    patchWatchlistButtons(detailMovieId);
    syncFavStatus(detailMovieId);
  }

  function patchWatchlistButtons(movieId) {
    /* Check initial WL state */
    const wlActive = CV_Watchlist.has(movieId);
    const wlLabel = document.getElementById('watchlist-label');
    const wlBtn = document.getElementById('btn-watchlist');
    const floatWl = document.getElementById('float-wl');

    if (wlLabel) wlLabel.textContent = wlActive ? 'In Watchlist' : 'Add to Watchlist';
    if (wlBtn) wlBtn.style.borderColor = wlActive ? 'var(--gold-dim, #b8860b)' : '';
    if (floatWl) floatWl.classList.toggle('active', wlActive);

    /* Re-wire WL toggle to use backend */
    async function handleWLClick() {
      if (!cvIsLoggedIn()) { cvShowAuthToast(); return; }
      const added = await CV_Watchlist.toggle(movieId);
      const lbl = document.getElementById('watchlist-label');
      const btn = document.getElementById('btn-watchlist');
      const fl  = document.getElementById('float-wl');
      if (lbl) lbl.textContent = added ? 'In Watchlist' : 'Add to Watchlist';
      if (btn) btn.style.borderColor = added ? 'var(--gold-dim, #b8860b)' : '';
      if (fl)  fl.classList.toggle('active', added);
      cvToast(added ? '📌 Added to Watchlist' : 'Removed from Watchlist', added ? 'success' : '');
    }

    /* Clone and replace to remove existing listeners */
    ['btn-watchlist', 'float-wl'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const fresh = el.cloneNode(true);
      el.parentNode.replaceChild(fresh, el);
      fresh.addEventListener('click', handleWLClick);
    });

    /* Re-wire Favorites to use backend */
    async function handleFavClick() {
      if (!cvIsLoggedIn()) { cvShowAuthToast(); return; }
      const added = await CV_Favorites.toggle(movieId);
      updateFavButtons(added);
      cvToast(added ? '♥ Added to Favorites' : 'Removed from Favorites', added ? 'success' : '');
    }

    ['btn-fav-hero', 'float-fav'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const fresh = el.cloneNode(true);
      el.parentNode.replaceChild(fresh, el);
      fresh.addEventListener('click', handleFavClick);
    });
  }

  function syncFavStatus(movieId) {
    const active = CV_Favorites.has(movieId);
    updateFavButtons(active);
  }

  function updateFavButtons(active) {
    const heroIcon  = document.getElementById('fav-hero-icon');
    const heroBtn   = document.getElementById('btn-fav-hero');
    const floatIcon = document.getElementById('float-fav-icon');
    const floatBtn  = document.getElementById('float-fav');
    if (heroIcon)  heroIcon.style.fill  = active ? 'var(--rose, #f43f5e)' : 'none';
    if (heroBtn)   heroBtn.classList.toggle('active', active);
    if (floatIcon) floatIcon.style.fill = active ? 'var(--rose, #f43f5e)' : 'none';
    if (floatBtn)  floatBtn.classList.toggle('active', active);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

})();