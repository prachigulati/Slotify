function handleSignup(event) {
    event.preventDefault();
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const name = nameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const role = document.getElementById('role').value;
    const errorMsg = document.getElementById('error-msg');
    errorMsg.style.display = 'none';
    errorMsg.innerText = '';
    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    if (!nameRegex.test(name)) {
        showError('Please enter a valid full name (minimum 2 letters, characters only).');
        nameInput.focus();
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address.');
        emailInput.focus();
        return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
        showError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.');
        passwordInput.focus();
        return;
    }
    let users = JSON.parse(localStorage.getItem('slotify_users')) || [];
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        showError('An account with this email already exists.');
        emailInput.focus();
        return;
    }
    users.push({ name, email, password, role });
    localStorage.setItem('slotify_users', JSON.stringify(users));
    localStorage.setItem('slotify_session', JSON.stringify({ name, email, role }));
    redirectUser(role);
}
function showError(message) {
    const errorMsg = document.getElementById('error-msg');
    errorMsg.innerText = message;
    errorMsg.style.display = 'block';
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
        window.location.href = 'booking.html';
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