const AUTH_EVENT_NAME = "stockpulse-auth-change";

export function getAccessToken() {
  return localStorage.getItem("access_token");
}

export function getStoredUser() {
  const token = getAccessToken();
  const rawUser = localStorage.getItem("stockpulse_user");

  if (!token || !rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export function storeUser(user) {
  localStorage.setItem("stockpulse_user", JSON.stringify(user));
  notifyAuthChange();
}

export function isLoggedIn() {
  return Boolean(getStoredUser());
}

export function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}

export function addAuthChangeListener(callback) {
  window.addEventListener(AUTH_EVENT_NAME, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(AUTH_EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

export function logoutUser() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("stockpulse_user");
  notifyAuthChange();
}
