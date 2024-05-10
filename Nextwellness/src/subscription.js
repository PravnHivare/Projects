const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
    Email: String,
    Phone: Number,
    PlanValidity: {
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
    Plan: Number,
    SessionCount: Number, // New field to store session count
    Message: String
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;
