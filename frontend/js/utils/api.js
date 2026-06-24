// Shared API helpers for non-auth pages (movies, etc.)
// Auth pages use direct fetch calls in js/auth/*.js

const BASE_URL =
  window.location.protocol !== "file:" &&
  (window.location.port === "8000" || window.location.port === "")
    ? window.location.origin
    : "http://127.0.0.1:8000";

const TOKEN_KEY = "auth_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, method = "GET", body = null) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: body ? JSON.stringify(body) : null,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "API request failed");
  }
  return data;
}

export async function fetchMovies(params = "") {
  return request(`/movies${params}`, "GET");
}

export async function fetchMovieDetail(id) {
  return request(`/movies/${id}`, "GET");
}

export { getToken, BASE_URL };
