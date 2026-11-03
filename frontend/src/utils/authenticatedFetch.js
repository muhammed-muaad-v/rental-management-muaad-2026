
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Simultaneous requests oru refresh request share cheyyum
let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refresh");

  if (!refreshToken) {
    throw new Error("Refresh token missing");
  }

  const response = await fetch(
    `${API_BASE}/api/users/token/refresh/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Refresh failed");
  }

  const data = await response.json();

  if (!data.access) {
    throw new Error("New access token kittiyilla.");
  }

  localStorage.setItem("access", data.access);

  // Refresh token rotation enabled aanenkil puthiya token save cheyyuka
  if (data.refresh) {
    localStorage.setItem("refresh", data.refresh);
  }

  return data.access;
}


export async function authenticatedFetch(url, options = {}) {
  const sendRequest = (token) => {
    const headers = new Headers(options.headers || {});

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };

  let accessToken = localStorage.getItem("access");
  let response = await sendRequest(accessToken);

  if (response.status === 401) {
    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      accessToken = await refreshPromise;

      // Retry using the newly refreshed access token
      response = await sendRequest(accessToken);
    } catch (error) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      throw new Error("Session expired. Please log in again.");
    }
  }

  return response;
}
