import { buildApiUrl } from "./apiConfig";

export async function getProfile() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("No access token found. Please log in again.");
  }

  const response = await fetch(buildApiUrl("/profile"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Could not load profile.");
  }

  return data;
}
