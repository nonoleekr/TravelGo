// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize Express App
const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Allow frontend to communicate with backend
app.use(bodyParser.json()); // Parse JSON data from incoming requests

// ---------------------------------------------------------
// 1. Database Connection [cite: 46, 49]
// ---------------------------------------------------------
const dbURI = 'mongodb://localhost:27017/travelgo_db';

mongoose.connect(dbURI)
    .then(() => console.log('>>> Connected to MongoDB Successfully'))
    .catch((err) => console.log('>>> Connection Error:', err));

// ---------------------------------------------------------
// 2. Mongoose Schema & Model [cite: 42, 102]
// ---------------------------------------------------------
const bookingSchema = new mongoose.Schema({
    travelerName: {
        type: String,
        required: true,
        trim: true
    },
    passportNum: {
        type: String,
        required: true,
        unique: true // Ensures no duplicate passport numbers [cite: 59]
    },
    destination: {
        type: String,
        required: true
    },
    flightDate: {
        type: Date,
        required: true
    },
    hotelName: {
        type: String,
        default: 'N/A' // Made optional as per your report
    },
    status: {
        type: String,
        enum: ['Confirmed', 'Pending', 'Cancelled'], // 
        default: 'Confirmed'
    },
    price: {
        type: Number,
        min: 0,
        default: 0
    }
});

// Create the Model
const Booking = mongoose.model('Booking', bookingSchema);

// ---------------------------------------------------------
// 3. API Routes (CRUD Operations) [cite: 103]
// ---------------------------------------------------------

// READ: Get all bookings [cite: 104]
app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE: Add a new booking [cite: 105]
app.post('/api/bookings', async (req, res) => {
    // We create a new booking object using data sent from the frontend
    const booking = new Booking({
        travelerName: req.body.travelerName,
        passportNum: req.body.passportNum,
        destination: req.body.destination,
        flightDate: req.body.flightDate,
        hotelName: req.body.hotelName,
        status: req.body.status || 'Confirmed',
        price: req.body.price
    });

    try {
        const newBooking = await booking.save();
        res.status(201).json(newBooking);
    } catch (err) {
        // Handle duplicate passport error
        if (err.code === 11000) {
            res.status(400).json({ message: 'Error: Passport Number already exists.' });
        } else {
            res.status(400).json({ message: err.message });
        }
    }
});

// UPDATE: Modify a specific booking by ID [cite: 106]
app.put('/api/bookings/:id', async (req, res) => {
    try {
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true } // Return the updated document & check validation
        );
        res.json(updatedBooking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE: Remove a booking by ID [cite: 107]
app.delete('/api/bookings/:id', async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);
        res.json({ message: 'Booking deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});