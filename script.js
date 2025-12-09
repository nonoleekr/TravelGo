// ==========================================
// 1. Global Configuration
// ==========================================
const API_URL = 'http://localhost:3000/api/bookings';
const DEST_API_URL = 'http://localhost:3000/api/destinations';

// ==========================================
// 2. Initialization (Main Entry Point)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeForms();
    initializeModals();

    // Data Loading
    fetchBookings();
    fetchDestinations();
    setMinDates();
});

// ==========================================
// 3. Navigation & UI Logic
// ==========================================
function initializeNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ==========================================
// 4. Date & Input Validation
// ==========================================
function setMinDates() {
    const today = new Date().toISOString().split('T')[0];

    // Hotel Date Logic
    const hotelCheckIn = document.getElementById('hotelCheckIn');
    const hotelCheckOut = document.getElementById('hotelCheckOut');

    if (hotelCheckIn) {
        hotelCheckIn.min = today;
        hotelCheckIn.addEventListener('change', () => {
            if (hotelCheckOut) {
                hotelCheckOut.min = hotelCheckIn.value;
            }
        });
    }

    // Flight Date Logic
    const flightDeparture = document.getElementById('flightDeparture');
    const flightReturn = document.getElementById('flightReturn');

    if (flightDeparture) {
        flightDeparture.min = today;
        flightDeparture.addEventListener('change', () => {
            if (flightReturn) {
                flightReturn.min = flightDeparture.value;
            }
        });
    }

    // Trip Type Toggler (One Way vs Round Trip)
    const tripTypeRadios = document.querySelectorAll('input[name="tripType"]');
    if (tripTypeRadios.length > 0 && flightReturn) {
        tripTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'oneway') {
                    flightReturn.disabled = true;
                    flightReturn.value = '';
                } else {
                    flightReturn.disabled = false;
                }
            });
        });
    }
}

// Helper: Calculate difference in days
function calculateDays(start, end) {
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diff = d2.getTime() - d1.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
}

// ==========================================
// 5. Backend Integration: Fetch Data
// ==========================================

// Fetch Destinations for Dropdowns
async function fetchDestinations() {
    try {
        const response = await fetch(DEST_API_URL);
        const destinations = await response.json();

        const optionsHTML = destinations.map(dest =>
            `<option value="${dest.name}">${dest.name}</option>`
        ).join('');

        const defaultOption = '<option value="">Select a Destination</option>';

        ['hotelDestination', 'flightFrom', 'flightTo'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = defaultOption + optionsHTML;
        });

    } catch (error) {
        console.error('Error fetching destinations:', error);
    }
}

