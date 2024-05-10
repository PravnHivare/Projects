const mongoose = require("mongoose");
const express = require("express");
const connect = mongoose.connect("mongodb://localhost:27017/your_database_name");

connect.then(() => {
    console.log("Connected to Database");
}).catch((err) => {
    console.log("Cannot connect to database:", err);
});

const LoginSchema = new mongoose.Schema({
    name: String,
    email: String,
    ContactNumber: Number,
    Date: {
        type: String, // Storing DOB as String
        // Custom setter function to format date as "dd/mm/yyyy"
        set: function (dob) {
            if (typeof dob === 'string') {
                // Assuming incoming date is in "yyyy-mm-dd" format
                const parts = dob.split('-');
                if (parts.length === 3) {
                    // Rearrange the parts to "dd/mm/yyyy"
                    return `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
            }
            // If the format is not valid, return the original value
            return dob;
        }
    },
    Address: String,
    appointmentTime: String,
    appointmentDesc: String,
    plan: String // New field for storing the user's plan
});

const collection = mongoose.model("appointment", LoginSchema);

module.exports = collection;