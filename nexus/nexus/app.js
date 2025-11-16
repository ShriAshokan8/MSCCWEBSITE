// MSC Nexus main application entry point.
// In later steps, this file will:
// - Initialize Firebase (via firebase.js)
// - Handle auth state
// - Load pages and blocks
// - Wire UI interactions

import { initializeFirebaseApp } from "./firebase.js";
import { setupAuthStateListener } from "./auth.js";
import { setupBaseUI } from "./ui.js";

// Placeholder bootstrap to ensure imports are valid.
// Detailed logic will be added in later steps.
export function bootstrapNexusApp() {
  // TODO: Implement full bootstrap logic.
  void initializeFirebaseApp;
  void setupAuthStateListener;
  void setupBaseUI;
}

// Automatically call bootstrap once DOM is ready (placeholder).
document.addEventListener("DOMContentLoaded", () => {
  bootstrapNexusApp();
});