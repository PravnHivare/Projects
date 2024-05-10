const mongoose = require("mongoose");
const express = require("express");

const connect = mongoose.connect("mongodb://localhost:27017/dashboard");

connect.then(() => {
    console.log("Connected to Database");
}).catch((err) => {
    console.log("Cannot connect to database:", err);
});

const LoginSchema = new mongoose.Schema({
    Productname: String,
    specification: String,
    ProductImage: String, 
    ProductPrice: Number,
    ProductDescription: String
});

const collection1 = mongoose.model("products", LoginSchema);

module.exports = collection1;