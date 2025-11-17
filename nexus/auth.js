// Auth module for MSC Nexus.
// Responsibilities (to be implemented later):
// - Email/password sign-in
// - Domain restrictions (@hfed.net, @harrispurley.org.uk)
// - mustChangePassword flow and redirect to change-password.html
// - Sign-out handling

import { getFirebaseAuth } from "./firebase.js";

export function setupAuthStateListener() {
  // TODO: Attach Firebase auth state listener and route users
  // to login, change-password, or main Nexus app as appropriate.
  void getFirebaseAuth;
}

export async function handleLoginFormSubmit(event) {
  // TODO: Implement login submit:
  // - Prevent default
  // - Read email/password
  // - Call Firebase signInWithEmailAndPassword
  // - Enforce email domain rules
  // - Handle errors
  event.preventDefault();
}

export async function handleChangePasswordFormSubmit(event) {
  // TODO: Implement password change flow:
  // - Validate new password + confirm
  // - Call Firebase updatePassword
  // - Update mustChangePassword in Firestore
  event.preventDefault();
}

// Attach basic listeners for login and change-password pages.
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginFormSubmit);
  }

  const changePasswordForm = document.getElementById("change-password-form");
  if (changePasswordForm) {
    changePasswordForm.addEventListener(
      "submit",
      handleChangePasswordFormSubmit,
    );
  }
});