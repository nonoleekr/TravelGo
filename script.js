// Global Configuration
const API_URL = 'http://localhost:3000/api/bookings';

// ==========================================
// 1. UI Interactions (Navigation & Scroll)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize standard UI features
    initializeNavigation();
    setMinDates();
    initializeForms();
    initializeModal();
});

function initializeNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    // Smooth scrolling
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
// 2. Date Validations
// ==========================================

function setMinDates() {
    const today = new Date().toISOString().split('T')[0];

    // Hotel dates
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

    // Flight dates
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

    // Trip Type Toggler
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

// ==========================================
// 3. Backend Integration (The "Integration Specialist" Work)
// ==========================================

function initializeForms() {
    // Hotel Form Handler
    const hotelForm = document.getElementById('hotelBookingForm');
    if (hotelForm) {
        hotelForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Gather raw data
            const formData = new FormData(hotelForm);
            const data = Object.fromEntries(formData.entries());

            // 1. Calculate Price (Dummy logic: $100 per night)
            const nights = calculateDays(data.checkIn, data.checkOut) || 1;
            const estimatedPrice = nights * 100 * (parseInt(data.guests) || 1);

            // 2. Map to Database Schema
            const bookingPayload = {
                travelerName: data.travelerName,
                passportNum: data.passportNum,
                destination: data.destination,
                flightDate: data.checkIn, // Use check-in as the primary date
                hotelName: `Hotel in ${data.destination} (${data.roomType})`,
                status: 'Confirmed',
                price: estimatedPrice
            };

            // 3. Send to Server
            await sendBookingData(bookingPayload, 'Hotel');
            hotelForm.reset();
        });
    }

    // Flight Form Handler
    const flightForm = document.getElementById('flightBookingForm');
    if (flightForm) {
        flightForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(flightForm);
            const data = Object.fromEntries(formData.entries());

            // 1. Calculate Price (Dummy logic: $300 per passenger)
            const passengers = parseInt(data.passengers) || 1;
            const estimatedPrice = passengers * 300 + (data.class === 'business' ? 500 : 0);

            // 2. Map to Database Schema
            const bookingPayload = {
                travelerName: data.travelerName,
                passportNum: data.passportNum,
                destination: data.destination, // Mapped from 'to' field in HTML
                flightDate: data.flightDate,   // Mapped from 'departure' field
                hotelName: 'N/A',             // No hotel for flight-only bookings
                status: 'Confirmed',
                price: estimatedPrice
            };

            // 3. Send to Server
            await sendBookingData(bookingPayload, 'Flight');
            flightForm.reset();
        });
    }
}

// Generic function to send data to backend
async function sendBookingData(payload, type) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Booking failed');
        }

        // Success!
        showBookingConfirmation(type, payload);

    } catch (error) {
        alert('Error: ' + error.message);
        console.error('Booking Error:', error);
    }
}

// Helper to calculate date difference
function calculateDays(start, end) {
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diff = d2.getTime() - d1.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
}

// ==========================================
// 4. Modal Interactions
// ==========================================

function showBookingConfirmation(type, data) {
    const modal = document.getElementById('confirmationModal');
    const bookingDetails = document.getElementById('bookingDetails');

    bookingDetails.innerHTML = `
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

function initializeModal() {
    const modal = document.getElementById('confirmationModal');
    const closeBtn = document.querySelector('.close');

    // Close function
    window.closeModal = function () {
        modal.style.display = 'none';
    };

    if (closeBtn) {
        closeBtn.addEventListener('click', window.closeModal);
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            window.closeModal();
        }
    });
}

// ==========================================
// 5. Dashboard Logic (Read & Delete)
// ==========================================

// Load bookings when page loads
document.addEventListener('DOMContentLoaded', fetchBookings);

// READ: Fetch all bookings from server
async function fetchBookings() {
    try {
        const response = await fetch(API_URL);
        const bookings = await response.json();
        renderTable(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
    }
}

// Render the table rows
function renderTable(bookings) {
    const tableBody = document.getElementById('bookingTableBody');
    const noMsg = document.getElementById('noBookingsMsg');

    tableBody.innerHTML = ''; // Clear current list

    if (bookings.length === 0) {
        noMsg.style.display = 'block';
        return;
    }

    noMsg.style.display = 'none';

    bookings.forEach(booking => {
        const row = document.createElement('tr');

        // Format Date
        const dateStr = new Date(booking.flightDate).toLocaleDateString();

        // Determine Status Badge Class
        const statusClass = `status-${booking.status.toLowerCase()}`;

        row.innerHTML = `
            <td>${booking.travelerName}</td>
            <td>${booking.passportNum}</td>
            <td>${booking.destination}</td>
            <td>${dateStr}</td>
            <td><span class="status-badge ${statusClass}">${booking.status}</span></td>
            <td>$${booking.price}</td>
            <td>
                <button class="btn-edit" onclick='openEditModal(${JSON.stringify(booking)})'>Edit</button>
                <button class="btn-delete" onclick="deleteBooking('${booking._id}')">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// DELETE: Remove a booking
async function deleteBooking(id) {
    // Safety Check [Report Requirement: "Preventing accidental deletions"]
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Booking deleted successfully');
            fetchBookings(); // Refresh the table
        } else {
            alert('Failed to delete booking');
        }
    } catch (error) {
        console.error('Error deleting:', error);
        alert('Error connecting to server');
    }
}

// Make deleteBooking available globally (since it's called from HTML string)
window.deleteBooking = deleteBooking;

// Hook into the form submissions to auto-refresh the table after a new booking
const originalShowConfirmation = showBookingConfirmation;
showBookingConfirmation = function (type, data) {
    originalShowConfirmation(type, data); // Call the original modal
    fetchBookings(); // Refresh dashboard data immediately
};

// ==========================================
// 6. Edit / Update Logic
// ==========================================

const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editBookingForm');

// 1. OPEN MODAL: Fill form with existing data
window.openEditModal = function (booking) {
    // Fill the hidden ID field so we know which booking to update
    document.getElementById('editId').value = booking._id;

    // Fill visible fields
    document.getElementById('editName').value = booking.travelerName;
    document.getElementById('editDestination').value = booking.destination;
    document.getElementById('editStatus').value = booking.status;

    // Format Date for Input (YYYY-MM-DD)
    const dateObj = new Date(booking.flightDate);
    const dateStr = dateObj.toISOString().split('T')[0];
    document.getElementById('editDate').value = dateStr;

    // Show Modal
    editModal.style.display = 'block';
};

// 2. CLOSE MODAL
window.closeEditModal = function () {
    editModal.style.display = 'none';
};

// 3. SUBMIT UPDATE (PUT Request)
if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('editId').value;
        const updatedData = {
            travelerName: document.getElementById('editName').value,
            destination: document.getElementById('editDestination').value,
            flightDate: document.getElementById('editDate').value,
            status: document.getElementById('editStatus').value
        };

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });

            if (response.ok) {
                alert('Booking updated successfully!');
                closeEditModal();
                fetchBookings(); // Refresh the dashboard table
            } else {
                const err = await response.json();
                alert('Update failed: ' + err.message);
            }
        } catch (error) {
            console.error('Error updating:', error);
            alert('Error connecting to server');
        }
    });
}

// Close edit modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === editModal) {
        closeEditModal();
    }
});