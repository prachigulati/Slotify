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