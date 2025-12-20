// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Initialize Express App
const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key-change-in-production'; // In production, use environment variables

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
const destinationSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
});

const Destination = mongoose.model('Destination', destinationSchema);

// ---------------------------------------------------------
// User Schema & Model for Authentication
// ---------------------------------------------------------
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

// ---------------------------------------------------------
// Authentication Middleware
// ---------------------------------------------------------
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// ---------------------------------------------------------
// Authentication Routes
// ---------------------------------------------------------

// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// Get current user (protected route)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// ---------------------------------------------------------
// Route: Get All Destinations
// ---------------------------------------------------------
app.get('/api/destinations', async (req, res) => {
    try {
        // Sort alphabetically
        const destinations = await Destination.find().sort({ name: 1 });
        res.json(destinations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    travelerName: {
        type: String,
        required: true,
        trim: true
    },
    passportNum: {
        type: String,
        required: true
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

// Compound unique index - each user can have unique passport numbers
bookingSchema.index({ userId: 1, passportNum: 1 }, { unique: true });

// Create the Model
const Booking = mongoose.model('Booking', bookingSchema);

// ---------------------------------------------------------
// 3. API Routes (CRUD Operations) [cite: 103]
// ---------------------------------------------------------

// READ: Get all bookings for authenticated user [cite: 104]
app.get('/api/bookings', authenticateToken, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: new mongoose.Types.ObjectId(req.user.id) });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE: Add a new booking [cite: 105]
app.post('/api/bookings', authenticateToken, async (req, res) => {
    // We create a new booking object using data sent from the frontend
    const booking = new Booking({
        userId: req.user.id,
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
app.put('/api/bookings/:id', authenticateToken, async (req, res) => {
    try {
        // Find booking and verify ownership
        const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found or access denied' });
        }

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
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
    try {
        // Find booking and verify ownership
        const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found or access denied' });
        }

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