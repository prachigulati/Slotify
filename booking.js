const zoneMeta = {
    coop: { name: "Coop Parking", price: 30 },
    carL1: { name: "Car Parking (L1)", price: 30 },
    prime: { name: "Prime Zone Bay", price: 40 },
    twowheelB: { name: "Two-Wheeler Parking", price: 10 },
    evbaymid: { name: "EV Charging Bay (Mid)", price: 50 },
    evbaywide: { name: "EV Charging Bay (Wide)", price: 50 },
    carTop: { name: "Car Parking (Ramp Side)", price: 30 },
    zoneC1: { name: "Zone C — Car Parking A", price: 30 },
    zoneC2: { name: "Zone C — Car Parking B", price: 30 },
    zoneC3: { name: "Zone C — Car Parking C", price: 30 },
    carTopMid: { name: "Car Parking (Top-Mid)", price: 30 },
    twBay2: { name: "2-Wheeler Bay", price: 10 },
    chargeBay: { name: "Charging Bay", price: 50 },
    twoCharge: { name: "Two-Charging Parking", price: 50 },
    zoneCR: { name: "Zone C — Right Block", price: 30 },
    premTop: { name: "Premium Parking (Top)", price: 60 },
    premBot: { name: "Premium Parking (Bottom)", price: 60 },
    reserved: { name: "Reserved Parking", price: 45 },
    reservedExit: { name: "Reserved Parking E/Exit", price: 45 }
};

//i have accessed all the dom elements here!!

const checkboxes = document.querySelectorAll(".slot-checkbox");
const list = document.querySelector("#summary-list");
const emptyMsg = document.querySelector("#summary-empty");
const confirmBtn = document.querySelector("#confirm-btn");
const confirmMsg = document.querySelector("#confirm-msg");
const totalEl = document.querySelector("#summary-total");
const durationInput = document.getElementById("duration");




let bookedSlots =
    JSON.parse(localStorage.getItem("parkingBookings")) || [];

const bookingDetailsKey = "parkingBookingDetails";

function getBookingDetails() {
    try {
        const details = JSON.parse(localStorage.getItem(bookingDetailsKey));
        return Array.isArray(details) ? details : [];
    } catch (error) {
        return [];
    }
}



function loadBookedSlots() {

    checkboxes.forEach((checkbox) => {

        const slotId = checkbox.id;

        if (bookedSlots.includes(slotId)) {

            checkbox.checked = false;
            checkbox.disabled = true;

            const slot = document.querySelector(
                `label[for="${checkbox.id}"]`
            );

            if (slot) {
                slot.classList.add("booked");
            }
        }
    });
}




function render() {

    const selected = [...checkboxes].filter(
        checkbox => checkbox.checked
    );

    list.innerHTML = "";


    // No slot selected

    if (selected.length === 0) {

        emptyMsg.style.display = "block";
        totalEl.textContent = "₹0";
        confirmBtn.disabled = true;

        return;
    }


    emptyMsg.style.display = "none";


    // Get duration

    const duration = Number(durationInput.value) || 1;

    let total = 0;


    // Selected slots

    selected.forEach((checkbox) => {

        const zone = checkbox.dataset.zone;

        const meta = zoneMeta[zone];


        // Safety check

        if (!meta) {

            console.error(
                "No zoneMeta found for:",
                zone
            );

            return;
        }


        // Calculate cost

        const cost = meta.price * duration;

        total += cost;


        // Create summary item

        const li = document.createElement("li");

        li.innerHTML = `
            <span class="slot-name">
                ${checkbox.dataset.label}
            </span>

            <span class="slot-zone">
                ${meta.name} - ₹${meta.price}/hour
            </span>
        `;

        list.appendChild(li);

    });


    // Display total

    totalEl.textContent = `₹${total}`;

    confirmBtn.disabled = false;
}


// ========================================
// CHECKBOX EVENT
// ========================================

checkboxes.forEach((checkbox) => {

    checkbox.addEventListener("change", () => {

        render();

    });

});


// ========================================
// DURATION EVENT
// ========================================

durationInput.addEventListener("input", () => {

    render();

});


// ========================================
// CONFIRM BOOKING
// ========================================

confirmBtn.addEventListener("click", () => {

    const selected = [...checkboxes].filter(
        checkbox => checkbox.checked
    );


    if (selected.length === 0) {
        return;
    }


    const session = getCurrentUser();
    const duration = Number(durationInput.value) || 1;
    const bookedAt = new Date();
    const bookingDetails = getBookingDetails();

    // Book each selected slot

    selected.forEach((checkbox) => {

        const slotId = checkbox.id;


        // Add to booked slots

        if (!bookedSlots.includes(slotId)) {

            bookedSlots.push(slotId);

        }

        const meta = zoneMeta[checkbox.dataset.zone];
        bookingDetails.push({
            id: `${slotId}-${bookedAt.getTime()}`,
            userEmail: session ? session.email : "",
            slotId,
            slotLabel: checkbox.dataset.label,
            zone: meta ? meta.name : "Parking zone",
            duration,
            bookedAt: bookedAt.toISOString(),
            endsAt: new Date(bookedAt.getTime() + duration * 60 * 60 * 1000).toISOString()
        });


        // Disable checkbox

        checkbox.checked = false;
        checkbox.disabled = true;


        // Find label

        const slot = document.querySelector(
            `label[for="${checkbox.id}"]`
        );


        // Add booked class

        if (slot) {

            slot.classList.add("booked");

        }

    });


    // ========================================
    // SAVE TO LOCAL STORAGE
    // ========================================

    localStorage.setItem(
        "parkingBookings",
        JSON.stringify(bookedSlots)
    );
    localStorage.setItem(bookingDetailsKey, JSON.stringify(bookingDetails));


    // Show confirmation

    confirmMsg.textContent = "Booking confirmed. View it anytime in My bookings.";
    confirmMsg.style.display = "block";


    // Re-render

    render();

});


// ========================================
// INITIAL LOAD
// ========================================

loadBookedSlots();

render();
