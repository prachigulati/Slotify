# SLOTIFY - Smart Parking Management System

The Smart Parking Management System is designed to simplify the process of finding and managing parking spaces.

## 🛑 The Problem

Finding available parking spaces manually often results in wasted time, traffic congestion, and increased fuel consumption. Traditional parking setups lack real-time visibility into slot availability, leading to driver frustration, inefficient space utilization, and a lack of centralized oversight for facility managers.

## 💡 The Solution

This system provides a smart digital platform that modernizes the parking experience. By offering real-time availability tracking, advance slot reservations, and administrative management tools, it streamlines the entire parking lifecycle—reducing search times, preventing double bookings, and maximizing space utilization.


## ✨ Features
* **User Authentication**: Secure login and sign-up workflows allowing users to create accounts and access personalized sessions.
* **Interactive Dashboard**: A dedicated user control panel to track individual activity and manage upcoming appointments.
* **Streamlined Booking System**: A specialized interface and logic engine dedicated to selecting, confirming, and managing time slots.
* **Administrative Oversight**: A control tier providing administrators the tools necessary to manage high-level system configurations and view overall activity.
* **Responsive Styling**: A cohesive, modern user interface unified by a centralized CSS stylesheet

---

## 📁 Project Structure

The project is organized with clear separation of concerns across its frontend and logic scripts:

```text
Slotify/
│
├── frontend/
│   ├── index.html            # Landing page
│   ├── login.html            # User login
│   ├── signup.html           # User registration
│   ├── booking.html          # Parking reservation interface
│   ├── booking.js            # Reservation interaction and local booking storage
│   ├── dashboard.html       # User profile and booking history
│   ├── dashboard.js         # User dashboard behavior
│   ├── admin-dashboard.html # Admin overview
│   ├── script.js            # Shared frontend authentication utilities
│   └── style.css            # Shared app styling and design tokens
└── backend/                 # Express API and MongoDB models
```
# 🚀 Getting Started

## 1. Clone the Repository:
```bash
git clone [https://github.com/prachigulati/slotify.git]
```
## 2. Open the Project:
Navigate into the project directory and open it in your code editor (e.g., VS Code).

## 3. Run the Application:

Install backend dependencies and start the API server from the repository root:

```bash
npm --prefix backend install
npm --prefix backend run dev
```

Wait for the `MongoDB connected successfully!` message, then open <http://localhost:5000>. Keep the backend terminal running while using the app. Do not open the HTML files directly or use a frontend-only server unless the backend is also running and reachable on port 5000.

## Aadhaar document uploads

Profile pictures and Aadhaar documents are stored in MongoDB GridFS (`uploads.files` and `uploads.chunks`). Aadhaar uploads accept PDF, JPEG, and PNG files up to 5 MB and are encrypted by the application before storage. Downloads require authentication and are limited to the owning account; profile pictures are also delivered through an authenticated endpoint.

Configure `AADHAAR_ENCRYPTION_KEY` in the root `.env` (or `backend/.env`) as a newly generated 64-character hexadecimal key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Keep the key secret and back it up separately from the encrypted documents. Every application instance that needs to read the documents must use the same key; distribute it only through a trusted secret manager or another secure channel. Losing or changing the key makes existing uploads unreadable. Back up the GridFS collections and the key.

Existing uploads from the prior local-disk implementation can be moved into GridFS by running `npm run migrate:uploads-to-gridfs` from `backend/` on the machine that has both the existing `backend/uploads/` and `backend/private-uploads/` files and access to MongoDB. The migration updates each user record before removing the corresponding local file; keep a backup before running it.

## Booking API

Authenticated users can create bookings through `POST /api/bookings` with a
`slotId`, `bookingDate` (`YYYY-MM-DD`), `startTime` (`HH:MM`), and `endTime`
(`HH:MM`). The API checks for overlapping active bookings and MongoDB enforces
a unique constraint for the same slot and time range. Duplicate or overlapping
requests return HTTP `409`.

Additional authenticated endpoints:

* `GET /api/bookings/mine` - list the current user's bookings
* `PATCH /api/bookings/:bookingId/cancel` - cancel an active owned booking