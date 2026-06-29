"use strict";

/* ==========================================================
   CineVerse - Watch History
   ========================================================== */

let watchHistory = [];
let continueWatching = [];

const elements = {
    grid: document.getElementById("wh-grid"),
    carousel: document.getElementById("wh-carousel"),

    skeleton: document.getElementById("wh-skeleton-grid"),

    empty: document.getElementById("wh-empty"),
    auth: document.getElementById("wh-auth"),

    continueSection: document.getElementById("wh-continue-section"),

    count: document.getElementById("wh-count"),

    statWatched: document.getElementById("stat-watched"),
    statContinue: document.getElementById("stat-continue"),
    statCompleted: document.getElementById("stat-completed"),
    statTime: document.getElementById("stat-time"),

    prevBtn: document.getElementById("carousel-prev"),
    nextBtn: document.getElementById("carousel-next")
};

/* ==========================================================
   Init
   ========================================================== */

document.addEventListener("DOMContentLoaded", initWatchHistory);

async function initWatchHistory() {

    if (!localStorage.getItem("cv_token")) {

        showAuthRequired();
        return;

    }

    try {

        showLoading();

        await loadHistory();

        await loadContinueWatching();

        renderStatistics();

        renderContinueSection();

        renderHistoryGrid();

        hideLoading();

        setupCarousel();

        setupNavbar();

    }

    catch (err) {

        console.error(err);

        hideLoading();

        showToast("Failed to load watch history.", "error");

    }

}

/* ==========================================================
   API
   ========================================================== */

async function loadHistory() {

    const res = await CV_WatchHistory.getHistory();

    if (!res.ok) {

        throw new Error("History request failed");

    }

    watchHistory = await res.json();

}

async function loadContinueWatching() {

    const res = await CV_WatchHistory.getContinueWatching();

    if (!res.ok) {

        continueWatching = [];
        return;

    }

    continueWatching = await res.json();

}

/* ==========================================================
   Statistics
   ========================================================== */

function renderStatistics() {

    const watched = watchHistory.length;

    const completed = watchHistory.filter(item => item.completed).length;

    const continueCount = continueWatching.length;

    let totalSeconds = 0;

    watchHistory.forEach(item => {

        totalSeconds += item.progress || 0;

    });

    const hours = (totalSeconds / 3600).toFixed(1);

    elements.count.textContent =
        `${watched} film${watched === 1 ? "" : "s"}`;

    animateNumber(elements.statWatched, watched);

    animateNumber(elements.statContinue, continueCount);

    animateNumber(elements.statCompleted, completed);

    elements.statTime.textContent = `${hours}h`;

}

/* ==========================================================
   Loading
   ========================================================== */

function showLoading() {

    elements.skeleton.style.display = "grid";

    elements.grid.style.display = "none";

    elements.empty.style.display = "none";

}

function hideLoading() {

    elements.skeleton.style.display = "none";

    elements.grid.style.display = "grid";

}

/* ==========================================================
   Empty/Auth
   ========================================================== */

function showAuthRequired() {

    elements.auth.style.display = "flex";

    elements.skeleton.style.display = "none";

    elements.grid.style.display = "none";

    elements.empty.style.display = "none";

}

function showEmpty() {

    elements.empty.style.display = "flex";

    elements.grid.style.display = "none";

}

/* ==========================================================
   Counter Animation
   ========================================================== */

function animateNumber(element, value) {

    let current = 0;

    const step = Math.max(1, Math.ceil(value / 20));

    const timer = setInterval(() => {

        current += step;

        if (current >= value) {

            current = value;

            clearInterval(timer);

        }

        element.textContent = current;

    }, 25);

}