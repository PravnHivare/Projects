const mongoose = require("mongoose");
const express = require("express");

const connect = mongoose.connect("mongodb://localhost:27017/dashboard");

connect.then(() => {
    console.log("Connected to Database");
}).catch((err) => {
    console.log("Cannot connect to database:", err);
});

const LoginSchema = new mongoose.Schema({
    Treatmentname: String,
    TreatmentBenifits: String,
    TreatmentImage: String, 
    TreatmentDescription: String
});

const collection2 = mongoose.model("Treatment", LoginSchema);

module.exports = collection2;