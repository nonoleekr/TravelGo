// ==========================================
// 1. Global Configuration
// ==========================================
const API_URL = 'http://localhost:3000/api/bookings';
const DEST_API_URL = 'http://localhost:3000/api/destinations';
const AUTH_API_URL = 'http://localhost:3000/api/auth';

// ==========================================
// 2. Initialization (Main Entry Point)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeForms();
    initializeModals();
    initializeAuth();

    // Data Loading
    fetchBookings();
    fetchDestinations();
    setMinDates();
});

// ==========================================
// 2.1 Authentication Functions
// ==========================================

// Initialize authentication state
function initializeAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        const user = JSON.parse(localStorage.getItem('user'));
        updateUIForLoggedInUser(user);
        // Auto-fill booking forms with saved user data
        autoFillBookingForms();
    }

    // Setup auth form handlers
    setupAuthForms();
}

// Setup authentication form handlers
function setupAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const profileForm = document.getElementById('profileForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetch(`${AUTH_API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Update UI
            updateUIForLoggedInUser(data.user);
            closeLoginModal();
            
            // Clear form
            e.target.reset();
            errorDiv.style.display = 'none';
            
            // Refresh bookings for this user
            fetchBookings();
            
            // Auto-fill booking forms with user data
            autoFillBookingForms();
            
            // Show success message
            showNotification('Login successful! Welcome back, ' + data.user.username);
        } else {
            errorDiv.textContent = data.message || 'Login failed';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    }
}

// Handle register form submission
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const errorDiv = document.getElementById('registerError');

    // Validate passwords match
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${AUTH_API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Update UI
            updateUIForLoggedInUser(data.user);
            closeRegisterModal();
            
            // Clear form
            e.target.reset();
            errorDiv.style.display = 'none';
            
            // Refresh bookings for this new user
            fetchBookings();
            
            // Auto-fill booking forms with user data
            autoFillBookingForms();
            
            // Show success message
            showNotification('Account created successfully! Welcome, ' + data.user.username);
        } else {
            errorDiv.textContent = data.message || 'Registration failed';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Registration error:', error);
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    }
}

// Update UI for logged-in user
function updateUIForLoggedInUser(user) {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');

    if (authButtons && userInfo && userName) {
        authButtons.style.display = 'none';
        userInfo.style.display = 'flex';
        userName.textContent = '👤 ' + user.username;
    }
}

