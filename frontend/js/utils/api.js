// frontend/js/utils/api.js
// Wrapper around fetch for the Movie API backend

const BASE_URL = "http://127.0.0.1:8000";

const TOKEN_KEY = "auth_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function parseErrorDetail(detail) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || String(item)).join(", ");
  }
  return "API request failed";
}

async function request(path, method = "GET", body = null, includeAuth = true) {
  const headers = {
    "Content-Type": "application/json",
    ...(includeAuth ? authHeaders() : {}),
  };
  const opts = {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  };

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, opts);
  } catch {
    throw new Error(
      "Cannot connect to server. Start the backend with: uvicorn main:app --reload --port 8000"
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Server error (${response.status})`);
  }

  if (!response.ok) {
    throw new Error(parseErrorDetail(data.detail));
  }

  return data;
}

// Auth endpoints
export async function signup(data) {
  const result = await request("/auth/signup", "POST", data, false);
  if (result.access_token) setToken(result.access_token);
  return result;
}

export async function login(data) {
  const result = await request("/auth/login", "POST", data, false);
  if (result.access_token) setToken(result.access_token);
  return result;
}

export async function logout() {
  const result = await request("/auth/logout", "POST", null, true);
  clearToken();
  return result;
}

export async function getCurrentUser() {
  return await request("/auth/me", "GET", null, true);
}

// Movie endpoints
export async function fetchMovies(params = "") {
  return await request(`/movies${params}`, "GET", null, true);
}

export async function fetchMovieDetail(id) {
  return await request(`/movies/${id}`, "GET", null, true);
}

export { getToken, setToken, clearToken, BASE_URL };
