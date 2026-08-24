function readBookings() {
  try { const saved = JSON.parse(localStorage.getItem('parkingBookingDetails')); return Array.isArray(saved) ? saved : []; }
  catch (error) { return []; }
}
function readLegacyBookings() {
  try { const saved = JSON.parse(localStorage.getItem('parkingBookings')); return Array.isArray(saved) ? saved : []; }
  catch (error) { return []; }
}
function formatDate(value) { return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
function bookingCard(booking, isCurrent) {
  const card = document.createElement('article'); card.className = 'booking-card';
  const dateText = booking.bookedAt ? `Booked ${formatDate(booking.bookedAt)}` : 'Saved booking from this browser';
  const endText = booking.endsAt ? `${isCurrent ? 'Ends' : 'Ended'} ${formatDate(booking.endsAt)}` : 'End time unavailable';
  card.innerHTML = `<div><h3 class="booking-slot">Slot ${booking.slotLabel || booking.slotId}</h3><p class="booking-zone">${booking.zone || 'Parking slot'}</p><p class="booking-time">${dateText} · ${endText}</p></div><div class="booking-right"><span class="booking-status ${isCurrent ? 'status-current' : 'status-past'}">${isCurrent ? 'Active' : 'Completed'}</span></div>`;
  return card;
}
function emptyState(container, message) { container.innerHTML = `<div class="empty-bookings"><p>${message}</p><a href="booking.html" class="btn">Book a spot</a></div>`; }
function renderDashboard() {
  checkAuth('user'); const user = getCurrentUser(); document.getElementById('dashboard-user-name').textContent = user.name; document.getElementById('dashboard-title').textContent = `${user.name}'s bookings`;
  const now = Date.now(); const savedBookings = readBookings();
  const userBookings = savedBookings.length
    ? savedBookings.filter(booking => booking.userEmail === user.email)
    : readLegacyBookings().map(slotId => ({ slotId, slotLabel: slotId, zone: 'Existing parking booking' }));
  const current = userBookings.filter(booking => !booking.endsAt || new Date(booking.endsAt).getTime() > now); const past = userBookings.filter(booking => booking.endsAt && new Date(booking.endsAt).getTime() <= now);
  document.getElementById('current-count').textContent = current.length; document.getElementById('past-count').textContent = past.length;
  const currentContainer = document.getElementById('current-bookings'); const pastContainer = document.getElementById('past-bookings');
  if (current.length) current.sort((a, b) => new Date(a.endsAt) - new Date(b.endsAt)).forEach(booking => currentContainer.appendChild(bookingCard(booking, true))); else emptyState(currentContainer, 'You do not have any active bookings.');
  if (past.length) past.sort((a, b) => new Date(b.endsAt) - new Date(a.endsAt)).forEach(booking => pastContainer.appendChild(bookingCard(booking, false))); else emptyState(pastContainer, 'Your completed bookings will appear here.');
}
renderDashboard();