// Handle profile update form submission
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const username = document.getElementById('profileUsername').value;
    const email = document.getElementById('profileEmail').value;
    const fullName = document.getElementById('profileFullName').value;
    const phone = document.getElementById('profilePhone').value;
    const passportNum = document.getElementById('profilePassport').value;
    const currentPassword = document.getElementById('profileCurrentPassword').value;
    const newPassword = document.getElementById('profileNewPassword').value;
    const confirmPassword = document.getElementById('profileConfirmPassword').value;
    const errorDiv = document.getElementById('profileError');

    // Validate password fields if any are filled
    if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword) {
            errorDiv.textContent = 'Current password is required to change password';
            errorDiv.style.display = 'block';
            return;
        }
        if (!newPassword) {
            errorDiv.textContent = 'New password is required';
            errorDiv.style.display = 'block';
            return;
        }
        if (newPassword !== confirmPassword) {
            errorDiv.textContent = 'New passwords do not match';
            errorDiv.style.display = 'block';
            return;
        }
    }

    const token = localStorage.getItem('token');
    if (!token) {
        closeProfileModal();
        openLoginModal();
        return;
    }

    try {
        const updateData = { username, email, fullName, phone, passportNum };
        if (currentPassword && newPassword) {
            updateData.currentPassword = currentPassword;
            updateData.newPassword = newPassword;
        }

        const response = await fetch(`${AUTH_API_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (response.ok) {
            // Update stored user info
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Update UI
            updateUIForLoggedInUser(data.user);
            closeProfileModal();
            
            errorDiv.style.display = 'none';
            
            // Auto-fill forms with new data
            autoFillBookingForms();
            
            // Show success message
            showNotification('Profile updated successfully!');
        } else {
            errorDiv.textContent = data.message || 'Update failed';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Profile update error:', error);
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');

    if (authButtons && userInfo) {
        authButtons.style.display = 'flex';
        userInfo.style.display = 'none';
    }
    
    // Clear bookings from view without needing a full page refresh
    renderTable([]);
    
    // Clear booking forms
    clearBookingForms();
    
    showNotification('Logged out successfully');
}

// Auto-fill booking forms with user data
function autoFillBookingForms() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    // Hotel form
    if (document.getElementById('hotelName')) {
        document.getElementById('hotelName').value = user.fullName || '';
        document.getElementById('hotelEmail').value = user.email || '';
        document.getElementById('hotelPassport').value = user.passportNum || '';
        document.getElementById('hotelPhone').value = user.phone || '';
    }

    // Flight form
    if (document.getElementById('flightName')) {
        document.getElementById('flightName').value = user.fullName || '';
        document.getElementById('flightEmail').value = user.email || '';
        document.getElementById('flightPassport').value = user.passportNum || '';
    }
}

// Clear booking forms
function clearBookingForms() {
    // Hotel form
    if (document.getElementById('hotelName')) {
        document.getElementById('hotelName').value = '';
        document.getElementById('hotelEmail').value = '';
        document.getElementById('hotelPassport').value = '';
        document.getElementById('hotelPhone').value = '';
    }

    // Flight form
    if (document.getElementById('flightName')) {
        document.getElementById('flightName').value = '';
        document.getElementById('flightEmail').value = '';
        document.getElementById('flightPassport').value = '';
    }
}

// Modal control functions
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('loginError').style.display = 'none';
}

function openRegisterModal() {
    document.getElementById('registerModal').style.display = 'block';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('registerError').style.display = 'none';
}

function switchToRegister(e) {
    e.preventDefault();
    closeLoginModal();
    openRegisterModal();
}

function switchToLogin(e) {
    e.preventDefault();
    closeRegisterModal();
    openLoginModal();
}

// Profile modal functions
function openProfileModal() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('profileUsername').value = user.username;
        document.getElementById('profileEmail').value = user.email;
        document.getElementById('profileFullName').value = user.fullName || '';
        document.getElementById('profilePhone').value = user.phone || '';
        document.getElementById('profilePassport').value = user.passportNum || '';
        document.getElementById('profileModal').style.display = 'block';
    }
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
    document.getElementById('profileError').style.display = 'none';
    // Clear password fields
    document.getElementById('profileCurrentPassword').value = '';
    document.getElementById('profileNewPassword').value = '';
    document.getElementById('profileConfirmPassword').value = '';
}

// Confirm and delete account
function confirmDeleteAccount() {
    const confirmation = confirm(
        '⚠️ WARNING: This will permanently delete your account and all bookings.\n\n' +
        'This action cannot be undone.\n\n' +
        'Are you sure you want to delete your account?'
    );
    
    if (confirmation) {
        const finalConfirmation = confirm(
            'Final confirmation: Type your confirmation by clicking OK to proceed with account deletion.'
        );
        
        if (finalConfirmation) {
            deleteAccount();
        }
    }
}

// Delete account
async function deleteAccount() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${AUTH_API_URL}/account`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            // Clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Close modal
            closeProfileModal();
            
            // Update UI
            const authButtons = document.getElementById('authButtons');
            const userInfo = document.getElementById('userInfo');
            if (authButtons && userInfo) {
                authButtons.style.display = 'flex';
                userInfo.style.display = 'none';
            }
            
            // Clear bookings
            renderTable([]);
            clearBookingForms();
            
            // Show success message
            showNotification('Account deleted successfully');
        } else {
            showNotification('Failed to delete account: ' + data.message);
        }
    } catch (error) {
        console.error('Delete account error:', error);
        showNotification('Network error. Please try again.');
    }
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Hide and remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

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

