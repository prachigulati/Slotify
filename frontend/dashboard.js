function formatDate(value) { return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
function bookingCard(booking, isCurrent) {
  const card = document.createElement('article'); card.className = 'booking-card';
  const dateText = booking.bookedAt ? `Booked ${formatDate(booking.bookedAt)}` : 'Saved booking from this browser';
  const endText = booking.endsAt ? `${isCurrent ? 'Ends' : 'Ended'} ${formatDate(booking.endsAt)}` : 'End time unavailable';
  card.innerHTML = `<div><h3 class="booking-slot">Slot ${booking.slotLabel || booking.slotId}</h3><p class="booking-zone">${booking.zone || 'Parking slot'}</p><p class="booking-time">${dateText} · ${endText}</p></div><div class="booking-right"><span class="booking-status ${isCurrent ? 'status-current' : 'status-past'}">${isCurrent ? 'Active' : 'Completed'}</span></div>`;
  return card;
}
function emptyState(container, message) { container.innerHTML = `<div class="empty-bookings"><p>${message}</p><a href="booking.html" class="btn">Book a spot</a></div>`; }
function mapServerBooking(booking) {
  return {
    id: booking._id,
    slotId: booking.slotId,
    slotLabel: booking.slotId,
    zone: 'Parking slot',
    status: booking.status,
    bookedAt: booking.createdAt,
    endsAt: `${booking.bookingDate}T${booking.endTime}:00`
  };
}
async function loadServerBookings() {
  const response = await fetch(`${API_BASE_URL}/api/bookings/mine`, {
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Could not load bookings from the server.');
  }
  if (!Array.isArray(data.bookings)) {
    throw new Error('The server returned an invalid bookings response.');
  }
  return data.bookings.map(mapServerBooking);
}
let profilePictureObjectUrl;
async function setProfilePicture(hasProfilePicture, name) {
  const image = document.getElementById('profile-picture');
  const initials = document.getElementById('profile-initials');
  initials.textContent = name.trim().charAt(0).toUpperCase();
  if (profilePictureObjectUrl) {
    URL.revokeObjectURL(profilePictureObjectUrl);
    profilePictureObjectUrl = null;
  }
  if (hasProfilePicture) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/uploads/profile-picture`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error(`Profile picture request failed (${response.status}).`);
      profilePictureObjectUrl = URL.createObjectURL(await response.blob());
      image.src = profilePictureObjectUrl;
    } catch (error) {
      console.error('Profile picture loading error:', error);
      image.removeAttribute('src');
      image.hidden = true;
      initials.hidden = false;
      return;
    }
    image.hidden = false;
    initials.hidden = true;
  } else {
    image.hidden = true;
    image.removeAttribute('src');
    initials.hidden = false;
  }
}
async function loadProfile() {
  const message = document.getElementById('profile-picture-message');
  const button = document.getElementById('upload-profile-picture');
  const aadhaarUploadButton = document.getElementById('upload-aadhaar-document');
  try {
    const response = await fetch(`${API_URL}/me`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) {
      message.textContent = data.message || 'Could not load your profile.';
      return;
    }
    localStorage.setItem('user', JSON.stringify(data.user));
    await setProfilePicture(data.user.hasProfilePicture, data.user.name);
    setAadhaarDocumentState(data.user.hasAadhaarDocument);
  } catch (error) {
    console.error('Profile loading error:', error);
    message.textContent = 'Could not connect to the server to load your profile.';
  } finally {
    button.disabled = false;
    aadhaarUploadButton.disabled = false;
  }
}
function setAadhaarDocumentState(hasDocument) {
  document.getElementById('download-aadhaar-document').hidden = !hasDocument;
  document.getElementById('delete-aadhaar-document').hidden = !hasDocument;
}
async function uploadAadhaarDocument() {
  const input = document.getElementById('aadhaar-document-file');
  const button = document.getElementById('upload-aadhaar-document');
  const message = document.getElementById('aadhaar-document-message');
  const file = input.files[0];
  if (!file) {
    message.textContent = 'Choose a PDF, JPEG, or PNG document first.';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    message.textContent = 'The document must be 5 MB or smaller.';
    return;
  }

  const formData = new FormData();
  formData.append('document', file);
  button.disabled = true;
  message.textContent = 'Encrypting and uploading your document...';
  try {
    const response = await fetch(`${API_BASE_URL}/api/uploads/aadhaar`, {
      method: 'POST',
      headers: { Authorization: getAuthHeaders().Authorization },
      body: formData
    });
    const data = await response.json();
    if (!response.ok) {
      message.textContent = data.message || 'Could not upload your Aadhaar document.';
      return;
    }

    input.value = '';
    setAadhaarDocumentState(true);
    message.textContent = data.message;
  } catch (error) {
    console.error('Aadhaar upload error:', error);
    message.textContent = 'Could not connect to the server to upload your document.';
  } finally {
    button.disabled = false;
  }
}
async function downloadAadhaarDocument() {
  const message = document.getElementById('aadhaar-document-message');
  try {
    const response = await fetch(`${API_BASE_URL}/api/uploads/aadhaar`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const data = await response.json();
      message.textContent = data.message || 'Could not retrieve your document.';
      return;
    }

    const objectUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'aadhaar-document';
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    message.textContent = 'Your document download has started.';
  } catch (error) {
    console.error('Aadhaar download error:', error);
    message.textContent = 'Could not connect to the server to download your document.';
  }
}
async function deleteAadhaarDocument() {
  const message = document.getElementById('aadhaar-document-message');
  if (!window.confirm('Delete your saved Aadhaar document? This cannot be undone.')) return;
  try {
    const response = await fetch(`${API_BASE_URL}/api/uploads/aadhaar`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      message.textContent = data.message || 'Could not delete your document.';
      return;
    }

    setAadhaarDocumentState(false);
    message.textContent = data.message;
  } catch (error) {
    console.error('Aadhaar deletion error:', error);
    message.textContent = 'Could not connect to the server to delete your document.';
  }
}
async function uploadProfilePicture() {
  const input = document.getElementById('profile-picture-file');
  const button = document.getElementById('upload-profile-picture');
  const message = document.getElementById('profile-picture-message');
  const file = input.files[0];
  if (!file) {
    message.textContent = 'Choose an image before uploading.';
    return;
  }

  const formData = new FormData();
  formData.append('image', file);
  button.disabled = true;
  message.textContent = 'Uploading picture...';

  try {
    const response = await fetch(`${API_BASE_URL}/api/uploads/profile-picture`, {
      method: 'POST',
      headers: { Authorization: getAuthHeaders().Authorization },
      body: formData
    });
    const data = await response.json();
    if (!response.ok) {
      message.textContent = data.message || 'Could not upload your profile picture.';
      return;
    }

    const user = getCurrentUser();
    await setProfilePicture(data.hasProfilePicture, user.name);
    input.value = '';
    message.textContent = data.message;
  } catch (error) {
    console.error('Profile picture upload error:', error);
    message.textContent = 'Could not connect to the server to upload your picture.';
  } finally {
    button.disabled = false;
  }
}
async function renderDashboard() {
  if (!checkAuth('user')) return;
  const user = getCurrentUser();
  document.getElementById('dashboard-user-name').textContent = user.name;
  document.getElementById('dashboard-title').textContent = `${user.name}'s bookings`;
  setProfilePicture(Boolean(user.profilePicture), user.name);
  loadProfile();
  document.getElementById('edit-profile-button').addEventListener('click', () => {
    document.getElementById('profile-picture-file').click();
  });
  document.getElementById('profile-picture-file').addEventListener('change', uploadProfilePicture);
  document.getElementById('upload-profile-picture').addEventListener('click', uploadProfilePicture);
  document.getElementById('upload-aadhaar-document').addEventListener('click', uploadAadhaarDocument);
  document.getElementById('download-aadhaar-document').addEventListener('click', downloadAadhaarDocument);
  document.getElementById('delete-aadhaar-document').addEventListener('click', deleteAadhaarDocument);
  let userBookings;
  try {
    userBookings = await loadServerBookings();
  } catch (error) {
    console.error('Booking loading error:', error);
    document.getElementById('current-count').textContent = '—';
    document.getElementById('past-count').textContent = '—';
    document.getElementById('current-bookings').innerHTML =
      '<div class="empty-bookings"><p>Could not load your bookings from the server. Please try again.</p></div>';
    document.getElementById('past-bookings').innerHTML =
      '<div class="empty-bookings"><p>Your booking history is unavailable until the server responds.</p></div>';
    return;
  }
  const now = Date.now();
  const current = userBookings.filter(booking =>
    (!booking.status || ['reserved', 'confirmed', 'checked_in'].includes(booking.status)) &&
    (!booking.endsAt || new Date(booking.endsAt).getTime() > now)
  );
  const past = userBookings.filter(booking => !current.includes(booking));
  document.getElementById('current-count').textContent = current.length; document.getElementById('past-count').textContent = past.length;
  const currentContainer = document.getElementById('current-bookings'); const pastContainer = document.getElementById('past-bookings');
  if (current.length) current.sort((a, b) => new Date(a.endsAt) - new Date(b.endsAt)).forEach(booking => currentContainer.appendChild(bookingCard(booking, true))); else emptyState(currentContainer, 'You do not have any active bookings.');
  if (past.length) past.sort((a, b) => new Date(b.endsAt) - new Date(a.endsAt)).forEach(booking => pastContainer.appendChild(bookingCard(booking, false))); else emptyState(pastContainer, 'Your completed bookings will appear here.');
}
renderDashboard();
