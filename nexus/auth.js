// Auth module for MSC Nexus.
// Implements:
// - Domain restriction (@hfed.net, @harrispurley.org.uk)
// - Login via email/password
// - Auth state observation + user document loading
// - Force password change flow
// - Logout

import {
  auth,
  db,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "./firebase.js";

const ALLOWED_DOMAINS = ["hfed.net", "harrispurley.org.uk"];

function getEmailDomain(email) {
  if (!email || typeof email !== "string") return "";
  const parts = email.split("@");
  return parts.length === 2 ? parts[1].toLowerCase() : "";
}

function isAllowedDomain(email) {
  const domain = getEmailDomain(email);
  return ALLOWED_DOMAINS.includes(domain);
}

/**
 * Login with email/password enforcing domain restriction.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export async function login(email, password) {
  if (!isAllowedDomain(email)) {
    throw new Error(
      "Only @hfed.net and @harrispurley.org.uk email addresses are allowed.",
    );
  }

  // signInWithEmailAndPassword will throw if credentials are invalid
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential;
}

/**
 * Observe auth state and provide enriched user data including Firestore
 * user document fields: role, mustChangePassword, etc.
 *
 * @param {(userWithData: any) => void} onUser
 * @param {(reason?: string) => void} onNoUser
 */
export function observeAuthState(onUser, onNoUser) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      if (typeof onNoUser === "function") {
        onNoUser();
      }
      return;
    }

    const email = user.email || "";
    if (!isAllowedDomain(email)) {
      // Immediately sign out if email domain is not permitted.
      try {
        await signOut(auth);
      } catch {
        // ignore sign-out errors here
      }
      if (typeof onNoUser === "function") {
        onNoUser("Invalid domain");
      }
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      let userData = {};
      if (snap.exists()) {
        userData = snap.data();
      } else {
        // If no user doc exists yet, create a minimal default document.
        userData = {
          email,
          role: null,
          mustChangePassword: false,
        };
        await setDoc(userRef, userData, { merge: true });
      }

      const userWithData = {
        ...user,
        role: userData.role || null,
        mustChangePassword:
          typeof userData.mustChangePassword === "boolean"
            ? userData.mustChangePassword
            : false,
      };

      if (typeof onUser === "function") {
        onUser(userWithData);
      }
    } catch (error) {
      // If we cannot load user data, treat as no user.
      console.error("Failed to load user profile:", error);
      if (typeof onNoUser === "function") {
        onNoUser("Failed to load user profile");
      }
    }
  });
}

/**
 * Force password change if mustChangePassword is true.
 * - Reads users/{uid}.mustChangePassword
 * - If true, updates Firebase Auth password and sets mustChangePassword to false.
 *
 * @param {import("firebase/auth").User} user
 * @param {string} newPassword
 */
export async function forcePasswordChangeIfNeeded(user, newPassword) {
  if (!user) {
    throw new Error("No authenticated user.");
  }

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    // If no doc, nothing to enforce.
    return;
  }

  const data = snap.data();
  if (!data || data.mustChangePassword !== true) {
    // No forced password change required.
    return;
  }

  // Update auth password first
  await updatePassword(user, newPassword);

  // Then clear mustChangePassword flag
  await updateDoc(userRef, { mustChangePassword: false });
}

/**
 * Logout the current user.
 */
export async function logout() {
  await signOut(auth);
}

/**
 * Attach form handlers for login and change-password pages.
 * This keeps the same basic DOM wiring as the initial scaffold
 * but delegates the main behaviour to the functions above.
 */

export async function handleLoginFormSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const emailInput = form.querySelector("#login-email");
  const passwordInput = form.querySelector("#login-password");
  const errorContainer = document.getElementById("login-error");

  if (errorContainer) {
    errorContainer.textContent = "";
  }

  const email = emailInput?.value?.trim() || "";
  const password = passwordInput?.value || "";

  try {
    await login(email, password);
    // Actual redirection logic will be implemented later in app.js
  } catch (err) {
    if (errorContainer) {
      errorContainer.textContent =
        err && err.message
          ? err.message
          : "Unable to sign in. Please check your credentials.";
    }
  }
}

export async function handleChangePasswordFormSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const currentPasswordInput = form.querySelector("#current-password");
  const newPasswordInput = form.querySelector("#new-password");
  const confirmPasswordInput = form.querySelector("#confirm-new-password");
  const statusContainer = document.getElementById("change-password-status");

  if (statusContainer) {
    statusContainer.textContent = "";
  }

  const currentPassword = currentPasswordInput?.value || "";
  const newPassword = newPasswordInput?.value || "";
  const confirmPassword = confirmPasswordInput?.value || "";

  if (!newPassword || newPassword !== confirmPassword) {
    if (statusContainer) {
      statusContainer.textContent = "New passwords do not match.";
    }
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    if (statusContainer) {
      statusContainer.textContent = "No authenticated user.";
    }
    return;
  }

  // For this step, we only implement the forced-change logic;
  // re-auth with currentPassword will be added later if needed.
  try {
    await forcePasswordChangeIfNeeded(user, newPassword);
    if (statusContainer) {
      statusContainer.textContent = "Password updated successfully.";
    }
  } catch (err) {
    if (statusContainer) {
      statusContainer.textContent =
        err && err.message
          ? err.message
          : "Unable to update password. Please try again.";
    }
  }
}

// Attach listeners when on login or change-password pages.
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
