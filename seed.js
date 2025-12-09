// seed.js
const mongoose = require('mongoose');

// ==========================================
// 1. Configuration & Connection
// ==========================================
const dbURI = 'mongodb://localhost:27017/travelgo_db';

mongoose.connect(dbURI)
    .then(() => console.log('>>> Connected to MongoDB for Seeding'))
    .catch((err) => console.log('>>> Connection Error:', err));

// ==========================================
// 2. Mongoose Schemas (Must match server.js)
// ==========================================

// Destination Schema
const destinationSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
});
const Destination = mongoose.model('Destination', destinationSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
    travelerName: { type: String, required: true },
    passportNum: { type: String, required: true, unique: true },
    destination: { type: String, required: true },
    flightDate: { type: Date, required: true },
    hotelName: { type: String, default: 'N/A' },
    status: {
        type: String,
        enum: ['Confirmed', 'Pending', 'Cancelled'],
        default: 'Confirmed'
    },
    price: { type: Number, min: 0, default: 0 }
});
const Booking = mongoose.model('Booking', bookingSchema);

// ==========================================
// 3. Sample Data
// ==========================================

const sampleDestinations = [
    { name: "Bangkok, Thailand" },
    { name: "Bali, Indonesia" },
    { name: "Dubai, UAE" },
    { name: "London, UK" },
    { name: "Malibu, USA" },      // Added to match booking data
    { name: "New York, USA" },
    { name: "Paris, France" },
    { name: "Rome, Italy" },
    { name: "Seoul, South Korea" },
    { name: "Sydney, Australia" },
    { name: "Tokyo, Japan" },
    { name: "Venice, Italy" }     // Added to match booking data
];

const sampleBookings = [
    {
        travelerName: "Ronald Lee Kai Ren",
        passportNum: "A10021626",
        destination: "Tokyo, Japan",
        flightDate: new Date("2025-12-01"),
        hotelName: "Shinjuku Granbell Hotel",
        status: "Confirmed",
        price: 4500
    },
    {
        travelerName: "Lee Ho Yi",
        passportNum: "B10293847",
        destination: "Paris, France",
        flightDate: new Date("2025-11-15"),
        hotelName: "Hotel Ritz Paris",
        status: "Pending",
        price: 8200
    },
    {
        travelerName: "ZengYu",
        passportNum: "C10025775",
        destination: "New York, USA",
        flightDate: new Date("2026-01-10"),
        hotelName: "The Plaza",
        status: "Confirmed",
        price: 6000
    },
    {
        travelerName: "Dai Ziqiu",
        passportNum: "D10023717",
        destination: "Seoul, South Korea",
        flightDate: new Date("2025-10-20"),
        hotelName: "Lotte Hotel Seoul",
        status: "Cancelled",
        price: 3200
    },
    {
        travelerName: "Sarah Connor",
        passportNum: "E99887766",
        destination: "London, UK",
        flightDate: new Date("2025-09-05"),
        hotelName: "The Savoy",
        status: "Confirmed",
        price: 5400
    },
    {
        travelerName: "John Wick",
        passportNum: "F55664433",
        destination: "Rome, Italy",
        flightDate: new Date("2025-12-25"),
        hotelName: "Continental Hotel",
        status: "Pending",
        price: 7000
    },
    {
        travelerName: "Tony Stark",
        passportNum: "G11223344",
        destination: "Malibu, USA",
        flightDate: new Date("2025-08-15"),
        hotelName: "N/A",
        status: "Confirmed",
        price: 1200
    },
    {
        travelerName: "Peter Parker",
        passportNum: "H99882211",
        destination: "Venice, Italy",
        flightDate: new Date("2025-07-01"),
        hotelName: "Hotel Danieli",
        status: "Confirmed",
        price: 2800
    }
];

// ==========================================
// 4. Execution Logic
// ==========================================

const seedDB = async () => {
    try {
        // 1. Clear existing data
        await Booking.deleteMany({});
        await Destination.deleteMany({});
        console.log('>>> Existing data cleared.');

        // 2. Insert new data
        await Destination.insertMany(sampleDestinations);
        console.log('>>> Destinations inserted.');

        await Booking.insertMany(sampleBookings);
        console.log('>>> Bookings inserted.');

        console.log('>>> SEEDING COMPLETE: Database is ready!');
    } catch (err) {
        console.log('>>> Error seeding database:', err);
    } finally {
        // 3. Close connection
        mongoose.connection.close();
        console.log('>>> Connection closed.');
    }
};

// Run the function
seedDB();