// Fetch All Bookings (Read)
async function fetchBookings() {
    try {
        const response = await fetch(API_URL);
        const bookings = await response.json();
        renderTable(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
    }
}

// Render Table Rows
function renderTable(bookings) {
    const tableBody = document.getElementById('bookingTableBody');
    const noMsg = document.getElementById('noBookingsMsg');

    tableBody.innerHTML = ''; // Clear table

    if (bookings.length === 0) {
        noMsg.style.display = 'block';
        return;
    }

    noMsg.style.display = 'none';

    bookings.forEach(booking => {
        const row = document.createElement('tr');
        const dateStr = new Date(booking.flightDate).toLocaleDateString();
        const statusClass = `status-${booking.status.toLowerCase()}`;

        // Escape quotes to prevent breaking the onclick JSON
        const safeBooking = JSON.stringify(booking).replace(/"/g, '&quot;');

        row.innerHTML = `
            <td>${booking.travelerName}</td>
            <td>${booking.passportNum}</td>
            <td>${booking.destination}</td>
            <td>${dateStr}</td>
            <td><span class="status-badge ${statusClass}">${booking.status}</span></td>
            <td>$${booking.price}</td>
            <td>
                <button class="btn-edit" onclick="openEditModal(${safeBooking})">Edit</button>
                <button class="btn-delete" onclick="deleteBooking('${booking._id}')">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// ==========================================
// 6. Form Handling (Create)
// ==========================================
function initializeForms() {
    // Hotel Form
    const hotelForm = document.getElementById('hotelBookingForm');
    if (hotelForm) {
        hotelForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(hotelForm);
            const data = Object.fromEntries(formData.entries());

            const nights = calculateDays(data.checkIn, data.checkOut) || 1;
            const estimatedPrice = nights * 100 * (parseInt(data.guests) || 1);

            const payload = {
                travelerName: data.travelerName,
                passportNum: data.passportNum,
                destination: data.destination,
                flightDate: data.checkIn,
                hotelName: `Hotel in ${data.destination} (${data.roomType})`,
                status: 'Confirmed',
                price: estimatedPrice
            };

            await sendBookingData(payload, 'Hotel');
            hotelForm.reset();
        });
    }

    // Flight Form
    const flightForm = document.getElementById('flightBookingForm');
    if (flightForm) {
        flightForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(flightForm);
            const data = Object.fromEntries(formData.entries());

            const passengers = parseInt(data.passengers) || 1;
            const estimatedPrice = passengers * 300 + (data.class === 'business' ? 500 : 0);

            const payload = {
                travelerName: data.travelerName,
                passportNum: data.passportNum,
                destination: data.destination,
                flightDate: data.flightDate,
                hotelName: 'N/A',
                status: 'Confirmed',
                price: estimatedPrice
            };

            await sendBookingData(payload, 'Flight');
            flightForm.reset();
        });
    }
}

async function sendBookingData(payload, type) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.message || 'Booking failed');

        showBookingConfirmation(type, payload);
        fetchBookings(); // Refresh Dashboard immediately

    } catch (error) {
        alert('Error: ' + error.message);
        console.error('Booking Error:', error);
    }
}

// ==========================================
// 7. Modal Logic (Shared)
// ==========================================
function initializeModals() {
    const confirmationModal = document.getElementById('confirmationModal');
    const editModal = document.getElementById('editModal');
    const closeBtns = document.querySelectorAll('.close');

    // Close buttons handler
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirmationModal) confirmationModal.style.display = 'none';
            if (editModal) editModal.style.display = 'none';
        });
    });

    // Click outside to close (Handles both modals)
    window.addEventListener('click', (e) => {
        if (e.target === confirmationModal) confirmationModal.style.display = 'none';
        if (e.target === editModal) editModal.style.display = 'none';
    });

    // Setup Edit Form Submit Listener
    const editForm = document.getElementById('editBookingForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditSubmit);
    }
}

function showBookingConfirmation(type, data) {
    const modal = document.getElementById('confirmationModal');
    const details = document.getElementById('bookingDetails');

    details.innerHTML = `
        <h3>${type} Booking Successful!</h3>
        <p><strong>Name:</strong> ${data.travelerName}</p>
        <p><strong>Passport:</strong> ${data.passportNum}</p>
        <p><strong>Destination:</strong> ${data.destination}</p>
        <p><strong>Date:</strong> ${data.flightDate}</p>
        <p><strong>Total Price:</strong> $${data.price}</p>
        <p class="success-msg">Saved to MongoDB successfully!</p>
    `;
    modal.style.display = 'block';
}

// ==========================================
// 8. Global Functions (Exposed for HTML onclick)
// ==========================================

// DELETE Booking
window.deleteBooking = async function (id) {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });

        if (response.ok) {
            alert('Booking deleted successfully');
            fetchBookings(); // Refresh table
        } else {
            alert('Failed to delete booking');
        }
    } catch (error) {
        console.error('Error deleting:', error);
        alert('Error connecting to server');
    }
};

// OPEN Edit Modal
window.openEditModal = function (booking) {
    // If passed as a string (from HTML), parse it. If object, use as is.
    const data = (typeof booking === 'string') ? JSON.parse(booking) : booking;
    const editModal = document.getElementById('editModal');

    document.getElementById('editId').value = data._id;
    document.getElementById('editName').value = data.travelerName;
    document.getElementById('editDestination').value = data.destination;
    document.getElementById('editStatus').value = data.status;

    // Format Date (YYYY-MM-DD)
    const dateStr = new Date(data.flightDate).toISOString().split('T')[0];
    document.getElementById('editDate').value = dateStr;

    editModal.style.display = 'block';
};

// Handle Edit Submit
async function handleEditSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const editModal = document.getElementById('editModal');

    const updatedData = {
        travelerName: document.getElementById('editName').value,
        destination: document.getElementById('editDestination').value,
        flightDate: document.getElementById('editDate').value,
        status: document.getElementById('editStatus').value
    };

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            alert('Booking updated successfully!');
            editModal.style.display = 'none';
            fetchBookings(); // Refresh table
        } else {
            const err = await response.json();
            alert('Update failed: ' + err.message);
        }
    } catch (error) {
        console.error('Error updating:', error);
        alert('Error connecting to server');
    }
}