// Helper function to get authorization headers
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

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
    const token = localStorage.getItem('token');
    if (!token) {
        // User not logged in, show empty table
        renderTable([]);
        return;
    }

    try {
        const response = await fetch(API_URL, {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401 || response.status === 403) {
            // Token expired or invalid
            logout();
            renderTable([]);
            return;
        }
        
        const bookings = await response.json();
        renderTable(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        renderTable([]);
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
// 6. Form Handling (Search Results)
// ==========================================
function initializeForms() {
    // Hotel Form
    const hotelForm = document.getElementById('hotelBookingForm');
    if (hotelForm) {
        hotelForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(hotelForm);
            const data = Object.fromEntries(formData.entries());

            // Display hotel results
            displayHotelResults(data);
        });
    }

    // Flight Form
    const flightForm = document.getElementById('flightBookingForm');
    if (flightForm) {
        flightForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(flightForm);
            const data = Object.fromEntries(formData.entries());

            // Display flight results
            displayFlightResults(data);
        });
    }
}

// Generate mock hotel results
function generateHotelResults(searchData) {
    const hotelNames = ['Grand Palace Hotel', 'Luxury Resort & Spa', 'City Center Inn', 'Beachside Paradise', 'Mountain View Lodge'];
    const ratings = [4.2, 4.5, 4.7, 4.8, 4.9];
    const nights = calculateDays(searchData.checkIn, searchData.checkOut) || 1;
    
    return hotelNames.map((name, idx) => {
        const basePrice = 80 + (idx * 40);
        const guestMultiplier = parseInt(searchData.guests) || 1;
        const roomTypeMultiplier = searchData.roomType === 'suite' ? 2 : searchData.roomType === 'deluxe' ? 1.5 : 1;
        const pricePerNight = basePrice * roomTypeMultiplier;
        const totalPrice = Math.round(pricePerNight * nights * guestMultiplier);

        return {
            name,
            destination: searchData.destination,
            rating: ratings[idx],
            pricePerNight,
            totalPrice,
            roomType: searchData.roomType,
            checkIn: searchData.checkIn,
            checkOut: searchData.checkOut,
            guests: searchData.guests,
            travelerName: searchData.travelerName,
            passportNum: searchData.passportNum,
            nights
        };
    });
}

