// Auth module for MSC Nexus.
// Implements:
// - Domain restriction (@hfed.net, @harrispurley.org.uk)
// - Login via email/password
// - Auth state observation + user document loading
// - Force password change flow
// - Logout and simple redirects between login / change-password / index

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
 * Throws on invalid domain or auth error.
 */
export async function login(email, password) {
  if (!isAllowedDomain(email)) {
    throw new Error(
      "Only @hfed.net and @harrispurley.org.uk email addresses are allowed.",
    );
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential;
}

/**
 * Observe auth state and provide enriched user data including Firestore
 * user document fields: role, mustChangePassword, etc.
 *
 * onUser(userWithData): called when logged-in user is available
 * onNoUser(reason?): called when there is no valid user
 */
export function observeAuthState(onUser, onNoUser) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      if (typeof onNoUser === "function") {
        onNoUser();
      }
      return;
    }

    const email = user.email || "";
    if (!isAllowedDomain(email)) {
      try {
        await signOut(auth);
      } catch {
        // ignore sign-out errors
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
      console.error("Failed to load user profile:", error);
      if (typeof onNoUser === "function") {
        onNoUser("Failed to load user profile");
      }
    }
  });
}

/**
 * Force password change if mustChangePassword is true.
 */
export async function forcePasswordChangeIfNeeded(user, newPassword) {
  if (!user) {
    throw new Error("No authenticated user.");
  }

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    return;
  }

  const data = snap.data();
  if (!data || data.mustChangePassword !== true) {
    return;
  }

  await updatePassword(user, newPassword);
  await updateDoc(userRef, { mustChangePassword: false });
}

/**
 * Logout the current user.
 */
export async function logout() {
  await signOut(auth);
}

/**
 * LOGIN PAGE HANDLER
 *
 * On submit:
 * - Calls login(email, password)
 * - On success, we use observeAuthState once to check mustChangePassword:
 *   - If true -> redirect to change-password.html
 *   - Else -> redirect to index.html
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

    // One-shot auth state observer to decide where to go next.
    const unsubscribe = observeAuthState(
      (userWithData) => {
        unsubscribe?.();
        if (userWithData.mustChangePassword) {
          window.location.href = "./change-password.html";
        } else {
          window.location.href = "./index.html";
        }
      },
      (reason) => {
        unsubscribe?.();
        if (errorContainer) {
          errorContainer.textContent =
            reason || "Unable to complete sign in. Please try again.";
        }
      },
    );
  } catch (err) {
    if (errorContainer) {
      errorContainer.textContent =
        err && err.message
          ? err.message
          : "Unable to sign in. Please check your credentials.";
    }
  }
}

/**
 * CHANGE PASSWORD PAGE HANDLER
 *
 * Only makes sense when logged in. If no user is logged in, we redirect
 * back to login.html.
 *
 * On submit:
 * - Validates new vs confirm password
 * - Calls forcePasswordChangeIfNeeded(user, newPassword)
 * - On success -> redirect to index.html
 */
export async function handleChangePasswordFormSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const newPasswordInput = form.querySelector("#new-password");
  const confirmPasswordInput = form.querySelector("#confirm-new-password");
  const statusContainer = document.getElementById("change-password-status");

  if (statusContainer) {
    statusContainer.textContent = "";
  }

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
      statusContainer.textContent =
        "You are not signed in. Redirecting to login...";
    }
    setTimeout(() => {
      window.location.href = "./login.html";
    }, 1000);
    return;
  }

  try {
    await forcePasswordChangeIfNeeded(user, newPassword);
    if (statusContainer) {
      statusContainer.textContent = "Password updated successfully.";
    }
    // Redirect to main app after successful update.
    setTimeout(() => {
      window.location.href = "./index.html";
    }, 800);
  } catch (err) {
    if (statusContainer) {
      statusContainer.textContent =
        err && err.message
          ? err.message
          : "Unable to update password. Please try again.";
    }
  }
}

/**
 * DOM wiring for login, change-password, and index logout button.
 */
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginFormSubmit);
  }

  const changePasswordForm = document.getElementById("change-password-form");
  if (changePasswordForm) {
    // If there is no authenticated user, redirect to login.
    observeAuthState(
      (userWithData) => {
        if (!userWithData.mustChangePassword) {
          // If they somehow reach this page but don't need a password change,
          // send them to the main app.
          window.location.href = "./index.html";
        }
      },
      () => {
        // No user -> go to login
        window.location.href = "./login.html";
      },
    );

    changePasswordForm.addEventListener(
      "submit",
      handleChangePasswordFormSubmit,
    );
  }

  const logoutButton = document.getElementById("btn-sign-out");
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try {
        await logout();
      } finally {
        window.location.href = "./login.html";
      }
    });
  }
});
