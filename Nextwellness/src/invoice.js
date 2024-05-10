const express = require("express");
const mongoose = require("mongoose");

const app = express();

// Connect to MongoDB using the URI
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/your_database_name", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.log("Cannot connect to MongoDB:", err);
    });



    const invoiceSchema = new mongoose.Schema({
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        items: [
            {
                description: String,
                quantity: Number,
                price: Number
            }
        ],
        totalAmount: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['unpaid', 'paid', 'pending'],
            default: 'pending'
        },
        paymentDate: Date
    });
    
    const Invoice = mongoose.model("Invoice", invoiceSchema);
    
    module.exports = Invoice;