// Display hotel results
function displayHotelResults(searchData) {
    const resultsContainer = document.getElementById('hotelResults');
    const resultsList = document.getElementById('hotelResultsList');
    const hotels = generateHotelResults(searchData);

    resultsList.innerHTML = hotels.map((hotel, idx) => `
        <div class="result-card">
            <div class="result-header">
                <h4>${hotel.name}</h4>
                <div class="rating">⭐ ${hotel.rating}</div>
            </div>
            <div class="result-details">
                <p><strong>Location:</strong> ${hotel.destination}</p>
                <p><strong>Room Type:</strong> ${hotel.roomType.charAt(0).toUpperCase() + hotel.roomType.slice(1)}</p>
                <p><strong>Check-in:</strong> ${new Date(hotel.checkIn).toLocaleDateString()} | <strong>Check-out:</strong> ${new Date(hotel.checkOut).toLocaleDateString()}</p>
                <p><strong>Guests:</strong> ${hotel.guests} | <strong>Nights:</strong> ${hotel.nights}</p>
            </div>
            <div class="result-footer">
                <div class="price-info">
                    <span class="price-per-night">$${hotel.pricePerNight}/night</span>
                    <span class="total-price">Total: $${hotel.totalPrice}</span>
                </div>
                <button class="btn btn-primary" onclick="bookHotel(${idx})">Book Now</button>
            </div>
        </div>
    `).join('');

    // Store search data for booking
    window.currentHotelSearch = hotels;

    resultsContainer.style.display = 'block';
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Generate mock flight results
function generateFlightResults(searchData) {
    const airlines = ['SkyWings Airlines', 'Global Air', 'Pacific Airways', 'Continental Express', 'Horizon Flights'];
    const times = [['08:00', '11:30'], ['10:45', '14:15'], ['13:20', '16:50'], ['16:00', '19:30'], ['19:45', '23:15']];
    
    return airlines.map((airline, idx) => {
        const basePrice = 200 + (idx * 50);
        const passengers = parseInt(searchData.passengers) || 1;
        const classMultiplier = searchData.class === 'first' ? 3 : searchData.class === 'business' ? 2 : 1;
        const pricePerPerson = basePrice * classMultiplier;
        const totalPrice = Math.round(pricePerPerson * passengers);

        return {
            airline,
            from: searchData.from,
            destination: searchData.destination,
            departureTime: times[idx][0],
            arrivalTime: times[idx][1],
            flightDate: searchData.flightDate,
            class: searchData.class,
            passengers: searchData.passengers,
            pricePerPerson,
            totalPrice,
            travelerName: searchData.travelerName,
            passportNum: searchData.passportNum,
            tripType: searchData.tripType,
            returnDate: searchData.return
        };
    });
}

// Display flight results
function displayFlightResults(searchData) {
    const resultsContainer = document.getElementById('flightResults');
    const resultsList = document.getElementById('flightResultsList');
    const flights = generateFlightResults(searchData);

    resultsList.innerHTML = flights.map((flight, idx) => `
        <div class="result-card">
            <div class="result-header">
                <h4>${flight.airline}</h4>
                <div class="flight-class">${flight.class.charAt(0).toUpperCase() + flight.class.slice(1)} Class</div>
            </div>
            <div class="result-details">
                <p><strong>Route:</strong> ${flight.from} → ${flight.destination}</p>
                <p><strong>Departure:</strong> ${new Date(flight.flightDate).toLocaleDateString()} at ${flight.departureTime}</p>
                <p><strong>Arrival:</strong> ${flight.arrivalTime} (same day)</p>
                <p><strong>Passengers:</strong> ${flight.passengers}</p>
                ${flight.tripType === 'roundtrip' && flight.returnDate ? `<p><strong>Return:</strong> ${new Date(flight.returnDate).toLocaleDateString()}</p>` : ''}
            </div>
            <div class="result-footer">
                <div class="price-info">
                    <span class="price-per-night">$${flight.pricePerPerson}/person</span>
                    <span class="total-price">Total: $${flight.totalPrice}</span>
                </div>
                <button class="btn btn-primary" onclick="bookFlight(${idx})">Book Now</button>
            </div>
        </div>
    `).join('');

    // Store search data for booking
    window.currentFlightSearch = flights;

    resultsContainer.style.display = 'block';
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Book selected hotel
window.bookHotel = async function(index) {
    const hotel = window.currentHotelSearch[index];
    const payload = {
        travelerName: hotel.travelerName,
        passportNum: hotel.passportNum,
        destination: hotel.destination,
        flightDate: hotel.checkIn,
        hotelName: `${hotel.name} (${hotel.roomType})`,
        status: 'Confirmed',
        price: hotel.totalPrice
    };

    await sendBookingData(payload, 'Hotel');
};

// Book selected flight
window.bookFlight = async function(index) {
    const flight = window.currentFlightSearch[index];
    const payload = {
        travelerName: flight.travelerName,
        passportNum: flight.passportNum,
        destination: flight.destination,
        flightDate: flight.flightDate,
        hotelName: `${flight.airline} Flight`,
        status: 'Confirmed',
        price: flight.totalPrice
    };

    await sendBookingData(payload, 'Flight');
};

async function sendBookingData(payload, type) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login to create bookings');
        openLoginModal();
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert('Session expired. Please login again.');
                logout();
                openLoginModal();
                return;
            }
            throw new Error(result.message || 'Booking failed');
        }

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

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login to delete bookings');
        openLoginModal();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, { 
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            alert('Session expired. Please login again.');
            logout();
            openLoginModal();
            return;
        }

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

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login to update bookings');
        editModal.style.display = 'none';
        openLoginModal();
        return;
    }

    const updatedData = {
        travelerName: document.getElementById('editName').value,
        destination: document.getElementById('editDestination').value,
        flightDate: document.getElementById('editDate').value,
        status: document.getElementById('editStatus').value
    };

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updatedData)
        });

        if (response.status === 401 || response.status === 403) {
            alert('Session expired. Please login again.');
            editModal.style.display = 'none';
            logout();
            openLoginModal();
            return;
        }

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

// CLOSE Confirmation Modal
window.closeModal = function() {
    const modal = document.getElementById('confirmationModal');
    if (modal) {
        modal.style.display = 'none';
    }
};