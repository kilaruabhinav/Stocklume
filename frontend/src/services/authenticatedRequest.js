import { getAccessToken, logoutUser } from "./Auth/authStorage";

export class AuthenticatedRequestError extends Error {
  constructor(message, { status = 0, data = null, isUnauthorized = false } = {}) {
    super(message);
    this.name = "AuthenticatedRequestError";
    this.status = status;
    this.data = data;
    this.isUnauthorized = isUnauthorized;
  }
}

function getRedirectPath() {
  const currentPath = `${window.location.pathname}${window.location.search}`;

  if (window.location.pathname === "/login") {
    return "";
  }

  return currentPath;
}

function redirectToLogin() {
  if (window.location.pathname === "/login") {
    return;
  }

  const params = new URLSearchParams({
    reason: "session-expired"
  });
  const redirectTo = getRedirectPath();

  if (redirectTo) {
    params.set("redirectTo", redirectTo);
  }

  window.location.assign(`/login?${params.toString()}`);
}

async function parseResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!text) {
    return null;
  }

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return { detail: "The server returned an unreadable response." };
    }
  }

  return { detail: text };
}

function getErrorMessage(status, data, fallbackMessage) {
  if (data?.detail) {
    return data.detail;
  }

  if (status === 0) {
    return "Backend unavailable. Check that the API server is running.";
  }

  if (status === 401 || status === 403) {
    return "Session expired. Please log in again.";
  }

  return fallbackMessage;
}

export async function authenticatedRequest(url, options = {}) {
  const token = getAccessToken();

  if (!token) {
    logoutUser();
    redirectToLogin();
    throw new AuthenticatedRequestError("Session expired. Please log in again.", {
      status: 401,
      isUnauthorized: true
    });
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    const data = await parseResponseBody(response);

    if (response.status === 401 || response.status === 403) {
      logoutUser();
      redirectToLogin();
      throw new AuthenticatedRequestError("Session expired. Please log in again.", {
        status: response.status,
        data,
        isUnauthorized: true
      });
    }

    if (!response.ok) {
      throw new AuthenticatedRequestError(
        getErrorMessage(response.status, data, "Request failed. Please try again."),
        {
          status: response.status,
          data
        }
      );
    }

    return data;
  } catch (error) {
    if (error instanceof AuthenticatedRequestError) {
      throw error;
    }

    throw new AuthenticatedRequestError(
      "Backend unavailable. Check that the API server is running.",
      {
        status: 0
      }
    );
  }
}
