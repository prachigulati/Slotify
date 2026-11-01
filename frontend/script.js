function bookSlot(element, slotId) {
    const status = document.getElementById('status-text');
    if (element.classList.contains('available')) {
        element.classList.remove('available');
        element.classList.add('occupied');
        element.querySelector('span').innerText = 'Reserved';
        status.innerText = 'Success: Slot ' + slotId + ' locked and reserved.';
        status.style.color = '#38bdf8';
    } else {
        status.innerText = 'Slot ' + slotId + ' is already occupied or locked.';
        status.style.color = '#ef4444';
    }
}

function switchTab(role, button) {
    var buttons = document.querySelectorAll('.tab-btn');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove('active');
    }
    button.classList.add('active');

    if (role === 'user') {
        document.getElementById('pane-user').style.display = 'flex';
        document.getElementById('pane-admin').style.display = 'none';
    } else {
        document.getElementById('pane-user').style.display = 'none';
        document.getElementById('pane-admin').style.display = 'flex';
    }
}

// ========================================
// Slotify Frontend Authentication
// ========================================

const API_HOST = window.location.hostname || "localhost";
const API_PROTOCOL = window.location.protocol === "file:"
    ? "http:"
    : window.location.protocol;
const API_BASE_URL = `${API_PROTOCOL}//${API_HOST}:5000`;
const API_URL = `${API_BASE_URL}/api/auth`;

// ----------------------------------------
// Get the currently logged-in user
// ----------------------------------------
function getCurrentUser() {
    const user = localStorage.getItem("user");

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch (error) {
        console.error("Could not read user information:", error);
        return null;
    }
}

// ----------------------------------------
// Check whether the user is logged in
// and has the required role
// ----------------------------------------
function checkAuth(requiredRole) {
    const token = localStorage.getItem("token");
    const user = getCurrentUser();

    // Not logged in
    if (!token || !user) {
        window.location.href = "login.html";
        return false;
    }

    // Logged in, but wrong role
    if (requiredRole && user.role !== requiredRole) {
        if (user.role === "admin") {
            window.location.href = "admin-dashboard.html";
        } else {
            window.location.href = "booking.html";
        }

        return false;
    }

    return true;
}

// ----------------------------------------
// Signup
// ----------------------------------------
async function handleSignup(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const errorMessage = document.getElementById("error-msg");

    errorMessage.style.display = "none";
    errorMessage.textContent = "";

    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            errorMessage.textContent = data.message || "Signup failed.";
            errorMessage.style.display = "block";
            return;
        }

        // Save login information
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Account created successfully!");

        // New accounts are regular users
        window.location.href = "booking.html";

    } catch (error) {
        console.error("Signup error:", error);

        errorMessage.textContent =
            "Cannot reach the server. Start the backend with `npm --prefix backend run dev`, then try again.";

        errorMessage.style.display = "block";
    }
}

// ----------------------------------------
// Login
// ----------------------------------------
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const errorMessage = document.getElementById("error-msg");

    errorMessage.style.display = "none";
    errorMessage.textContent = "";

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            errorMessage.textContent = data.message || "Login failed.";
            errorMessage.style.display = "block";
            return;
        }

        // Save JWT and user information
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Login successful!");

        // Redirect according to role
        if (data.user.role === "admin") {
            window.location.href = "admin-dashboard.html";
        } else {
            window.location.href = "booking.html";
        }

    } catch (error) {
        console.error("Login error:", error);

        errorMessage.textContent =
            "Cannot reach the server. Start the backend with `npm --prefix backend run dev`, then try again.";

        errorMessage.style.display = "block";
    }
}

// ----------------------------------------
// Logout
// ----------------------------------------
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "login.html";
}

// ----------------------------------------
// Get JWT token for protected API requests
// ----------------------------------------
function getAuthHeaders() {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}