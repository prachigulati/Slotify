function handleSignup(event) {
    event.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const errorMsg = document.getElementById('error-msg');

    let users = JSON.parse(localStorage.getItem('slotify_users')) || [];

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        errorMsg.innerText = 'An account with this email already exists.';
        errorMsg.style.display = 'block';
        return;
    }

    users.push({ name, email, password, role });
    localStorage.setItem('slotify_users', JSON.stringify(users));

    // Auto-login session after signup
    localStorage.setItem('slotify_session', JSON.stringify({ name, email, role }));
    redirectUser(role);
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const errorMsg = document.getElementById('error-msg');

    let users = JSON.parse(localStorage.getItem('slotify_users')) || [];

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        errorMsg.innerText = 'Invalid email or password.';
        errorMsg.style.display = 'block';
        return;
    }

    localStorage.setItem('slotify_session', JSON.stringify({ name: user.name, email: user.email, role: user.role }));
    redirectUser(user.role);
}

function redirectUser(role) {
    if (role === 'admin') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}

function checkAuth(requiredRole) {
    const session = JSON.parse(localStorage.getItem('slotify_session'));
    if (!session || session.role !== requiredRole) {
        window.location.href = 'login.html';
    }
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('slotify_session'));
}

function logout() {
    localStorage.removeItem('slotify_session');
    window.location.href = 'index.html';
}

// --- Interactive Simulation Logic ---

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