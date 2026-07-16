import { buildApiUrl } from "./apiConfig";
import { authenticatedRequest } from "./authenticatedRequest";

export async function getProfile() {
  return authenticatedRequest(buildApiUrl("/profile"), {
    method: "GET"
  });
}
