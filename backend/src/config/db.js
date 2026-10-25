const mongoose = require('mongoose');


async function main() {
    const connectionString = process.env.DB_CONNECT_STRING || process.env.MONGO_URI;
    if (!connectionString) {
        throw new Error("Database connection string is missing! Please define DB_CONNECT_STRING or MONGO_URI in your backend/.env file.");
    }
    await mongoose.connect(connectionString);
}

module.exports = main;


