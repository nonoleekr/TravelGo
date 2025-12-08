// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// Smooth Scrolling
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Update active navigation link on scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-menu a').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
});

// Set minimum dates for date inputs
function setMinDates() {
    const today = new Date().toISOString().split('T')[0];
    
    // Hotel dates
    const hotelCheckIn = document.getElementById('hotelCheckIn');
    const hotelCheckOut = document.getElementById('hotelCheckOut');
    
    if (hotelCheckIn) {
        hotelCheckIn.min = today;
        hotelCheckIn.addEventListener('change', () => {
            hotelCheckOut.min = hotelCheckIn.value;
            if (hotelCheckOut.value && hotelCheckOut.value < hotelCheckIn.value) {
                hotelCheckOut.value = '';
            }
        });
    }

    if (hotelCheckOut) {
        hotelCheckOut.min = today;
    }

    // Flight dates
    const flightDeparture = document.getElementById('flightDeparture');
    const flightReturn = document.getElementById('flightReturn');
    
    if (flightDeparture) {
        flightDeparture.min = today;
        flightDeparture.addEventListener('change', () => {
            flightReturn.min = flightDeparture.value;
            if (flightReturn.value && flightReturn.value < flightDeparture.value) {
                flightReturn.value = '';
            }
        });
    }

    if (flightReturn) {
        flightReturn.min = today;
    }
}

// Handle trip type change for flights
const tripTypeRadios = document.querySelectorAll('input[name="tripType"]');
const flightReturn = document.getElementById('flightReturn');

tripTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'oneway') {
            flightReturn.disabled = true;
            flightReturn.required = false;
            flightReturn.value = '';
        } else {
            flightReturn.disabled = false;
            flightReturn.required = true;
        }
    });
});

// Hotel Booking Form Submission
const hotelBookingForm = document.getElementById('hotelBookingForm');

if (hotelBookingForm) {
    hotelBookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(hotelBookingForm);
        const bookingData = {};
        
        formData.forEach((value, key) => {
            bookingData[key] = value;
        });

        // Validate check-out date is after check-in date
        if (bookingData.checkIn && bookingData.checkOut) {
            const checkIn = new Date(bookingData.checkIn);
            const checkOut = new Date(bookingData.checkOut);
            
            if (checkOut <= checkIn) {
                alert('Check-out date must be after check-in date');
                return;
            }

            // Calculate number of nights
            const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            bookingData.nights = nights;
        }

        // Display confirmation
        showBookingConfirmation('Hotel', bookingData);
        
        // Reset form
        hotelBookingForm.reset();
    });
}

// Flight Booking Form Submission
const flightBookingForm = document.getElementById('flightBookingForm');

if (flightBookingForm) {
    flightBookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(flightBookingForm);
        const bookingData = {};
        
        formData.forEach((value, key) => {
            bookingData[key] = value;
        });

        // Validate return date for round trips
        if (bookingData.tripType === 'roundtrip') {
            if (!bookingData.return) {
                alert('Please select a return date for round trip');
                return;
            }

            const departure = new Date(bookingData.departure);
            const returnDate = new Date(bookingData.return);
            
            if (returnDate <= departure) {
                alert('Return date must be after departure date');
                return;
            }
        }

        // Display confirmation
        showBookingConfirmation('Flight', bookingData);
        
        // Reset form
        flightBookingForm.reset();
    });
}

// Show Booking Confirmation Modal
function showBookingConfirmation(type, data) {
    const modal = document.getElementById('confirmationModal');
    const bookingDetails = document.getElementById('bookingDetails');
    
    let detailsHTML = `<h3>${type} Booking Details:</h3>`;
    
    if (type === 'Hotel') {
        detailsHTML += `
            <p><strong>Destination:</strong> ${data.destination}</p>
            <p><strong>Guest Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Phone:</strong> ${data.phone}</p>
            <p><strong>Check-in:</strong> ${formatDate(data.checkIn)}</p>
            <p><strong>Check-out:</strong> ${formatDate(data.checkOut)}</p>
            <p><strong>Nights:</strong> ${data.nights}</p>
            <p><strong>Guests:</strong> ${data.guests}</p>
            <p><strong>Room Type:</strong> ${capitalizeFirst(data.roomType)}</p>
            <p style="margin-top: 1rem; color: #10b981; font-weight: bold;">
                Confirmation sent to ${data.email}
            </p>
        `;
    } else if (type === 'Flight') {
        detailsHTML += `
            <p><strong>From:</strong> ${data.from}</p>
            <p><strong>To:</strong> ${data.to}</p>
            <p><strong>Passenger Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Trip Type:</strong> ${capitalizeFirst(data.tripType)}</p>
            <p><strong>Departure:</strong> ${formatDate(data.departure)}</p>
            ${data.return ? `<p><strong>Return:</strong> ${formatDate(data.return)}</p>` : ''}
            <p><strong>Passengers:</strong> ${data.passengers}</p>
            <p><strong>Class:</strong> ${capitalizeFirst(data.class)}</p>
            <p style="margin-top: 1rem; color: #10b981; font-weight: bold;">
                Confirmation sent to ${data.email}
            </p>
        `;
    }
    
    bookingDetails.innerHTML = detailsHTML;
    modal.style.display = 'block';
}

// Close Modal
function closeModal() {
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'none';
}

// Close modal when clicking X
const closeBtn = document.querySelector('.close');
if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('confirmationModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Utility Functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setMinDates();
    
    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});

// Handle form validation styling
document.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('invalid', (e) => {
        e.target.style.borderColor = '#ef4444';
    });
    
    input.addEventListener('input', (e) => {
        if (e.target.validity.valid) {
            e.target.style.borderColor = '#e2e8f0';
        }
    });
});
