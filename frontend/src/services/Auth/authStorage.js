const AUTH_EVENT_NAME = "stockpulse-auth-change";

export function getStoredUser() {
  const token = localStorage.getItem("access_token");
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
