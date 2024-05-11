const express = require("express");
const mongoose = require("mongoose");

const app = express();

// Connect to MongoDB using the URI
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nextwellness", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.log("Cannot connect to MongoDB:", err);
    });

const userSchema = new mongoose.Schema({
    Name: String, 
    ContactNumber: Number,
    DOB: {
        type: String, // Storing DOB as String
        // Custom setter function to format date as "dd/mm/yyyy"
        set: function (dob1) {
            if (typeof dob1 === 'string') {
                // Assuming incoming date is in "yyyy-mm-dd" format
                const parts = dob1.split('-');
                if (parts.length === 3) {
                    // Rearrange the parts to "dd/mm/yyyy"
                    return `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
            }
            // If the format is not valid, return the original value
            return dob1;
        }
    },
    Address: String,
    email: String,
    plan: String, // New field for storing the user's plan
    sessionCount: Number, // Total sessions based on the plan
    remainingSessions: Number, // Remaining sessions to be booked
    sessionDateTime: Date, // New field for session date and time 
    password: String, 
    isAdmin: { type: Boolean, default: false },
    picture: String, 
    consult: { 
        name: String,
        age:Number,
        contactNumber: Number,
        DOB: String,
        address: String,
        appointmentDesc: String,
        appointmentDate: String,
        appointmentTime: String
    }
});

const collection3 = mongoose.model("User", userSchema);

module.exports = collection3;


