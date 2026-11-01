function initializeBookingPage() {
  if (!checkAuth('user')) return;

  const user = getCurrentUser();
  const nameLink = document.getElementById('booking-user-name');
  const nameText = document.getElementById('booking-user-name-text');
  const initials = document.getElementById('booking-user-initials');
  const profilePicture = document.getElementById('booking-profile-picture');
  const logoutButton = document.getElementById('booking-logout');
  const durationDisplay = document.getElementById('duration-display');
  const durationPreview = document.getElementById('duration-preview');
  const calcHours = document.getElementById('calc-hours');
  const calcRate = document.getElementById('calc-rate');
  const calcSubtotal = document.getElementById('calc-subtotal');
  const calcTotal = document.getElementById('calc-total');
  const slotCard = document.getElementById('slot-card');
  const emptyState = document.getElementById('empty-state');
  const confirmButton = document.getElementById('btn-confirm');
  const clearButton = document.getElementById('btn-clear-selection');
  const message = document.getElementById('booking-message');
  const availableCount = document.getElementById('available-count');
  const slots = [...document.querySelectorAll('.slot-btn')];
  const bookingDetailsKey = 'parkingBookingDetails';

  let bookedSlots;
  let bookingDetails;
  try {
    const storedSlots = JSON.parse(localStorage.getItem('parkingBookings') || '[]');
    const storedDetails = JSON.parse(localStorage.getItem(bookingDetailsKey) || '[]');
    bookedSlots = Array.isArray(storedSlots) ? storedSlots : [];
    bookingDetails = Array.isArray(storedDetails) ? storedDetails : [];
  } catch (error) {
    console.error('Could not read saved bookings:', error);
    message.textContent = 'Could not read saved bookings. Check your browser storage and reload this page.';
    confirmButton.disabled = true;
    return;
  }

  const selectedButton = document.querySelector('.slot-btn.selected:not(.occupied)');
  const state = {
    selectedSlot: selectedButton?.dataset.slot || null,
    ratePerHour: Number(selectedButton?.dataset.price) || 40,
    slotType: selectedButton?.dataset.type || 'regular',
    durationHours: 2
  };

  nameText.textContent = user.name;
  nameLink.href = 'dashboard.html#profile';
  initials.textContent = user.name.trim().charAt(0).toUpperCase();
  loadBookingProfilePicture();
  logoutButton.addEventListener('click', logout);

  async function loadBookingProfilePicture() {
    try {
      const profileResponse = await fetch(`${API_URL}/me`, { headers: getAuthHeaders() });
      const profileData = await profileResponse.json();
      if (!profileResponse.ok) {
        throw new Error(profileData.message || `Profile request failed (${profileResponse.status}).`);
      }

      localStorage.setItem('user', JSON.stringify(profileData.user));
      nameText.textContent = profileData.user.name;
      initials.textContent = profileData.user.name.trim().charAt(0).toUpperCase();
      if (!profileData.user.hasProfilePicture) return;

      const pictureResponse = await fetch(`${API_BASE_URL}/api/uploads/profile-picture`, {
        headers: getAuthHeaders()
      });
      if (!pictureResponse.ok) {
        throw new Error(`Profile picture request failed (${pictureResponse.status}).`);
      }

      profilePicture.src = URL.createObjectURL(await pictureResponse.blob());
      profilePicture.hidden = false;
      initials.hidden = true;
    } catch (error) {
      console.error('Booking profile picture loading error:', error);
    }
  }

  function setSelectedSlot(button) {
    slots.forEach(slot => {
      if (slot.classList.contains('selected')) {
        slot.classList.remove('selected', 'border-2', 'border-[#0025ff]', 'bg-[#0025ff]', 'text-white', 'ring-2', 'ring-[#0025ff]/20', 'scale-[1.03]');
        if (!slot.classList.contains('occupied')) slot.classList.add('available');
      }
    });

    state.selectedSlot = button?.dataset.slot || null;
    state.ratePerHour = Number(button?.dataset.price) || 40;
    state.slotType = button?.dataset.type || 'regular';
    if (button) {
      button.classList.remove('available');
      button.classList.add('selected', 'border-2', 'border-[#0025ff]', 'bg-[#0025ff]', 'text-white', 'ring-2', 'ring-[#0025ff]/20', 'scale-[1.03]');
    }
    message.textContent = '';
    updateBookingSummary();
  }

  function updateBookingSummary() {
    const hasSelection = Boolean(state.selectedSlot);
    durationDisplay.textContent = state.durationHours;
    durationPreview.textContent = `${state.durationHours}.0 Hours`;
    calcHours.textContent = state.durationHours;
    calcRate.textContent = hasSelection ? state.ratePerHour : 0;
    calcSubtotal.textContent = `₹${hasSelection ? state.ratePerHour * state.durationHours : 0}`;
    calcTotal.textContent = `₹${hasSelection ? state.ratePerHour * state.durationHours : 0}`;
    slotCard.classList.toggle('hidden', !hasSelection);
    emptyState.classList.toggle('hidden', hasSelection);
    confirmButton.disabled = !hasSelection;
    clearButton.disabled = !hasSelection;

    if (hasSelection) {
      document.getElementById('summary-slot-id').textContent = state.selectedSlot;
      document.getElementById('summary-slot-rate').textContent = `₹${state.ratePerHour}/hr`;
      const badge = document.getElementById('summary-slot-badge');
      const typeLabels = { ev: 'EV Fast Charge', premium: 'Premium Bay', '2wheeler': '2-Wheeler' };
      badge.textContent = typeLabels[state.slotType] || 'Regular';
      document.getElementById('summary-slot-desc').textContent =
        `Basement Level 1 · ${state.slotType === 'premium' ? 'Premium zone' : state.slotType === 'ev' ? 'EV charging zone' : 'Parking zone'}`;
    }

    const available = slots.filter(slot => !slot.disabled && !slot.classList.contains('occupied')).length;
    availableCount.textContent = `${available} / ${slots.length} Free Bays`;
  }

  document.getElementById('btn-plus').addEventListener('click', () => {
    if (state.durationHours < 24) {
      state.durationHours += 1;
      updateBookingSummary();
    }
  });

  document.getElementById('btn-minus').addEventListener('click', () => {
    if (state.durationHours > 1) {
      state.durationHours -= 1;
      updateBookingSummary();
    }
  });

  clearButton.addEventListener('click', () => setSelectedSlot(null));

  slots.forEach(button => {
    if (button.classList.contains('occupied') || bookedSlots.includes(button.dataset.slot)) {
      button.disabled = true;
      button.classList.remove('available', 'selected');
      button.classList.add('occupied', 'cursor-not-allowed');
      if (state.selectedSlot === button.dataset.slot) state.selectedSlot = null;
      return;
    }

    button.addEventListener('click', () => {
      if (state.selectedSlot === button.dataset.slot) {
        setSelectedSlot(null);
      } else {
        setSelectedSlot(button);
      }
    });
  });

  confirmButton.addEventListener('click', () => {
    if (!state.selectedSlot) return;

    const bookedAt = new Date();
    const endsAt = new Date(bookedAt.getTime() + state.durationHours * 60 * 60 * 1000);
    const selected = slots.find(slot => slot.dataset.slot === state.selectedSlot);
    const booking = {
      id: `${state.selectedSlot}-${bookedAt.getTime()}`,
      userEmail: user.email,
      slotId: state.selectedSlot,
      slotLabel: state.selectedSlot,
      zone: state.slotType === 'premium' ? 'Premium Parking' : state.slotType === 'ev' ? 'EV Charging Bay' : 'Basement Level 1 Parking',
      duration: state.durationHours,
      bookedAt: bookedAt.toISOString(),
      endsAt: endsAt.toISOString()
    };

    bookedSlots.push(state.selectedSlot);
    bookingDetails.push(booking);
    try {
      localStorage.setItem('parkingBookings', JSON.stringify(bookedSlots));
      localStorage.setItem(bookingDetailsKey, JSON.stringify(bookingDetails));
    } catch (error) {
      console.error('Could not save booking:', error);
      bookedSlots.pop();
      bookingDetails.pop();
      message.textContent = 'Your booking could not be saved. Please try again.';
      return;
    }

    if (selected) {
      selected.disabled = true;
      selected.classList.remove('available', 'selected');
      selected.classList.add('occupied', 'cursor-not-allowed');
    }
    setSelectedSlot(null);
    message.textContent = `Booking confirmed for ${booking.slotLabel}. View it in My bookings.`;
  });

  updateBookingSummary();
}

initializeBookingPage();
