// seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    travelerName: { type: String, required: true },
    passportNum: { type: String, required: true },
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
bookingSchema.index({ userId: 1, passportNum: 1 }, { unique: true });
const Booking = mongoose.model('Booking', bookingSchema);

// ==========================================
// 3. Sample Data
// ==========================================

const sampleUsers = [
    { username: "alice_wonder", email: "alice@example.com", password: "password123" },
    { username: "bob_builder", email: "bob@example.com", password: "password123" },
    { username: "charlie_brown", email: "charlie@example.com", password: "password123" },
    { username: "diana_prince", email: "diana@example.com", password: "password123" },
    { username: "edward_elric", email: "edward@example.com", password: "password123" },
    { username: "fiona_green", email: "fiona@example.com", password: "password123" },
    { username: "george_martin", email: "george@example.com", password: "password123" },
    { username: "hannah_jones", email: "hannah@example.com", password: "password123" }
];

const sampleDestinations = [
    { name: "Bangkok, Thailand" },
    { name: "Bali, Indonesia" },
    { name: "Dubai, UAE" },
    { name: "London, UK" },
    { name: "Malibu, USA" },
    { name: "New York, USA" },
    { name: "Paris, France" },
    { name: "Rome, Italy" },
    { name: "Seoul, South Korea" },
    { name: "Sydney, Australia" },
    { name: "Tokyo, Japan" },
    { name: "Venice, Italy" }
];

const sampleBookings = [
    {
        travelerName: "Alice Wonder",
        passportNum: "A10021626",
        destination: "Tokyo, Japan",
        flightDate: new Date("2025-12-01"),
        hotelName: "Shinjuku Granbell Hotel",
        status: "Confirmed",
        price: 4500
    },
    {
        travelerName: "Bob Builder",
        passportNum: "B10293847",
        destination: "Paris, France",
        flightDate: new Date("2025-11-15"),
        hotelName: "Hotel Ritz Paris",
        status: "Pending",
        price: 8200
    },
    {
        travelerName: "Charlie Brown",
        passportNum: "C10025775",
        destination: "New York, USA",
        flightDate: new Date("2026-01-10"),
        hotelName: "The Plaza",
        status: "Confirmed",
        price: 6000
    },
    {
        travelerName: "Diana Prince",
        passportNum: "D10023717",
        destination: "Seoul, South Korea",
        flightDate: new Date("2025-10-20"),
        hotelName: "Lotte Hotel Seoul",
        status: "Cancelled",
        price: 3200
    },
    {
        travelerName: "Edward Elric",
        passportNum: "E99887766",
        destination: "London, UK",
        flightDate: new Date("2025-09-05"),
        hotelName: "The Savoy",
        status: "Confirmed",
        price: 5400
    },
    {
        travelerName: "Fiona Green",
        passportNum: "F55664433",
        destination: "Rome, Italy",
        flightDate: new Date("2025-12-25"),
        hotelName: "Continental Hotel",
        status: "Pending",
        price: 7000
    },
    {
        travelerName: "George Martin",
        passportNum: "G11223344",
        destination: "Malibu, USA",
        flightDate: new Date("2025-08-15"),
        hotelName: "N/A",
        status: "Confirmed",
        price: 1200
    },
    {
        travelerName: "Hannah Jones",
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
        await User.deleteMany({});
        await Booking.deleteMany({});
        await Destination.deleteMany({});
        console.log('>>> Existing data cleared.');

        // 2. Hash password and insert users
        const hashedPassword = await bcrypt.hash('password123', 10);
        const usersToInsert = sampleUsers.map(user => ({
            ...user,
            password: hashedPassword
        }));
        const insertedUsers = await User.insertMany(usersToInsert);
        console.log('>>> 8 Users inserted with password: password123');
        console.log('>>> Usernames:', insertedUsers.map(u => u.username).join(', '));

        // 3. Insert destinations
        await Destination.insertMany(sampleDestinations);
        console.log('>>> Destinations inserted.');

        // 4. Insert bookings (distribute so each user gets at least one)
        const bookingsWithUser = sampleBookings.map((booking, idx) => ({
            ...booking,
            userId: insertedUsers[idx % insertedUsers.length]._id
        }));
        await Booking.insertMany(bookingsWithUser);
        console.log('>>> Bookings inserted and distributed across all users.');

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
