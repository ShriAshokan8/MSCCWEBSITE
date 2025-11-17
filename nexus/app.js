// MSC Nexus main application entry point.

import { observeAuthState } from "./auth.js";
import { setupBaseUI } from "./ui.js";

export function bootstrapNexusApp() {
  observeAuthState(
    async (userWithData) => {
      // We are on index.html, so a valid user is required.
      await setupBaseUI(userWithData);
    },
    () => {
      // No user -> go to login.
      window.location.href = "./login.html";
    },
  );
}

// Automatically call bootstrap once DOM is ready.
document.addEventListener("DOMContentLoaded", () => {
  bootstrapNexusApp();
});
