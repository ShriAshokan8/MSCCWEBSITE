// script.js

document.addEventListener("DOMContentLoaded", function () {
    // Current year for footer
    document.getElementById("currentYear").textContent = new Date().getFullYear();

    // Login form handling
    const loginForm = document.getElementById("login-form");
    const loginMessage = document.getElementById("login-message");

    // User credentials for designated roles
    const userCredentials = {
        Main: { username: "mainuser", password: "mainpass" },
        Staff: { username: "staffuser", password: "staffpass" },
        "Year 12": { username: "year12user", password: "year12pass" }
    };

    // Handle form submission for login
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent form from submitting

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        let accessGranted = false;

        // Check credentials for each role
        for (const role in userCredentials) {
            if (
                userCredentials[role].username === username &&
                userCredentials[role].password === password
            ) {
                accessGranted = true;
                loginMessage.textContent = `Welcome, ${role} user! Redirecting...`;
                loginMessage.style.color = "green";

                // Simulate redirect after successful login
                setTimeout(() => {
                    window.location.href = "7_staff.html";
                }, 1000);
                break;
            }
        }

        if (!accessGranted) {
            loginMessage.textContent = "Invalid username or password. Please try again.";
            loginMessage.style.color = "red";
        }
    });
});
