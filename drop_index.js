// drop_index.js
const mongoose = require('mongoose');

const dbURI = 'mongodb://localhost:27017/travelgo_db';

mongoose.connect(dbURI)
    .then(() => {
        console.log('Connected to MongoDB');
        
        // Drop the problematic index
        mongoose.connection.collection('bookings').dropIndex('userId_1_passportNum_1', (err, result) => {
            if (err) {
                console.log('Index not found or already dropped:', err.message);
            } else {
                console.log('Index dropped successfully:', result);
            }
            
            mongoose.connection.close();
            console.log('Database connection closed');
        });
    })
    .catch((err) => {
        console.log('Connection Error:', err);
        process.exit(1);
    });
